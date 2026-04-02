// src/weather/weather.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GetWeatherDto } from './dto/weather.dto';

describe('WeatherController', () => {
  let weatherController: WeatherController;
  let service: WeatherService;

  // Mock WeatherService
  const mockWeatherService = {
    getWeather: jest.fn(),
  };

  // Silence console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [{ provide: WeatherService, useValue: mockWeatherService }],
    })
      // Mock ThrottlerGuard
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    weatherController = module.get<WeatherController>(WeatherController);
    service = module.get<WeatherService>(WeatherService);
  });

  it('should be defined', () => {
    expect(weatherController).toBeDefined();
  });

    // Health check endpoint test
  describe('healthCheck', () => {
    it('should return status ok and a timestamp', () => {
      const result = weatherController.healthCheck();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      // Validate timestamp is a valid ISO string
      expect(new Date(result.timestamp).toISOString()).toEqual(result.timestamp);
    });
  });

  it('should return weather successfully', async () => {
    const mockResponse = {
      provider: 'Tomorrow',
      weather: { temperature: 25, humidity: 50, description: 'Sunny' },
      location: { city: 'Amman' },
      timestamp: new Date(),
    };
    mockWeatherService.getWeather.mockResolvedValue(mockResponse);

    const result = await weatherController.getWeather({ city: 'Amman' } as GetWeatherDto);
    expect(result).toEqual(mockResponse);
    expect(mockWeatherService.getWeather).toHaveBeenCalledWith({ city: 'Amman' });
  });

  it('should throw BadRequestException for invalid query', async () => {
    mockWeatherService.getWeather.mockImplementation(() => {
      throw new BadRequestException('Invalid query');
    });

    await expect(weatherController.getWeather({} as GetWeatherDto)).rejects.toThrow(BadRequestException);
  });

  it('should throw ServiceUnavailableException if providers fail', async () => {
    mockWeatherService.getWeather.mockImplementation(() => {
      throw new ServiceUnavailableException('All providers failed');
    });

    await expect(weatherController.getWeather({ city: 'Amman' } as GetWeatherDto)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('should throw InternalServerErrorException for unexpected errors', async () => {
    mockWeatherService.getWeather.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    await expect(weatherController.getWeather({ city: 'Amman' } as GetWeatherDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should reject requests exceeding rate limit', async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [WeatherController],
    providers: [{ provide: WeatherService, useValue: mockWeatherService }],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => false })
    .compile();

  const controller = module.get<WeatherController>(WeatherController);

  await expect(controller.getWeather({ city: 'Amman' } as GetWeatherDto)).rejects.toThrow();
});
});