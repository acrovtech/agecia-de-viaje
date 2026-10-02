import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isApiAdmin } from '../../lib/admin-mode';
import { centralRequest, centralSession, CentralApiError } from '../../lib/central-api';
import { SettingsForm } from './settings-form';
import { PageHeader } from '../../components/design-system/page-header';
import { EmptyState } from '../../components/design-system/empty-state';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isApiAdmin()) redirect('/');

  const params = searchParams ? await searchParams : {};
  const requestedTab = typeof params.tab === 'string' ? params.tab : 'resumen';

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

  const tabHeaders: Record<string, { title: string; description: string }> = {
    resumen: {
      title: 'Configuración',
      description: 'Administra la identidad de tu agencia, preferencias del sistema, facturación, planes y seguridad.',
    },
    perfil: {
      title: 'Perfil',
      description: 'Gestiona tu información de cuenta, credenciales de acceso y sesión activa.',
    },
    general: {
      title: 'General',
      description: 'Configura el idioma, zona horaria, formato horario y resumen mensual por correo.',
    },
    aspecto: {
      title: 'Aspecto',
      description: 'Personaliza los temas del sistema, la paleta de identidad y los logotipos de tu marca.',
    },
    referidos: {
      title: 'Gana por referenciado',
      description: 'Monitorea tus ingresos, comisiones acumuladas y comparte tu enlace de recomendación.',
    },
    facturacion: {
      title: 'Gestione la facturación',
      description: 'Administra tu suscripción activa, saldo de créditos disponibles y registro histórico de gastos.',
    },
    planes: {
      title: 'Planes',
      description: 'Explora y escala a planes con mayores capacidades para tu agencia de viajes.',
    },
    seguridad: {
      title: 'Seguridad y Cumplimiento',
      description: 'Gestiona el perfil fiscal y legal de tu empresa (RUC) y audita las sesiones del sistema.',
    },
    social: {
      title: 'Página social',
      description: 'Configura tu link-in-bio móvil para viajeros con accesos directos, tours y contacto WhatsApp.',
    },
    integraciones: {
      title: 'Integraciones',
      description: 'Conecta pasarelas de pago (Izipay, Stripe), Google Calendar y mensajería en la nube.',
    },
  };

  const defaultHeader = {
    title: 'Configuración',
    description: 'Administra la identidad de tu agencia, preferencias del sistema, facturación, planes y seguridad.',
  };

  const headerInfo = tabHeaders[requestedTab] ?? defaultHeader;

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerInfo.title}
        description={headerInfo.description}
      />

      <SettingsForm
        initialProfile={profileData}
        initialLegal={legalData}
        canEdit={canEdit}
        identity={identity}
        initialTab={requestedTab}
      />
    </div>
  );
}
