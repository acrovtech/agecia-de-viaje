import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  APPROVED_PROVIDERS,
  getIntegrationCapabilities,
  getRequiredEnvVars,
} from './integration-capabilities';

describe('Integration Capabilities Detection Model', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('1. contains exactly the 6 approved providers', () => {
    const ids = APPROVED_PROVIDERS.map((p) => p.id);
    expect(ids).toEqual([
      'izipay',
      'culqi',
      'mercadopago',
      'stripe',
      'gcalendar',
      'whatsapp',
    ]);
  });

  it('2. never exposes secret env values in safe metadata', () => {
    process.env.IZIPAY_SHOP_ID = 'super-secret-shop-id';
    process.env.IZIPAY_TEST_PASSWORD = 'super-secret-password';
    process.env.IZIPAY_HMAC_SHA256 = 'super-secret-hmac-key';
    process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY = 'public-key';
    process.env.IZIPAY_API_URL = 'https://api.izipay.pe';

    const capabilities = getIntegrationCapabilities();

    for (const item of capabilities) {
      const serialized = JSON.stringify(item);
      expect(serialized).not.toContain('super-secret-shop-id');
      expect(serialized).not.toContain('super-secret-password');
      expect(serialized).not.toContain('super-secret-hmac-key');
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('statusLabel');
      expect(item).toHaveProperty('configured');
    }
  });

  it('3. incomplete provider env configuration does not count as configured', () => {
    delete process.env.IZIPAY_SHOP_ID;
    delete process.env.IZIPAY_TEST_PASSWORD;
    process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY = 'partial-key';

    const capabilities = getIntegrationCapabilities();
    const izipay = capabilities.find((c) => c.id === 'izipay');

    expect(izipay?.configured).toBe(false);
    expect(izipay?.status).toBe('deferred');
    expect(izipay?.statusLabel).toBe('Proveedor diferido');
  });

  it('4. detects complete configuration truthfully without claiming activated/connected', () => {
    process.env.IZIPAY_SHOP_ID = 'shop-123';
    process.env.IZIPAY_TEST_PASSWORD = 'pwd';
    process.env.IZIPAY_HMAC_SHA256 = 'hmac';
    process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY = 'key';
    process.env.IZIPAY_API_URL = 'https://api.izipay.pe';

    const capabilities = getIntegrationCapabilities();
    const izipay = capabilities.find((c) => c.id === 'izipay');

    expect(izipay?.configured).toBe(true);
    expect(izipay?.status).toBe('configuration-detected');
    expect(izipay?.statusLabel).toBe('Configuración detectada');
    // Crucial check: never claims "conectado" or "activo"
    expect(izipay?.statusLabel.toLowerCase()).not.toContain('conectado');
    expect(izipay?.statusLabel.toLowerCase()).not.toContain('activo');
  });

  it('5. stripe remains disabled regardless of environment variables', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

    const capabilities = getIntegrationCapabilities();
    const stripe = capabilities.find((c) => c.id === 'stripe');

    expect(stripe?.status).toBe('disabled');
    expect(stripe?.statusLabel).toBe('No disponible');
  });

  it('6. returns required env var names list without reading values', () => {
    const iziVars = getRequiredEnvVars('izipay');
    expect(iziVars).toContain('IZIPAY_SHOP_ID');
    expect(iziVars).toContain('IZIPAY_HMAC_SHA256');
    expect(iziVars.length).toBe(5);
  });

  it('7. all integration capability statuses and labels are in Spanish', () => {
    const capabilities = getIntegrationCapabilities();
    const approvedLabels = [
      'Proveedor diferido',
      'Configuración detectada',
      'Próximamente',
      'No disponible',
    ];
    for (const item of capabilities) {
      expect(approvedLabels).toContain(item.statusLabel);
    }
  });

  it('8. integrations section contains zero alert() calls and only approved providers', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../components/settings/sections/integrations-section.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).not.toContain('alert(');
    expect(content).not.toContain('id: \'shopify\'');
    expect(content).not.toContain('id: \'polar\'');
    expect(content).not.toContain('id: \'webhooks\'');
    expect(content).toContain('md:grid-cols-2');
    expect(content).not.toContain('md:grid-cols-3');
    expect(content).not.toContain('lg:grid-cols-3');
  });
});
