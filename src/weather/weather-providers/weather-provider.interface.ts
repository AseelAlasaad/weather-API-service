export interface IWeatherProvider {
  name: string;
  getWeatherByCity?(city: string): Promise<WeatherResponse>;
  getWeatherByCoords?(lat: number, lon: number): Promise<WeatherResponse>;
}

export interface WeatherResponse {
  temperature: number;
  humidity: number;
  description: string;
  locationName: string;
  timestamp: Date;
}