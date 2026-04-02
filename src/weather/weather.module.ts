// src/weather/weather.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; 
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TomorrowWeatherProvider } from './weather-providers/tomorrow-weather.provider';
import { WeatherAPIProvider } from './weather-providers/weatherapiprovider.provider';

@Module({
  imports: [
    PrismaModule,
    HttpModule, 
  ],
  controllers: [WeatherController],
  providers: [
    WeatherService,
    TomorrowWeatherProvider,
    WeatherAPIProvider,
  ],
  exports: [WeatherService],
})
export class WeatherModule {}