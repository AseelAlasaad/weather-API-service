import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TomorrowWeatherProvider } from './weather-providers/tomorrow-weather.provider';
import { WeatherAPIProvider } from './weather-providers/weatherapiprovider.provider';
import { WeatherResponse } from './weather-providers/weather-provider.interface';
import { BaseWeatherProvider } from './weather-providers/base-weather.provider';
import { v4 as uuidv4 } from 'uuid';
import { InvalidWeatherQueryException, AllProvidersFailedException } from './errors/error-service';

@Injectable()
export class WeatherService {
  private providers: BaseWeatherProvider[];

  constructor(
    private prisma: PrismaService,
    private tomorrowProvider: TomorrowWeatherProvider,
    private weatherApiProvider: WeatherAPIProvider,
  ) {
    this.providers = [this.tomorrowProvider, this.weatherApiProvider];
  }

  async getWeather(query: { city?: string; lat?: number; lon?: number }) {
    const hasCity = !!query.city;
    const hasCoords = query.lat !== undefined && query.lon !== undefined;

    if ((hasCity && hasCoords) || (!hasCity && !hasCoords)) {
      throw new InvalidWeatherQueryException();
    }

    if (hasCity) {
      const city: string = query.city!;
      if (!/^[a-zA-Z\s]+$/.test(city)) {
        throw new InvalidWeatherQueryException();
      }
    }

    const errorId = uuidv4();
    let weatherRequestRecord: any;

    // ----- 2. Create initial request record -----
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

    // ----- 3. Try each provider with fallback -----
    for (const provider of this.providers) {
      const startedAt = new Date();
      try {
        let weather: WeatherResponse;

        if (hasCity) {
          weather = await provider.getWeatherByCity(query.city!); // safe with !
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

        // Return structured response
        return {
          provider: provider.name,
          weather,
          location: hasCity ? { city: query.city } : { lat: query.lat, lon: query.lon },
          timestamp: new Date(),
        };
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
        // Continue to next provider automatically
      }
    }

    // ----- 4. All providers failed -----
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