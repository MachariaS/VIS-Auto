import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { SocketIOAdapter } from './shared/socket-io.adapter';

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
  // Trust Railway's / Heroku's load-balancer proxy so req.secure reflects HTTPS
  // correctly — required for SameSite=None cookies to be marked Secure.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  app.use(cookieParser());

  const frontendUrl = process.env.FRONTEND_URL;

  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // All *.vercel.app deployments — covers production (vis-auto.vercel.app),
    // preview (vis-auto-git-develop-*.vercel.app), and per-commit previews.
    // Railway and Heroku both set NODE_ENV=production so we can't use that
    // to distinguish staging from prod; allow all Vercel origins on both.
    /https:\/\/.*\.vercel\.app$/,
    // Custom production domain
    'https://www.vis-auto.tech',
    'https://vis-auto.tech',
  ];

  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
    allowedOrigins.push(frontendUrl.replace('https://', 'https://www.'));
    allowedOrigins.push(frontendUrl.replace('https://www.', 'https://'));
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Socket.IO adapter — uses the same allowedOrigins so WS CORS matches HTTP CORS
  app.useWebSocketAdapter(new SocketIOAdapter(app, allowedOrigins));

  // All routes are prefixed with /api (e.g. /api/auth/login, /api/users/me).
  // The /health endpoint is excluded so Railway's health check still works.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger UI — available at /api/docs on all environments
  const swaggerConfig = new DocumentBuilder()
    .setTitle('VIS Auto API')
    .setDescription('Roadside assistance platform — full API reference')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('health', 'Service health check')
    .addTag('auth', 'Registration, login, OTP verification, password reset')
    .addTag('users', 'User profile, password, availability, account management')
    .addTag('vehicles', 'Customer vehicle management')
    .addTag('service-catalog', 'Browse available service types')
    .addTag('provider-services', 'Provider service listings and availability')
    .addTag('providers', 'Public provider profiles and ratings')
    .addTag('roadside-requests', 'Job requests, dispatch, tracking, cancellation')
    .addTag('ratings', 'Job ratings and reviews')
    .addTag('notifications', 'In-app notification management')
    .addTag('locations', 'Address search, geocoding, routing')
    .addTag('vendors', 'Provider vendor network management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`API running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
