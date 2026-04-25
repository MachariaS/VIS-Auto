import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

function validateProductionSecrets() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  const jwtSecret = process.env.JWT_SECRET ?? '';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET ?? '';

  const weakPatterns = ['secret', 'dev', 'change', 'example', 'test', '123'];

  const isWeak = (s: string) =>
    s.length < 32 || weakPatterns.some((p) => s.toLowerCase().includes(p));

  if (isProd && isWeak(jwtSecret)) {
    throw new Error('JWT_SECRET is missing or too weak for production. Use a random 32+ character string.');
  }

  if (isProd && isWeak(refreshSecret)) {
    throw new Error('REFRESH_TOKEN_SECRET is missing or too weak for production. Use a random 32+ character string.');
  }

  if (isProd && !process.env.FRONTEND_URL) {
    logger.warn('FRONTEND_URL is not set — CORS will only allow localhost origins.');
  }

  if (isProd) {
    logger.log('Production secret validation passed.');
  }
}

async function bootstrap() {
  validateProductionSecrets();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  app.use(cookieParser());

  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    frontendUrl,
    frontendUrl ? frontendUrl.replace('https://', 'https://www.') : undefined,
    frontendUrl ? frontendUrl.replace('https://www.', 'https://') : undefined,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`API running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
}

bootstrap();
