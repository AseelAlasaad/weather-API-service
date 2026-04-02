// weather-providers/base-weather.provider.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; 
import { IWeatherProvider, WeatherResponse } from './weather-provider.interface';

@Injectable()
export abstract class BaseWeatherProvider implements IWeatherProvider {
  abstract name: string;

  constructor(protected readonly httpService: HttpService) {}

  abstract buildCityUrl(city: string): string;
  abstract buildCoordsUrl(lat: number, lon: number): string;
  abstract mapResponse(data: any): WeatherResponse;

  async getWeatherByCity(city: string): Promise<WeatherResponse> {
    const url = this.buildCityUrl(city);
    return this.fetchWeather(url);
  }

  async getWeatherByCoords(lat: number, lon: number): Promise<WeatherResponse> {
    const url = this.buildCoordsUrl(lat, lon);
    return this.fetchWeather(url);
  }

  private async fetchWeather(url: string): Promise<WeatherResponse> {
    try {
      const { data } = await firstValueFrom(this.httpService.get(url));
      return this.mapResponse(data);
    } catch (err: any) {
      throw new Error(`${this.name} failed: ${err.message}`);
    }
  }
}