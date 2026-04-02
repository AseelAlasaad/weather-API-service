// src/weather/weather-providers/weatherapiprovider.provider.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { WeatherAPIProvider } from './weatherapiprovider.provider';
import { WeatherResponse } from './weather-provider.interface';

describe('WeatherAPIProvider', () => {
  let provider: WeatherAPIProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherAPIProvider,
        { provide: HttpService, useValue: {} }, 
      ],
    }).compile();

    provider = module.get<WeatherAPIProvider>(WeatherAPIProvider);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('WeatherAPI');
  });

  it('should build correct city URL', () => {
    process.env.WEATHER_API_KEY = 'test-key';
    const city = 'Amman';
    const url = provider.buildCityUrl(city);
    expect(url).toBe(` https://api.weatherapi.com/v1/current.json?key=test-key&q=${city}`);
  });

  it('should build correct coordinates URL', () => {
    process.env.WEATHER_API_KEY = 'test-key';
    const lat = 31.95;
    const lon = 35.91;
    const url = provider.buildCoordsUrl(lat, lon);
    expect(url).toBe(`https://api.weatherapi.com/v1/current.json?key=test-key&q=${lat},${lon}`);
  });

  it('should map API response correctly', () => {
    const mockData = {
      main: { temp: 25, humidity: 60 },
      weather: [{ description: 'Sunny' }],
      name: 'Amman',
    };

    const result: WeatherResponse = provider.mapResponse(mockData);

    expect(result.temperature).toBe(25);
    expect(result.humidity).toBe(60);
    expect(result.description).toBe('Sunny');
    expect(result.locationName).toBe('Amman');
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});