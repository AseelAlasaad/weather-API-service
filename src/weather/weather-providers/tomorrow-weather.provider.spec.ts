import { TomorrowWeatherProvider } from './tomorrow-weather.provider';

describe('TomorrowWeatherProvider', () => {
  let provider: TomorrowWeatherProvider;

  beforeEach(() => {
    provider = new TomorrowWeatherProvider({} as any); 
    process.env.TOMORROW_API_KEY = 'test-api-key';
  });

  it('should map response correctly', () => {
    const mockData = {
      data: {
        values: {
          temperature: 25,
          humidity: 60,
          weatherCode: 1000,
        },
        location: { name: 'Amman' },
      },
    };

    const result = provider.mapResponse(mockData);

    expect(result.temperature).toBe(25);
    expect(result.humidity).toBe(60);
    expect(result.description).toBe('1000');
    expect(result.locationName).toBe('Amman');
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should build correct city URL', () => {
    const url = provider.buildCityUrl('Amman');
    expect(url).toContain('Amman');
    expect(url).toContain(process.env.TOMORROW_API_KEY);
  });

  it('should build correct coords URL', () => {
    const url = provider.buildCoordsUrl(31.95, 35.91);
    expect(url).toContain('31.95,35.91');
    expect(url).toContain(process.env.TOMORROW_API_KEY);
  });
});