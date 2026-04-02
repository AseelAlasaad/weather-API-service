import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { PrismaService } from '../prisma/prisma.service';
import { TomorrowWeatherProvider } from './weather-providers/tomorrow-weather.provider';
import { WeatherAPIProvider } from './weather-providers/weatherapiprovider.provider';
import { HttpException } from '@nestjs/common';

describe('WeatherService', () => {
  let service: WeatherService;
  let prisma: PrismaService;
  let tomorrow: TomorrowWeatherProvider;
  let weatherApi: WeatherAPIProvider;

  const mockPrisma = {
    weatherRequest: { create: jest.fn(), update: jest.fn() },
    providerLog: { create: jest.fn() },
  };

  const mockTomorrow = {
    name: 'Tomorrow',
    getWeatherByCity: jest.fn(),
    getWeatherByCoords: jest.fn(),
  };
  const mockWeatherApi = {
    name: 'WeatherAPI',
    getWeatherByCity: jest.fn(),
    getWeatherByCoords: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TomorrowWeatherProvider, useValue: mockTomorrow },
        { provide: WeatherAPIProvider, useValue: mockWeatherApi },
      ],
    }).compile();

    service = module.get(WeatherService);
    prisma = module.get(PrismaService);
    tomorrow = module.get(TomorrowWeatherProvider);
    weatherApi = module.get(WeatherAPIProvider);

    // Mock formatError for testing
    service.formatError = (err: any) => err.message || 'Service unavailable';

    // Make Prisma mocks return objects with an id
    mockPrisma.weatherRequest.create.mockImplementation(async (data) => ({ id: 'req-123', ...data }));
    mockPrisma.weatherRequest.update.mockImplementation(async (data) => data);
    mockPrisma.providerLog.create.mockImplementation(async (data) => data);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BAD_REQUEST if both city and coords are provided', async () => {
    await expect(
      service.getWeather({ city: 'Amman', lat: 1, lon: 2 }),
    ).rejects.toThrow(HttpException);
  });

  it('should return weather from primary provider', async () => {
    mockTomorrow.getWeatherByCity.mockResolvedValue({
      temperature: 25,
      humidity: 50,
      description: 'Sunny',
      locationName: 'Amman',
      timestamp: new Date(),
    });

    const result = await service.getWeather({ city: 'Amman' });
    expect(result.provider).toBe('Tomorrow');
    expect(mockTomorrow.getWeatherByCity).toHaveBeenCalledWith('Amman');
  });

  it('should fallback to secondary provider if primary fails', async () => {
    mockTomorrow.getWeatherByCity.mockRejectedValue(new Error('Fail'));
    mockWeatherApi.getWeatherByCity.mockResolvedValue({
      temperature: 26,
      humidity: 55,
      description: 'Cloudy',
      locationName: 'Amman',
      timestamp: new Date(),
    });

    const result = await service.getWeather({ city: 'Amman' });
    expect(result.provider).toBe('WeatherAPI');
    expect(mockWeatherApi.getWeatherByCity).toHaveBeenCalledWith('Amman');
  });

  it('should throw 503 if all providers fail', async () => {
    mockTomorrow.getWeatherByCity.mockRejectedValue(new Error('Fail'));
    mockWeatherApi.getWeatherByCity.mockRejectedValue(new Error('Fail too'));

    await expect(service.getWeather({ city: 'Amman' })).rejects.toThrow(HttpException);
  });
});