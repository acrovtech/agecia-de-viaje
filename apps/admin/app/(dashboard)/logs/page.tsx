import { redirect } from 'next/navigation';
import { requireSuperAdminRole } from '@/lib/auth-check';
import { getAuditLogsAction } from '@/app/actions/audit';
import { LogsClient } from './logs-client';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  // Solo SUPERADMIN puede acceder a esta ruta
  try {
    await requireSuperAdminRole();
  } catch {
    redirect('/');
  }

  const result = await getAuditLogsAction({ page: 1, limit: 30 });

  return <LogsClient initialData={result} />;
}
