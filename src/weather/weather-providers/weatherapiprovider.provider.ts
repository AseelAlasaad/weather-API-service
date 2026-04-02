import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BaseWeatherProvider } from './base-weather.provider';
import { WeatherResponse } from './weather-provider.interface';

@Injectable()
export class WeatherAPIProvider extends BaseWeatherProvider {
  name = 'WeatherAPI';

  constructor(protected readonly httpService: HttpService) {
    super(httpService);
  }

  buildCityUrl(city: string): string {
     const apiKey = process.env.WEATHER_API_KEY;
    return ` https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
  }

  buildCoordsUrl(lat: number, lon: number): string {
     const apiKey = process.env.WEATHER_API_KEY;
    return `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;
  }

  mapResponse(data: any): WeatherResponse {
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      locationName: data.name,
      timestamp: new Date(),
    };
  }
}