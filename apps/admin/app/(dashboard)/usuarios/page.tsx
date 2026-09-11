import { redirect } from 'next/navigation';
import { requireMasterRole } from '@/lib/auth-check';
import { getUsersAction } from '@/app/actions/user';
import { UsuariosClient } from './usuarios-client';
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  // Solo MASTER puede acceder a esta ruta
  try {
    await requireMasterRole();
  } catch {
    redirect('/');
  }

  const result = await getUsersAction();
  const initialUsers = result.users || [];

  return (
    <div className="space-y-6">
      <DynamicPageTitle />
      <UsuariosClient initialUsers={initialUsers} />
    </div>
  );
}
