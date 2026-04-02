// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WeatherModule } from './weather/weather.module';
import { RateLimiterModule } from './common/rate-limiter/rate-limiter.module';

@Module({
  imports: [
    PrismaModule,
    WeatherModule,   
    RateLimiterModule,
  ],
  controllers: [AppController], 
  providers: [AppService],      
})
export class AppModule {}