import React from 'react';
import { redirect } from 'next/navigation';
import { centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import { DormantFeatureNotice } from '@/components/design-system/dormant-feature-notice';

export const dynamic = 'force-dynamic';

export default async function OperationsPage() {
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
      title="Operaciones y Despacho"
      description="El despacho de guías, conductores y asignación de flota ha sido desactivado de la superficie activa de producto."
    />
  );
}
