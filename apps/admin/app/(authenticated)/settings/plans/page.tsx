import React from 'react';
import { requireSettingsSession } from '@/lib/settings-loader';
import { getSettingsConfigByPath } from '@/lib/settings-navigation';
import { PageHeader } from '@/components/design-system/page-header';
import { PlansSection } from '@/components/settings/sections/plans-section';

export const dynamic = 'force-dynamic';

export default async function SettingsPlansPage() {
  await requireSettingsSession();
  const config = getSettingsConfigByPath('/settings/plans');

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />
      <PlansSection />
    </div>
  );
}
