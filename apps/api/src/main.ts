import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { createApplication } from './application.js';
import { parseConfig } from './config.js';

async function bootstrap() {
  if (existsSync('.env')) loadEnvFile('.env');
  const config = parseConfig(process.env);
  const app = await createApplication(config);
  await app.listen(config.port, config.host);
}

bootstrap().catch(() => {
  // Startup exceptions may contain secrets. Validate configuration without printing values.
  console.error('No se pudo iniciar la API. Revise configuración, puerto y dependencias.');
  process.exitCode = 1;
});
