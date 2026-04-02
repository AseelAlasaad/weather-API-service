import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class BrowserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Return a fixed key for browser/Swagger requests
    return req.headers['x-forwarded-for'] || 'docker-browser';
  }
}