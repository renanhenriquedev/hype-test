import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const ok =
        /^http:\/\/localhost:\d+$/i.test(origin) ||
        /^https:\/\/.*\.web\.app$/i.test(origin) ||
        /^https:\/\/.*\.firebaseapp\.com$/i.test(origin);

      return ok ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
  });

  const port = Number(process.env.PORT) || 4001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
