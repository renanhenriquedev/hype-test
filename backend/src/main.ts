import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [process.env.FRONTEND_URL],
    allowedHeaders: [
      'Access-Control-Allow-Headers',
      'Access-Control-Max-Age',
      'Authorization',
      'Content-Type',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.PORT) || 4001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
