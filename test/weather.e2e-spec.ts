import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';

describe('Weather API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ✅ Success
  it('/weather (GET) success', () => {
    return request(app.getHttpServer())
      .get('/weather?city=Amman')
      .expect(200)
      .expect(res => {
        expect(res.body.weather).toBeDefined();
      });
  });

  // ✅ Validation error
  it('/weather (GET) should return 400', () => {
    return request(app.getHttpServer())
      .get('/weather')
      .expect(400);
  });

  // ✅ 503 error
  it('/weather (GET) should return 503 when all providers fail', () => {
    return request(app.getHttpServer())
      .get('/weather?city=InvalidCityXYZ')
      .expect(503);
  });

  // ✅ Rate limit test
  it('should trigger rate limit', async () => {
    for (let i = 0; i < 12; i++) {
      await request(app.getHttpServer()).get('/weather?city=Amman');
    }

    const res = await request(app.getHttpServer())
      .get('/weather?city=Amman');

    expect(res.status).toBe(429);
  });
});