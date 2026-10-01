import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isApiAdmin } from '../../../lib/admin-mode';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { SettingsForm } from './settings-form';
import { PageHeader } from '../../../components/design-system/page-header';
import { EmptyState } from '../../../components/design-system/empty-state';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  if (!isApiAdmin()) redirect('/');

  let session;
  try {
    session = await centralSession();
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <EmptyState
        title="Sesión no disponible"
        description="No fue posible conectar con el servicio central. Vuelve a iniciar sesión."
      />
    );
  }

  const { token, identity } = session;
  const canEdit = ['OWNER', 'ADMIN'].includes(identity.role);

  let profileData;
  let legalData;

  try {
    const [pRes, lRes] = await Promise.all([
      centralRequest(
        `/v1/agencies/${encodeURIComponent(identity.agencyId)}/settings/profile`,
        token,
      ),
      centralRequest(
        `/v1/agencies/${encodeURIComponent(identity.agencyId)}/settings/legal`,
        token,
      ),
    ]);
    profileData = pRes;
    legalData = lRes;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <EmptyState
        title="Error al cargar la configuración"
        description="No fue posible consultar la información de configuración de tu agencia."
        action={
          <Link href="/workspace" className="underline text-xs font-semibold">
            Volver al inicio
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Agencia"
        description="Parámetros de empresa, perfiles comerciales, identidad de marca y datos legales."
        breadcrumbs={[
          { label: 'Inicio', href: '/workspace' },
          { label: 'Configuración', isCurrent: true },
        ]}
      />

      <SettingsForm
        initialProfile={profileData}
        initialLegal={legalData}
        canEdit={canEdit}
      />
    </div>
  );
}
