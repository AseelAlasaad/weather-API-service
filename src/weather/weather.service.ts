// src/weather/weather.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TomorrowWeatherProvider } from './weather-providers/tomorrow-weather.provider';
import { WeatherAPIProvider } from './weather-providers/weatherapiprovider.provider';
import { WeatherResponse } from './weather-providers/weather-provider.interface';
import { BaseWeatherProvider } from './weather-providers/base-weather.provider';
import { v4 as uuidv4 } from 'uuid';
import { InvalidWeatherQueryException, AllProvidersFailedException } from './errors/error-service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class WeatherService {
  private providers: BaseWeatherProvider[];
  private readonly CACHE_TTL_SECONDS = 5 * 60; // 5-minute TTL

  constructor(
    private prisma: PrismaService,
    private tomorrowProvider: TomorrowWeatherProvider,
    private weatherApiProvider: WeatherAPIProvider,
    private redisService: RedisService, // Inject Redis
  ) {
    this.providers = [this.tomorrowProvider, this.weatherApiProvider];
  }

  async getWeather(query: { city?: string; lat?: number; lon?: number }) {
    const hasCity = !!query.city;
    const hasCoords = query.lat !== undefined && query.lon !== undefined;

    if ((hasCity && hasCoords) || (!hasCity && !hasCoords)) {
      throw new InvalidWeatherQueryException();
    }

    // Validate city name if provided
    if (hasCity && !/^[a-zA-Z\s]+$/.test(query.city!)) {
      throw new InvalidWeatherQueryException();
    }

    // ----- 1. Build unique cache key -----
    const cacheKey = hasCity
      ? `weather:city:${query.city!.toLowerCase()}`
      : `weather:coords:${query.lat},${query.lon}`;

    // ----- 2. Check Redis cache -----
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const errorId = uuidv4();
    let weatherRequestRecord: any;

    // ----- 3. Create initial request record -----
    try {
      weatherRequestRecord = await this.prisma.weatherRequest.create({
        data: {
          city: query.city,
          lat: query.lat,
          lon: query.lon,
          providerUsed: null,
        },
      });
    } catch (err) {
      console.error('Failed to create weather request record', err);
      throw new AllProvidersFailedException(errorId);
    }

    // ----- 4. Try each provider with fallback -----
    for (const provider of this.providers) {
      const startedAt = new Date();
      try {
        let weather: WeatherResponse;

        if (hasCity) {
          weather = await provider.getWeatherByCity(query.city!);
        } else {
          weather = await provider.getWeatherByCoords(query.lat!, query.lon!);
        }

        // Validate provider data
        if (!weather || weather.temperature == null || weather.humidity == null || !weather.description) {
          throw new Error('Invalid weather data returned from provider');
        }

        // Log successful provider
        await this.prisma.providerLog.create({
          data: {
            provider: provider.name,
            success: true,
            error: null,
            weatherRequestId: weatherRequestRecord.id,
            startedAt,
            finishedAt: new Date(),
          },
        });

        // Update weather request record
        await this.prisma.weatherRequest.update({
          where: { id: weatherRequestRecord.id },
          data: {
            providerUsed: provider.name,
            temperature: weather.temperature,
            humidity: weather.humidity,
            description: weather.description,
            updatedAt: new Date(),
          },
        });

        // Prepare response
        const response = {
          provider: provider.name,
          weather,
          location: hasCity ? { city: query.city } : { lat: query.lat, lon: query.lon },
          timestamp: new Date(),
        };

        // ----- 5. Cache result in Redis (5 min TTL) -----
        await this.redisService.set(cacheKey, JSON.stringify(response), this.CACHE_TTL_SECONDS);

        return response;
      } catch (err) {
        // Log failure for this provider
        await this.prisma.providerLog.create({
          data: {
            provider: provider.name,
            success: false,
            error: this.formatError(err),
            weatherRequestId: weatherRequestRecord.id,
            startedAt,
            finishedAt: new Date(),
          },
        });
        // Continue to next provider
      }
    }

    // ----- 6. All providers failed -----
    await this.prisma.weatherRequest.update({
      where: { id: weatherRequestRecord.id },
      data: {
        description: `All providers failed. Error ID: ${errorId}`,
        updatedAt: new Date(),
      },
    });

    throw new AllProvidersFailedException(errorId);
  }

  private formatError(err: any): string {
    return err instanceof Error ? err.message : String(err);
  }
}