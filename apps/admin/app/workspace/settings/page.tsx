import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isApiAdmin } from '../../../lib/admin-mode';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { logoutAction } from '../../actions/auth';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

const roleLabels: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  OPERATOR: 'Operador',
  VIEWER: 'Consulta',
};

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
      <main className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-semibold">No pudimos verificar tu sesión</h1>
        <p className="my-4">
          El servicio no está disponible en este momento.
        </p>
        <Link href="/workspace" className="underline">
          Volver al espacio de trabajo
        </Link>
      </main>
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
        token
      ),
      centralRequest(
        `/v1/agencies/${encodeURIComponent(identity.agencyId)}/settings/legal`,
        token
      ),
    ]);
    profileData = pRes;
    legalData = lRes;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    return (
      <main className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-semibold text-red-700">Error al cargar la configuración</h1>
        <p className="my-4">
          No fue posible consultar la información de configuración de la agencia.
        </p>
        <Link href="/workspace" className="underline">
          Volver al espacio de trabajo
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="text-sm text-slate-500">Espacio de agencia</p>
          <h1 className="text-3xl font-semibold text-[#062918]">{identity.agencyName}</h1>
          <p className="text-sm text-slate-600 mt-2">
            {identity.email} · {roleLabels[identity.role]}
          </p>
        </div>
        <form action={logoutAction}>
          <button className="border rounded-lg bg-white px-4 py-2 text-sm hover:bg-slate-50">
            Cerrar sesión
          </button>
        </form>
      </header>

      <nav aria-label="Navegación del espacio" className="flex flex-wrap gap-2">
        <Link href="/workspace" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Catálogo
        </Link>
        {['OWNER', 'ADMIN', 'OPERATOR'].includes(identity.role) && (
          <Link href="/workspace/reservations" className="px-4 py-2 rounded-lg text-sm bg-white border">
            Reservas
          </Link>
        )}
        <Link href="/workspace/resources?kind=categories" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Categorías
        </Link>
        <Link href="/workspace/resources?kind=vehicles" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Vehículos
        </Link>
        {['OWNER', 'ADMIN'].includes(identity.role) && (
          <Link href="/workspace?view=members" className="px-4 py-2 rounded-lg text-sm bg-white border">
            Equipo
          </Link>
        )}
        <Link
          href="/workspace/settings"
          aria-current="page"
          className="px-4 py-2 rounded-lg text-sm bg-[#062918] text-white"
        >
          Configuración
        </Link>
      </nav>

      <SettingsForm
        initialProfile={profileData}
        initialLegal={legalData}
        canEdit={canEdit}
      />
    </main>
  );
}
