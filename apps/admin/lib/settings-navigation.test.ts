import { describe, it, expect } from 'vitest';
import {
  SETTINGS_NAV_ITEMS,
  SETTINGS_GROUPS,
  getSettingsConfigByPath,
  getSettingsConfigByLegacyTab,
  getSettingsNavSections,
  getSettingsOverviewCards,
} from './settings-navigation';
import { canAccessTeamUi, TEAM_UI_ALLOWED_ROLES } from './team-auth';

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

  it('4. canonicalizes legacy ?tab=resumen redirect while removing tab param and preserving other params', () => {
    function resolveLegacyTabRedirect(params: Record<string, string | undefined>) {
      if (typeof params.tab === 'string') {
        const target = getSettingsConfigByLegacyTab(params.tab);
        if (target) {
          const q = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            if (key !== 'tab' && typeof value === 'string') {
              q.set(key, value);
            }
          }
          const qStr = q.toString() ? `?${q.toString()}` : '';
          return `${target.href}${qStr}`;
        }
      }
      return null;
    }

    // ?tab=resumen -> /settings (tab stripped, no query)
    expect(resolveLegacyTabRedirect({ tab: 'resumen' })).toBe('/settings');

    // ?tab=resumen&ref=promo -> /settings?ref=promo (tab stripped, other params preserved)
    expect(resolveLegacyTabRedirect({ tab: 'resumen', ref: 'promo' })).toBe('/settings?ref=promo');

    // ?tab=facturacion&period=annual -> /settings/billing?period=annual
    expect(resolveLegacyTabRedirect({ tab: 'facturacion', period: 'annual' })).toBe('/settings/billing?period=annual');
  });

  it('5. single source of truth provides canonical sidebar sections and overview cards', () => {
    const sections = getSettingsNavSections();
    expect(sections).toHaveLength(5);
    expect(sections.map((s) => s.id)).toEqual(['account', 'security', 'billing', 'social', 'integrations']);

    const cards = getSettingsOverviewCards();
    expect(cards).toHaveLength(9);
    expect(cards.find((c) => c.id === 'overview')).toBeUndefined();

    // Verify payment status consistency on Integrations
    const integrationsCard = cards.find((c) => c.id === 'integrations');
    expect(integrationsCard).toBeDefined();
    expect(integrationsCard?.overviewBadge).toBe('PROVEEDOR DIFERIDO');
    expect(integrationsCard?.overviewBadge).not.toContain('IZIPAY ACTIVO');
  });

  it('6. Team UI authorization allows only OWNER and ADMIN, strictly denying OPERATOR', () => {
    expect(TEAM_UI_ALLOWED_ROLES).toEqual(['OWNER', 'ADMIN']);
    expect(canAccessTeamUi('OWNER')).toBe(true);
    expect(canAccessTeamUi('ADMIN')).toBe(true);
    expect(canAccessTeamUi('OPERATOR')).toBe(false);
    expect(canAccessTeamUi('EDITOR')).toBe(false);
    expect(canAccessTeamUi('VIEWER')).toBe(false);
  });

  it('7. Settings layout never passes a callback prop across RSC boundary into AppShell', () => {
    const fs = require('fs');
    const path = require('path');
    const layoutPath = path.resolve(__dirname, '../app/(authenticated)/settings/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // Must not pass inline functions / callbacks to AppShell across RSC boundary
    expect(layoutContent).not.toMatch(/<AppShell[^>]*sidebar=\{/);
    expect(layoutContent).toContain('SettingsShell');

    // SettingsShell must be a client component composing AppShell and SettingsSidebar
    const shellPath = path.resolve(__dirname, '../components/settings/settings-shell.tsx');
    const shellContent = fs.readFileSync(shellPath, 'utf8');
    expect(shellContent).toMatch(/^'use client'/);
    expect(shellContent).toContain('SettingsSidebar');
  });
});

