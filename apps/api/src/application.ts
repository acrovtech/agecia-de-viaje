import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { ApiConfig } from './config.js';
import { ApiErrorFilter } from './http/error.filter.js';

export function configureApplication(app: NestExpressApplication, config: ApiConfig) {
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Request-Id', randomUUID());
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(helmet());
  app.enableCors({
    origin: [...config.corsOrigins], credentials: false,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'], exposedHeaders: ['X-Request-Id'],
  });
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalFilters(new ApiErrorFilter());
  if (config.docsEnabled) {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('Travel SaaS API')
      .setDescription('API v1 de catálogo por agencia y autenticación con membresías cuando está habilitada. Checkout no disponible en producción.')
      .addBearerAuth()
      .setVersion('1.0.0').build());
    SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'openapi.json' });
  }
  return app;
}

export async function createApplication(config: ApiConfig) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(config), {
    abortOnError: false, bodyParser: true,
  });
  configureApplication(app, config);
  app.enableShutdownHooks();
  return app;
}
