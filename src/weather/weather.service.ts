// weather/weather.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TomorrowWeatherProvider } from './weather-providers/tomorrow-weather.provider';
import { WeatherAPIProvider } from './weather-providers/weatherapiprovider.provider';
import { WeatherResponse } from './weather-providers/weather-provider.interface';
import { BaseWeatherProvider } from './weather-providers/base-weather.provider';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class WeatherService {
  private providers: BaseWeatherProvider[];

  constructor(
    private prisma: PrismaService,
    private tomorrowProvider: TomorrowWeatherProvider,
    private weatherApiProvider: WeatherAPIProvider,
  ) {
    // Define provider order: primary → fallback
    this.providers = [this.tomorrowProvider, this.weatherApiProvider];
  }


  async getWeather(query: { city?: string; lat?: number; lon?: number }) {
  // 1️⃣ Validate input: either city OR coordinates
  if ((!query.city && (query.lat === undefined || query.lon === undefined)) ||
      (query.city && (query.lat !== undefined || query.lon !== undefined))) {
    throw new HttpException(
      'Provide either city OR coordinates, not both or none',
      HttpStatus.BAD_REQUEST,
    );
  }

  const errorId = uuidv4(); // unique error ID
  let lastError: any;
  let weatherRequestRecord: any;

  for (const provider of this.providers) {
    const startedAt = new Date();
    try {
      let weather: WeatherResponse;

      if (query.city) {
        weather = await provider.getWeatherByCity(query.city);
      } else {
        weather = await provider.getWeatherByCoords(query.lat!, query.lon!);
      }

      // ✅ Validate the weather object
      if (!weather || weather.temperature == null || weather.humidity == null || !weather.description) {
        throw new Error('Invalid weather data returned from provider');
      }

      // Log successful weather request
      weatherRequestRecord = await this.prisma.weatherRequest.create({
        data: {
          city: query.city,
          lat: query.lat,
          lon: query.lon,
          providerUsed: provider.name,
          temperature: weather.temperature,
          humidity: weather.humidity,
          description: weather.description,
        },
      });

      // Log provider success
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

      // ✅ Return immediately if successful
      return {
        provider: provider.name,
        weather,
        location: query.city ? { city: query.city } : { lat: query.lat, lon: query.lon },
        timestamp: new Date(),
      };
    } catch (err) {
      lastError = err;

      // Log provider failure
      if (!weatherRequestRecord) {
        weatherRequestRecord = await this.prisma.weatherRequest.create({
          data: {
            city: query.city,
            lat: query.lat,
            lon: query.lon,
            providerUsed: null,
          },
        });
      }

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

      // Continue to the next provider automatically
    }
  }

  // If all providers fail, update request with generic error
  await this.prisma.weatherRequest.update({
    where: { id: weatherRequestRecord.id },
    data: {
      description: `All providers failed. Error ID: ${errorId}`,
      updatedAt: new Date(),
    },
  });

  throw new HttpException(
    { message: 'All weather providers failed', errorId },
    HttpStatus.SERVICE_UNAVAILABLE,
  );
}
  formatError(err: any): any {
    throw new Error('Method not implemented.');
  }
}
