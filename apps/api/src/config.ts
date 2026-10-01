import crypto from 'node:crypto';
import { z } from 'zod';
import { normalizeHost } from './tenant/host-normalizer.js';

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
  MEDIA_UPLOAD_ENABLED: z.enum(['true', 'false']).default('true'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_DOMAIN: z.string().optional(),
  STOREFRONT_BASE_DOMAIN: z.string().trim().toLowerCase().optional(),
  STOREFRONT_TRUST_FORWARDED_HOST: z.enum(['true', 'false']).default('false'),
  EMAIL_DELIVERY_ENABLED: z.enum(['true', 'false']).default('false'),
  NOTIFICATION_PAYLOAD_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  // SMTP fields reserved for future provider implementation; not plumbed into runtime config.
  // EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASSWORD, EMAIL_SMTP_SECURE
  ADMIN_PUBLIC_ORIGIN: z.string().optional(),
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
  mediaUploadEnabled: boolean;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2PublicDomain: string;
  storefrontBaseDomain: string;
  storefrontTrustForwardedHost: boolean;
  emailDeliveryEnabled: boolean;
  notificationPayloadKey: Buffer;
  emailFromAddress: string;
  emailFromName: string;
  adminPublicOrigin: string;
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

  const mediaUploadEnabled = value.MEDIA_UPLOAD_ENABLED === 'true';
  const r2AccountId = (value.R2_ACCOUNT_ID || env.R2_ACCOUNT_ID || '').trim();
  const r2AccessKeyId = (value.R2_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID || '').trim();
  const r2SecretAccessKey = (value.R2_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY || '').trim();
  const r2BucketName = (value.R2_BUCKET_NAME || env.R2_BUCKET_NAME || '').trim();
  let r2PublicDomain = (value.R2_PUBLIC_DOMAIN || env.R2_PUBLIC_DOMAIN || '').trim().replace(/\/+$/, '');
  if (r2PublicDomain && !/^https?:\/\//i.test(r2PublicDomain)) {
    r2PublicDomain = `https://${r2PublicDomain}`;
  }
  if (isProduction && r2PublicDomain.startsWith('http://')) {
    r2PublicDomain = r2PublicDomain.replace(/^http:\/\//i, 'https://');
  }

  // BLOCKER 2: EMAIL_DELIVERY_ENABLED=true must fail startup in production because
  // no real EmailTransportAdapter (SMTP/Resend/SES) is implemented yet.
  // Automated tests may inject MemoryTestEmailTransportAdapter directly.
  if (isProduction && value.EMAIL_DELIVERY_ENABLED === 'true') {
    throw new Error(
      'Configuración API inválida: EMAIL_DELIVERY_ENABLED no puede ser true en producción. ' +
      'No existe un proveedor de transporte de correo configurado. Desactive la entrega de correo ' +
      'hasta que un adaptador de producción esté implementado.',
    );
  }

  // Parse ADMIN_PUBLIC_ORIGIN
  const adminPublicOriginRaw = (value.ADMIN_PUBLIC_ORIGIN || env.ADMIN_PUBLIC_ORIGIN || '').trim();
  let adminPublicOrigin = '';
  if (adminPublicOriginRaw) {
    try {
      const parsed = new URL(adminPublicOriginRaw);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== adminPublicOriginRaw) {
        throw new Error('invalid');
      }
      if (isProduction && parsed.protocol !== 'https:') {
        throw new Error('must be https in production');
      }
      adminPublicOrigin = parsed.origin;
    } catch {
      throw new Error(
        'Configuración API inválida: ADMIN_PUBLIC_ORIGIN debe ser un origen HTTP(S) válido sin ruta ni credenciales',
      );
    }
  } else if (!isProduction) {
    adminPublicOrigin = 'http://localhost:3001';
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
    mediaUploadEnabled,
    r2AccountId,
    r2AccessKeyId,
    r2SecretAccessKey,
    r2BucketName,
    r2PublicDomain,
    storefrontBaseDomain: (() => {
      let baseDomain = (value.STOREFRONT_BASE_DOMAIN || '').trim().toLowerCase();
      if (isProduction) {
        if (baseDomain === 'platform.example') {
          throw new Error(
            'Configuración API inválida: STOREFRONT_BASE_DOMAIN no puede ser el marcador de posición "platform.example" en producción',
          );
        }
      } else if (!baseDomain) {
        baseDomain = 'platform.example';
      }

      if (baseDomain) {
        const normalized = normalizeHost(baseDomain);
        if (!normalized || baseDomain.includes('/') || baseDomain.includes(':')) {
          throw new Error(
            `Configuración API inválida: STOREFRONT_BASE_DOMAIN "${baseDomain}" no es un nombre de host válido`,
          );
        }
        return normalized;
      }
      return '';
    })(),
    storefrontTrustForwardedHost: value.STOREFRONT_TRUST_FORWARDED_HOST === 'true',
    emailDeliveryEnabled: value.EMAIL_DELIVERY_ENABLED === 'true',
    // BLOCKER 1: NOTIFICATION_PAYLOAD_KEY is ALWAYS required in production because
    // encrypted outbox creation is part of normal domain transactions (invitations, reservations)
    // regardless of EMAIL_DELIVERY_ENABLED.
    notificationPayloadKey: (() => {
      const raw = (value.NOTIFICATION_PAYLOAD_KEY || env.NOTIFICATION_PAYLOAD_KEY || '').trim();
      if (raw) {
        let buf = Buffer.from(raw, 'base64');
        if (buf.length !== 32 && /^[0-9a-fA-F]{64}$/.test(raw)) {
          buf = Buffer.from(raw, 'hex');
        }
        if (buf.length !== 32) {
          throw new Error('Configuración API inválida: NOTIFICATION_PAYLOAD_KEY debe tener exactamente 32 bytes (base64 o hex)');
        }
        return buf;
      }
      if (isProduction) {
        throw new Error(
          'Configuración API inválida: NOTIFICATION_PAYLOAD_KEY requerido en producción. ' +
          'La clave de encriptación del outbox es necesaria para las transacciones de invitaciones y reservas, ' +
          'independientemente de EMAIL_DELIVERY_ENABLED.',
        );
      }
      // Dev/test fallback key (32 bytes sha256)
      return crypto.createHash('sha256').update('dev-test-notification-payload-key-32b').digest();
    })(),
    emailFromAddress: (value.EMAIL_FROM_ADDRESS || env.EMAIL_FROM_ADDRESS || 'noreply@travelagency.pe').trim(),
    emailFromName: (value.EMAIL_FROM_NAME || env.EMAIL_FROM_NAME || 'Travel Agency').trim(),
    adminPublicOrigin,
  });
}
