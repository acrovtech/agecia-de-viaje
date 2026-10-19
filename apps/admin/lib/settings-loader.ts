import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isApiAdmin } from './admin-mode';
import { centralRequest, centralSession, CentralApiError } from './central-api';
import type { AgencyProfileData, LegalProfileData } from '@/components/settings/types';

export async function requireSettingsSession() {
  if (!isApiAdmin()) {
    redirect('/');
  }

  try {
    const session = await centralSession();
    const canEdit = ['OWNER', 'ADMIN'].includes(session.identity.role);
    return { session, canEdit };
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    throw error;
  }
}

export async function fetchAgencyProfile(agencyId: string, token: string): Promise<AgencyProfileData | null> {
  try {
    const data = (await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/profile`,
      token,
    )) as AgencyProfileData;
    return data;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return null;
  }
}

export async function fetchAgencyLegal(agencyId: string, token: string): Promise<LegalProfileData | null> {
  try {
    const data = (await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/legal`,
      token,
    )) as LegalProfileData;
    return data;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return null;
  }
}

export async function fetchAgencyEntitlements(agencyId: string, token: string): Promise<{ maxCatalogLocales: number; aiEnabled: boolean; aiMonthlyCredits: number } | null> {
  try {
    const data = (await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/entitlements`,
      token,
    )) as any;
    return data;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return { maxCatalogLocales: 1, aiEnabled: false, aiMonthlyCredits: 0 };
  }
}

export const agencyLocalesResponseSchema = z.object({
  locales: z.array(
    z.object({
      id: z.string(),
      locale: z.string(),
      isDefault: z.boolean(),
      enabled: z.boolean(),
    })
  ),
  defaultLocale: z.string(),
  maxCatalogLocales: z.number(),
  enabledCount: z.number(),
  supportedLocales: z.array(z.string()).default(['es', 'en', 'pt', 'fr', 'de', 'it']),
});

export type AgencyLocalesResponse = z.infer<typeof agencyLocalesResponseSchema>;

export async function fetchAgencyLocales(
  agencyId: string,
  token: string
): Promise<AgencyLocalesResponse | null> {
  try {
    const data = await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/locales`,
      token,
    );
    return agencyLocalesResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return null;
  }
}

export async function fetchAgencyCredits(agencyId: string, token: string): Promise<{ balance: number; ledger: Array<{ id: string; amount: number; reason: string; createdAt: string }> } | null> {
  try {
    const data = (await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/credits`,
      token,
    )) as any;
    if (!data || typeof data.balance !== 'number') {
      return null;
    }
    return {
      balance: data.balance,
      ledger: Array.isArray(data?.ledger) ? data.ledger : (Array.isArray(data?.recentLedger) ? data.recentLedger : []),
    };
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return null;
  }
}

export interface AgencyBrandingInfo {
  platformBrandingEnabled: boolean;
  rewardLockedUntil: string | null;
  lastRewardPeriod: string | null;
  isLocked: boolean;
  isCurrentPeriodClaimed: boolean;
  currentPeriod: string;
  rewardCredits: number;
  brandingRewardEnabledGlobally: boolean;
  productName: string;
  platformLogoUrl: string | null;
  platformIconUrl: string | null;
}

export async function fetchAgencyBranding(agencyId: string, token: string): Promise<AgencyBrandingInfo | null> {
  try {
    const data = await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/branding`,
      token
    );
    return data as AgencyBrandingInfo;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return null;
  }
}

