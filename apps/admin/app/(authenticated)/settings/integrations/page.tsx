import React from 'react';
import { requireSettingsSession } from '@/lib/settings-loader';
import { getSettingsConfigByPath } from '@/lib/settings-navigation';
import { getIntegrationCapabilities } from '@/lib/integration-capabilities';
import { PageHeader } from '@/components/design-system/page-header';
import { IntegrationsSection } from '@/components/settings/sections/integrations-section';

export const dynamic = 'force-dynamic';

export default async function SettingsIntegrationsPage() {
  await requireSettingsSession();
  const config = getSettingsConfigByPath('/settings/integrations');
  const capabilities = getIntegrationCapabilities();

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />
      <IntegrationsSection capabilities={capabilities} />
    </div>
  );
}
