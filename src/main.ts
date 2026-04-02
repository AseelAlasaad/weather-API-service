// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './configurations/swagger.config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); 

  setupSwagger(app); 

  await app.listen(3000);
}
bootstrap();