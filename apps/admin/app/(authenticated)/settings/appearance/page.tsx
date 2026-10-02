import React from 'react';
import { requireSettingsSession, fetchAgencyProfile } from '@/lib/settings-loader';
import { getSettingsConfigByPath } from '@/lib/settings-navigation';
import { PageHeader } from '@/components/design-system/page-header';
import { AppearanceSection } from '@/components/settings/sections/appearance-section';
import { EmptyState } from '@/components/design-system/empty-state';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsAppearancePage() {
  const { session, canEdit } = await requireSettingsSession();
  const profile = await fetchAgencyProfile(session.identity.agencyId, session.token);

  if (!profile) {
    return (
      <EmptyState
        title="Datos no disponibles"
        description="No fue posible consultar las preferencias de aspecto de tu agencia."
        action={
          <Link href="/settings" className="underline text-xs font-semibold">
            Volver a configuración
          </Link>
        }
      />
    );
  }

  const config = getSettingsConfigByPath('/settings/appearance');

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />
      <AppearanceSection initialProfile={profile} canEdit={canEdit} />
    </div>
  );
}
