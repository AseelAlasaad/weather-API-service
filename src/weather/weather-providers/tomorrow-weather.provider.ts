// weather-providers/tomorrow-weather.provider.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseWeatherProvider } from './base-weather.provider';
import { WeatherResponse } from './weather-provider.interface';

@Injectable()
export class TomorrowWeatherProvider extends BaseWeatherProvider {
  name = 'TomorrowWeather';

  constructor(protected readonly httpService: HttpService) {
    super(httpService);
  }

  buildCityUrl(city: string): string {
    const apiKey = process.env.TOMORROW_API_KEY;
    return `https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(city)}&units=metric&apikey=${apiKey}`;
  }

  buildCoordsUrl(lat: number, lon: number): string {
    const apiKey = process.env.TOMORROW_API_KEY;
    return `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&units=metric&apikey=${apiKey}`;
  }

  mapResponse(data: any): WeatherResponse {
    const values = data.data.values;
    return {
      temperature: values.temperature,
      humidity: values.humidity,
      description: values.weatherCode.toString(),
      locationName: data.data.location?.name || 'Unknown',
      timestamp: new Date(),
    };
  }
}