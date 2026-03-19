import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Seguridad: headers HTTP (debe ir antes de cualquier otro middleware)
  app.use(helmet());

  // Configurar CORS
  const corsOrigin = configService.get<string>('cors.origin');

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configurar compression
  app.use(compression());

  // Configurar cookie-parser
  app.use(cookieParser());

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Interceptores globales: logging → timeout → transform
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
    new TransformInterceptor(),
  );

  // Filtros de excepciones (el último registrado se ejecuta primero: Prisma → All)
  const isProduction = configService.get<string>('app.nodeEnv') === 'production';
  app.useGlobalFilters(new AllExceptionsFilter(isProduction), new PrismaExceptionFilter());

  // Swagger (ruta por defecto recomendada por NestJS: 'api')
  const config = new DocumentBuilder()
    .setTitle('Snacks E-commerce API')
    .setDescription(
      'API REST para el backend del e-commerce de snacks. Autenticación por JWT (cookie o Bearer).',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'JWT',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/swagger', app, document);

  const port = configService.get<number>('app.port') || 4000;
  const nodeEnv = configService.get<string>('app.nodeEnv');

  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/swagger`);
  console.log(`📦 Entorno: ${nodeEnv}`);
  console.log(`🌐 CORS habilitado para: ${corsOrigin}`);
}

bootstrap();
