// src/common/rate-limiter/rate-limiter.module.ts
import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,   // seconds
          limit: 10, // max requests per TTL
        },
      ],
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimiterModule {}