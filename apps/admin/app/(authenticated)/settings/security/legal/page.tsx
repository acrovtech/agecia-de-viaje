import React from 'react';
import { requireSettingsSession, fetchAgencyLegal } from '@/lib/settings-loader';
import { getSettingsConfigByPath } from '@/lib/settings-navigation';
import { PageHeader } from '@/components/design-system/page-header';
import { LegalSection } from '@/components/settings/sections/legal-section';
import { EmptyState } from '@/components/design-system/empty-state';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsLegalPage() {
  const { session, canEdit } = await requireSettingsSession();
  const legal = await fetchAgencyLegal(session.identity.agencyId, session.token);

  if (!legal) {
    return (
      <EmptyState
        title="Datos fiscales no disponibles"
        description="No fue posible consultar el perfil legal y fiscal de tu empresa."
        action={
          <Link href="/settings" className="underline text-xs font-semibold">
            Volver a configuración
          </Link>
        }
      />
    );
  }

  const config = getSettingsConfigByPath('/settings/security/legal');

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />
      <LegalSection initialLegal={legal} canEdit={canEdit} />
    </div>
  );
}
