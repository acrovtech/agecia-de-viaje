import React from 'react';
import { requirePlatformSession, fetchPlatformSettings } from '../../../../lib/platform-api';
import { PlatformSettingsForm } from '../../../../components/platform/platform-settings-form';

export const dynamic = 'force-dynamic';

export default async function PlatformSettingsPage() {
  const session = await requirePlatformSession();
  const settings = await fetchPlatformSettings(session.token);

  const initialSettings = settings || {
    productName: 'Acrov SaaS',
    logoUrl: null,
    iconUrl: null,
    supportEmail: null,
    coBrandingEnabled: true,
    brandingRewardEnabled: true,
    brandingRewardCredits: 10,
    updatedAt: new Date().toISOString(),
  };

  const canEdit = session.identity.role === 'SUPERADMIN';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configuración Global de la Plataforma
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona los parámetros de marca compartida, logotipos del SaaS y políticas de recompensa de créditos IA.
        </p>
      </div>

      <PlatformSettingsForm
        initialSettings={initialSettings}
        canEdit={canEdit}
      />
    </div>
  );
}
