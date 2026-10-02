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
