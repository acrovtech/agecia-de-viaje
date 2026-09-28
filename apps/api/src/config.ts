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
  API_CHECKOUT_ENABLED: z.enum(['true', 'false']).default('false'),
  IZIPAY_SECRET_KEY: z.string().default(''),
  IZIPAY_HMAC_SHA256: z.string().optional(),
  IZIPAY_SHOP_ID: z.string().optional(),
  IZIPAY_PASSWORD: z.string().optional(),
  IZIPAY_TEST_PASSWORD: z.string().optional(),
  IZIPAY_API_URL: z.string().optional(),
  IZIPAY_CURRENCY: z.string().default('USD'),
  IZIPAY_MODE: z.enum(['test', 'live']).default('test'),
  PAYMENT_SESSION_REUSE_DURATION_MS: z.coerce.number().int().min(1000).default(14 * 60 * 1000),
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
  checkoutEnabled: boolean;
  izipaySecretKey: string;
  izipayHmacSha256: string;
  izipayShopId: string;
  izipayPassword: string;
  izipayApiUrl: string;
  izipayCurrency: string;
  izipayMode: 'test' | 'live';
  paymentSessionReuseDurationMs: number;
}>;

export function parseConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const parsed = environmentSchema.safeParse(env);
  if (!parsed.success) {
    // Never include environment values (especially connection credentials).
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Configuración API inválida: ${fields.join(', ')}`);
  }
  const value = parsed.data;
  const isProduction = value.NODE_ENV === 'production';
  const checkoutEnabled = value.API_CHECKOUT_ENABLED === 'true' || value.NODE_ENV === 'test';

  let izipayPassword = '';
  let izipaySecretKey = '';
  let izipayShopId = '';

  if (isProduction) {
    // Strict production isolation: do not satisfy IZIPAY_PASSWORD from TEST_PASSWORD, SECRET_KEY, or HMAC
    izipayPassword = (value.IZIPAY_PASSWORD || env.IZIPAY_PASSWORD || '').trim();
    izipaySecretKey = (value.IZIPAY_SECRET_KEY || env.IZIPAY_SECRET_KEY || '').trim();
    izipayShopId = (value.IZIPAY_SHOP_ID || env.IZIPAY_SHOP_ID || '').trim();
  } else {
    izipayPassword = (
      value.IZIPAY_PASSWORD ||
      env.IZIPAY_PASSWORD ||
      value.IZIPAY_TEST_PASSWORD ||
      env.IZIPAY_TEST_PASSWORD ||
      env.IZIPAY_PASSWORD_TEST ||
      env.IZIPAY_SECRET_KEY ||
      ''
    ).trim();
    izipaySecretKey = (value.IZIPAY_SECRET_KEY || env.IZIPAY_SECRET_KEY || izipayPassword).trim();
    izipayShopId = (value.IZIPAY_SHOP_ID || env.IZIPAY_SHOP_ID || env.IZIPAY_USERNAME || '').trim();
  }

  const izipayHmacSha256 = (value.IZIPAY_HMAC_SHA256 || env.IZIPAY_HMAC_SHA256 || '').trim();
  const izipayApiUrl = (value.IZIPAY_API_URL || env.IZIPAY_API_URL || 'https://api.micuentaweb.pe').trim();
  const izipayCurrency = (value.IZIPAY_CURRENCY || env.IZIPAY_CURRENCY || 'USD').toUpperCase().trim();

  if (isProduction && checkoutEnabled) {
    if (!izipayShopId) {
      throw new Error('Configuración API inválida: IZIPAY_SHOP_ID requerido para checkout en producción');
    }
    if (!izipayPassword) {
      throw new Error('Configuración API inválida: IZIPAY_PASSWORD requerido para checkout en producción');
    }
    if (!izipayApiUrl) {
      throw new Error('Configuración API inválida: IZIPAY_API_URL requerido para checkout en producción');
    }
    if (!izipayCurrency || izipayCurrency.length !== 3) {
      throw new Error('Configuración API inválida: IZIPAY_CURRENCY requerido para checkout en producción');
    }
    if (!value.API_PUBLIC_AGENCY_SLUGS || value.API_PUBLIC_AGENCY_SLUGS.length === 0) {
      throw new Error('Configuración API inválida: API_PUBLIC_AGENCY_SLUGS requerido para checkout en producción');
    }
  }

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
    checkoutEnabled,
    izipaySecretKey,
    izipayHmacSha256,
    izipayShopId,
    izipayPassword,
    izipayApiUrl,
    izipayCurrency,
    izipayMode: value.IZIPAY_MODE,
    paymentSessionReuseDurationMs: value.PAYMENT_SESSION_REUSE_DURATION_MS,
  });
}
