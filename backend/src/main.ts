import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // This makes DTOs work (validates incoming data)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow frontend to call the API
  app.enableCors();

  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
}
await bootstrap();