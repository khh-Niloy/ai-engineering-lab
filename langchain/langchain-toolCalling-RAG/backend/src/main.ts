import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  TransformInterceptor,
  LoggingInterceptor,
  ExecutionTimeInterceptor,
} from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Configure CORS
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : true;

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Response-Time'],
  });

  // Global structured exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors (Logging, Execution Timing, Transform response)
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ExecutionTimeInterceptor(),
    new TransformInterceptor(),
  );

  const port = process.env.PORT ?? 5000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://0.0.0.0:${port}`);
}
void bootstrap();
