import React from 'react';
import { requireSettingsSession, fetchAgencyProfile } from '@/lib/settings-loader';
import { getSettingsConfigByPath } from '@/lib/settings-navigation';
import { PageHeader } from '@/components/design-system/page-header';
import { ProfileSection } from '@/components/settings/sections/profile-section';
import { EmptyState } from '@/components/design-system/empty-state';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsProfilePage() {
  const { session, canEdit } = await requireSettingsSession();
  const profile = await fetchAgencyProfile(session.identity.agencyId, session.token);

  if (!profile) {
    return (
      <EmptyState
        title="Perfil no disponible"
        description="No fue posible consultar la información de perfil de tu agencia."
        action={
          <Link href="/settings" className="underline text-xs font-semibold">
            Volver a configuración
          </Link>
        }
      />
    );
  }

  const config = getSettingsConfigByPath('/settings/profile');

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />
      <ProfileSection initialProfile={profile} identity={session.identity} />
    </div>
  );
}
