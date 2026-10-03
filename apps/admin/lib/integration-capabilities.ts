import 'server-only';

export type IntegrationId =
  | 'izipay'
  | 'culqi'
  | 'mercadopago'
  | 'stripe'
  | 'gcalendar'
  | 'whatsapp';

export type IntegrationAvailability =
  | 'not-configured'
  | 'configuration-detected'
  | 'coming-soon'
  | 'deferred'
  | 'disabled';

export interface SafeIntegrationCapability {
  id: IntegrationId;
  name: string;
  category: 'payments' | 'tools';
  status: IntegrationAvailability;
  statusLabel: string;
  badgeVariant: 'amber' | 'purple' | 'neutral' | 'emerald';
  configured: boolean;
}

interface ProviderEnvContract {
  id: IntegrationId;
  name: string;
  category: 'payments' | 'tools';
  requiredEnvVars: string[];
}

export const APPROVED_PROVIDERS: ProviderEnvContract[] = [
  {
    id: 'izipay',
    name: 'Izipay',
    category: 'payments',
    requiredEnvVars: [
      'NEXT_PUBLIC_IZIPAY_PUBLIC_KEY',
      'IZIPAY_SHOP_ID',
      'IZIPAY_TEST_PASSWORD',
      'IZIPAY_HMAC_SHA256',
      'IZIPAY_API_URL',
    ],
  },
  {
    id: 'culqi',
    name: 'Culqi',
    category: 'payments',
    requiredEnvVars: ['CULQI_SECRET_KEY', 'NEXT_PUBLIC_CULQI_PUBLIC_KEY'],
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    category: 'payments',
    requiredEnvVars: ['MERCADOPAGO_ACCESS_TOKEN', 'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    requiredEnvVars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  },
  {
    id: 'gcalendar',
    name: 'Google Calendar',
    category: 'tools',
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud API',
    category: 'tools',
    requiredEnvVars: ['WHATSAPP_API_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
  },
];

export function getRequiredEnvVars(id: IntegrationId): string[] {
  const provider = APPROVED_PROVIDERS.find((p) => p.id === id);
  return provider ? [...provider.requiredEnvVars] : [];
}

function isProviderConfigured(provider: ProviderEnvContract): boolean {
  if (!provider.requiredEnvVars || provider.requiredEnvVars.length === 0) {
    return false;
  }
  return provider.requiredEnvVars.every((key) => {
    const value = process.env[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

/**
 * Returns safe serializable capability metadata for approved integrations.
 * NEVER returns secret environment variable values to the client.
 */
export function getIntegrationCapabilities(): SafeIntegrationCapability[] {
  return APPROVED_PROVIDERS.map((provider) => {
    const configured = isProviderConfigured(provider);

    let status: IntegrationAvailability;
    let statusLabel: string;
    let badgeVariant: 'amber' | 'purple' | 'neutral' | 'emerald';

    if (provider.id === 'izipay') {
      if (configured) {
        status = 'configuration-detected';
        statusLabel = 'Configuración detectada';
        badgeVariant = 'emerald';
      } else {
        status = 'deferred';
        statusLabel = 'Proveedor diferido';
        badgeVariant = 'amber';
      }
    } else if (provider.id === 'stripe') {
      // Stripe is specifically disabled in the current phase as required by business policy
      status = 'disabled';
      statusLabel = 'No disponible';
      badgeVariant = 'neutral';
    } else {
      if (configured) {
        status = 'configuration-detected';
        statusLabel = 'Configuración detectada';
        badgeVariant = 'emerald';
      } else {
        status = 'coming-soon';
        statusLabel = 'Próximamente';
        badgeVariant = 'purple';
      }
    }

    return {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      status,
      statusLabel,
      badgeVariant,
      configured,
    };
  });
}
