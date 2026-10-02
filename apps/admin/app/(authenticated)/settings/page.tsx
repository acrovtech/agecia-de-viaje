import React from 'react';
import { redirect } from 'next/navigation';
import { requireSettingsSession, fetchAgencyProfile } from '@/lib/settings-loader';
import { getSettingsConfigByPath, getSettingsConfigByLegacyTab } from '@/lib/settings-navigation';
import { PageHeader } from '@/components/design-system/page-header';
import { OverviewSection } from '@/components/settings/sections/overview-section';
import type { AgencyProfileData } from '@/components/settings/types';

export const dynamic = 'force-dynamic';

export default async function SettingsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Backward compatibility: redirect ?tab=... to canonical nested settings route
  if (typeof params.tab === 'string' && params.tab !== 'resumen') {
    const target = getSettingsConfigByLegacyTab(params.tab);
    if (target) {
      const q = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (key !== 'tab' && typeof value === 'string') {
          q.set(key, value);
        }
      }
      const qStr = q.toString() ? `?${q.toString()}` : '';
      redirect(`${target.href}${qStr}`);
    }
  }

  const { session } = await requireSettingsSession();
  const profile = await fetchAgencyProfile(session.identity.agencyId, session.token);
  const config = getSettingsConfigByPath('/settings');

  const fallbackProfile: AgencyProfileData = profile || {
    id: session.identity.agencyId,
    name: session.identity.agencyName,
    slug: session.identity.agencySlug,
    subdomain: null,
    customDomain: null,
    phone: null,
    email: session.identity.email,
    address: null,
    logoUrl: null,
    iconUrl: null,
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />
      <OverviewSection identity={session.identity} initialProfile={fallbackProfile} />
    </div>
  );
}
