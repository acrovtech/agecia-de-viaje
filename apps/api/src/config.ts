import { z } from 'zod';

export const API_CONFIG = Symbol('API_CONFIG');

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const origin = z.string().refine((value) => {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.origin === value;
  } catch {
    return false;
  }
}, 'Debe ser un origen HTTP(S) sin ruta, credenciales ni barra final.');
const csv = (schema: z.ZodType<string, string>) => z.string().default('').transform((value) =>
  [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))],
).pipe(z.array(schema));

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().refine((value) => /^postgres(ql)?:\/\//.test(value)),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_CORS_ORIGINS: csv(origin),
  API_PUBLIC_AGENCY_SLUGS: csv(slug),
  API_DOCS_ENABLED: z.enum(['true', 'false']).default('false'),
  API_RATE_LIMIT: z.coerce.number().int().min(1).max(10000).default(120),
  API_AUTH_ENABLED: z.enum(['true', 'false']).default('false'),
  IZIPAY_SECRET_KEY: z.string().default(''),
  IZIPAY_MODE: z.enum(['test', 'live']).default('test'),
});

export type ApiConfig = Readonly<{
  environment: 'development' | 'test' | 'production';
  databaseUrl: string;
  port: number;
  host: string;
  corsOrigins: readonly string[];
  publicAgencySlugs: readonly string[];
  docsEnabled: boolean;
  rateLimit: number;
  authEnabled: boolean;
  izipaySecretKey: string;
  izipayMode: 'test' | 'live';
}>;

export function parseConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const parsed = environmentSchema.safeParse(env);
  if (!parsed.success) {
    // Never include environment values (especially connection credentials).
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Configuración API inválida: ${fields.join(', ')}`);
  }
  const value = parsed.data;
  return Object.freeze({
    environment: value.NODE_ENV,
    databaseUrl: value.DATABASE_URL,
    port: value.API_PORT,
    host: value.API_HOST,
    corsOrigins: Object.freeze(value.API_CORS_ORIGINS),
    publicAgencySlugs: Object.freeze(value.API_PUBLIC_AGENCY_SLUGS),
    docsEnabled: value.API_DOCS_ENABLED === 'true',
    rateLimit: value.API_RATE_LIMIT,
    authEnabled: value.API_AUTH_ENABLED === 'true',
    izipaySecretKey: value.IZIPAY_SECRET_KEY,
    izipayMode: value.IZIPAY_MODE,
  });
}
