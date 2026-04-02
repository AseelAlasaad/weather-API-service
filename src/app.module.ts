import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { WeatherModule } from './weather/weather.module';
import { BrowserThrottlerGuard } from './common/guards/browser-throttler.guard';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60s in ms
        limit: 5,   // max 5 requests per ttl
      },
    ]),
    WeatherModule,
    RedisModule
  ],
  providers: [
    
    {
      provide: APP_GUARD,
      useClass: BrowserThrottlerGuard,
    },
  ],
})
export class AppModule {}