import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { AppModule } from '../dist/app.module.js';
import { configureApplication } from '../dist/application.js';
import { parseConfig } from '../dist/config.js';
import { PrismaService } from '../dist/database/prisma.service.js';

function config(overrides = {}) {
  return parseConfig({
    NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/api_test',
    IZIPAY_SECRET_KEY: 'test_secret_key',
    API_PUBLIC_AGENCY_SLUGS: 'agency-a,agency-b,inactive',
    API_CORS_ORIGINS: 'https://agency-a.example', API_RATE_LIMIT: '10000',
    ...overrides,
  });
}

async function application(settings, prisma, controllers = []) {
  const builder = Test.createTestingModule({ imports: [AppModule.register(settings)], controllers });
  if (prisma) builder.overrideProvider(PrismaService).useValue(prisma);
  const module = await builder.compile();
  const app = module.createNestApplication({ logger: false, bodyParser: true });
  configureApplication(app, settings);
  await app.init();
  return app;
}

export { config, application };
