import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const env = configService.get<string>('app.env', 'development');
  const frontendUrl = configService.get<string>('app.frontendUrl', 'http://localhost:3001');

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: env === 'production' ? [frontendUrl] : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.setGlobalPrefix('api/v1');
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TravelHues API')
      .setDescription('TravelHues – Travel content & commerce platform API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('creators', 'Creator profiles and content')
      .addTag('destinations', 'Countries, cities and regions')
      .addTag('content', 'Travel reels and photos')
      .addTag('tips', 'Travel tips by creators')
      .addTag('products', 'Creator products (activities, stays, itineraries etc.)')
      .addTag('trips', 'User trip planning')
      .addTag('orders', 'Product orders')
      .addTag('bookings', 'Service bookings')
      .addTag('subscriptions', 'Subscription plans')
      .addTag('media', 'File uploads')
      .addTag('notifications', 'User notifications')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`TravelHues API running on http://localhost:${port}/api/v1`);
  if (env !== 'production') {
    console.log(`Swagger docs at http://localhost:${port}/api`);
  }
}

bootstrap();
