import React from 'react';
import { redirect } from 'next/navigation';
import { centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { DormantFeatureNotice } from '@/components/design-system/dormant-feature-notice';

export const dynamic = 'force-dynamic';

export default async function PersonnelPage() {
  if (!isApiAdmin()) {
    redirect('/');
  }

  try {
    await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    throw error;
  }

  return (
    <DormantFeatureNotice
      title="Personal Operativo"
      description="La gestión de guías y conductores operativos ha sido desactivada de la superficie activa de producto."
    />
  );
}
