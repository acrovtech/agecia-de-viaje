import { describe, it, expect } from 'vitest';
import {
  SETTINGS_NAV_ITEMS,
  getSettingsConfigByPath,
  getSettingsConfigByLegacyTab,
} from './settings-navigation';

describe('Settings Navigation and Canonical Routing Architecture', () => {
  it('1. contains all 10 approved product settings sections in the exact hierarchy', () => {
    const ids = SETTINGS_NAV_ITEMS.map((item) => item.id);
    expect(ids).toEqual([
      'overview',
      'profile',
      'general',
      'appearance',
      'referrals',
      'security-legal',
      'billing',
      'plans',
      'social',
      'integrations',
    ]);
  });

  it('2. maps canonical pathname routes correctly', () => {
    expect(getSettingsConfigByPath('/settings').id).toBe('overview');
    expect(getSettingsConfigByPath('/settings/profile').id).toBe('profile');
    expect(getSettingsConfigByPath('/settings/general').id).toBe('general');
    expect(getSettingsConfigByPath('/settings/appearance').id).toBe('appearance');
    expect(getSettingsConfigByPath('/settings/referrals').id).toBe('referrals');
    expect(getSettingsConfigByPath('/settings/billing').id).toBe('billing');
    expect(getSettingsConfigByPath('/settings/plans').id).toBe('plans');
    expect(getSettingsConfigByPath('/settings/security').id).toBe('security-legal');
    expect(getSettingsConfigByPath('/settings/security/legal').id).toBe('security-legal');
    expect(getSettingsConfigByPath('/settings/social').id).toBe('social');
    expect(getSettingsConfigByPath('/settings/integrations').id).toBe('integrations');
  });

  it('3. maps legacy ?tab= query parameters to canonical destination routes', () => {
    expect(getSettingsConfigByLegacyTab('resumen')?.href).toBe('/settings');
    expect(getSettingsConfigByLegacyTab('perfil')?.href).toBe('/settings/profile');
    expect(getSettingsConfigByLegacyTab('general')?.href).toBe('/settings/general');
    expect(getSettingsConfigByLegacyTab('aspecto')?.href).toBe('/settings/appearance');
    expect(getSettingsConfigByLegacyTab('referidos')?.href).toBe('/settings/referrals');
    expect(getSettingsConfigByLegacyTab('facturacion')?.href).toBe('/settings/billing');
    expect(getSettingsConfigByLegacyTab('planes')?.href).toBe('/settings/plans');
    expect(getSettingsConfigByLegacyTab('seguridad')?.href).toBe('/settings/security/legal');
    expect(getSettingsConfigByLegacyTab('social')?.href).toBe('/settings/social');
    expect(getSettingsConfigByLegacyTab('integraciones')?.href).toBe('/settings/integrations');
    expect(getSettingsConfigByLegacyTab('unknown')).toBeNull();
  });
});
