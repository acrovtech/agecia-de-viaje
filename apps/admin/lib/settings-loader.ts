import { redirect } from 'next/navigation';
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

export async function fetchAgencyLocales(agencyId: string, token: string): Promise<Array<{ id: string; locale: string; isDefault: boolean; enabled: boolean }>> {
  try {
    const data = (await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/locales`,
      token,
    )) as any;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return [{ id: 'default', locale: 'es', isDefault: true, enabled: true }];
  }
}

export async function fetchAgencyCredits(agencyId: string, token: string): Promise<{ balance: number; ledger: Array<{ id: string; amount: number; reason: string; createdAt: string }> } | null> {
  try {
    const data = (await centralRequest(
      `/v1/agencies/${encodeURIComponent(agencyId)}/settings/credits`,
      token,
    )) as any;
    return {
      balance: typeof data?.balance === 'number' ? data.balance : 0,
      ledger: Array.isArray(data?.ledger) ? data.ledger : (Array.isArray(data?.recentLedger) ? data.recentLedger : []),
    };
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return { balance: 0, ledger: [] };
  }
}
