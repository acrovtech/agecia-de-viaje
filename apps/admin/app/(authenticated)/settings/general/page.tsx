import React from 'react';
import { requireSettingsSession, fetchAgencyProfile, fetchAgencyEntitlements, fetchAgencyLocales } from '@/lib/settings-loader';
import { getSettingsConfigByPath } from '@/lib/settings-navigation';
import { PageHeader } from '@/components/design-system/page-header';
import { GeneralSection } from '@/components/settings/sections/general-section';
import { EmptyState } from '@/components/design-system/empty-state';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsGeneralPage() {
  const { session, canEdit } = await requireSettingsSession();
  const [profile, entitlements, locales] = await Promise.all([
    fetchAgencyProfile(session.identity.agencyId, session.token),
    fetchAgencyEntitlements(session.identity.agencyId, session.token),
    fetchAgencyLocales(session.identity.agencyId, session.token),
  ]);

  if (!profile) {
    return (
      <EmptyState
        title="Datos no disponibles"
        description="No fue posible consultar las preferencias generales de tu agencia."
        action={
          <Link href="/settings" className="underline text-xs font-semibold">
            Volver a configuración
          </Link>
        }
      />
    );
  }

  const config = getSettingsConfigByPath('/settings/general');

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />
      <GeneralSection
        initialProfile={profile}
        canEdit={canEdit}
        identity={session.identity}
        initialEntitlements={entitlements || (locales ? { maxCatalogLocales: locales.maxCatalogLocales, aiEnabled: false, aiMonthlyCredits: 0 } : undefined)}
        initialLocales={locales ? locales.locales : null}
        maxCatalogLocales={locales?.maxCatalogLocales}
        supportedLocales={locales?.supportedLocales}
      />
    </div>
  );
}
