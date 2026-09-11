import { redirect } from 'next/navigation';
import { requireSuperAdminRole } from '@/lib/auth-check';
import { getAuditLogsAction } from '@/app/actions/audit';
import { LogsClient } from './logs-client';
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  // Solo SUPERADMIN puede acceder a esta ruta
  try {
    await requireSuperAdminRole();
  } catch {
    redirect('/');
  }

  const result = await getAuditLogsAction({ page: 1, limit: 30 });

  return (
    <div className="space-y-6">
      <DynamicPageTitle />
      <LogsClient initialData={result} />
    </div>
  );
}
