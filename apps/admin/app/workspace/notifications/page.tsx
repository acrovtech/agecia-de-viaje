import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isApiAdmin } from '../../../lib/admin-mode';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { logoutAction } from '../../actions/auth';
import { NotificationsTable, type NotificationItem } from './notifications-table';

export const dynamic = 'force-dynamic';

const notificationListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      agencyId: z.string(),
      kind: z.string(),
      audience: z.string(),
      recipient: z.string(),
      subject: z.string(),
      state: z.enum(['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD_LETTER']),
      attempts: z.number(),
      maxAttempts: z.number(),
      nextAttemptAt: z.string(),
      firstAttemptAt: z.string().nullable(),
      lastAttemptAt: z.string().nullable(),
      sentAt: z.string().nullable(),
      failureCode: z.string().nullable(),
      providerMessageId: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
        <p className="my-4">El servicio no está disponible en este momento.</p>
        <Link href="/workspace" className="underline">
          Volver al espacio
        </Link>
      </main>
    );
  }

  const { token, identity } = session;
  if (!['OWNER', 'ADMIN'].includes(identity.role)) {
    redirect('/workspace');
  }

  const params = await searchParams;
  const cursor =
    typeof params.after === 'string' && params.after.length <= 128
      ? params.after
      : undefined;

  let notificationsData: z.infer<typeof notificationListSchema> | undefined;
  let errorMessage: string | null = null;

  try {
    const suffix = cursor ? `?after=${encodeURIComponent(cursor)}` : '';
    const res = await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/notifications${suffix}`,
      token,
    );
    notificationsData = notificationListSchema.parse(res);
  } catch (err) {
    if (err instanceof CentralApiError && err.status === 401) {
      redirect('/login?expired=1');
    }
    errorMessage = 'No se pudieron cargar las notificaciones. Intenta nuevamente.';
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="text-sm text-slate-500">Espacio de agencia</p>
          <h1 className="text-3xl font-semibold text-[#062918]">{identity.agencyName}</h1>
          <p className="text-sm text-slate-600 mt-2">
            {identity.email} · {identity.role}
          </p>
        </div>
        <form action={logoutAction}>
          <button className="border rounded-lg bg-white px-4 py-2 text-sm">
            Cerrar sesión
          </button>
        </form>
      </header>

      <nav aria-label="Secciones de agencia" className="flex flex-wrap gap-2">
        <Link href="/workspace" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Catálogo & Equipo
        </Link>
        <Link href="/workspace/reservations" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Reservas
        </Link>
        <Link href="/workspace/operations" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Operaciones
        </Link>
        <Link href="/workspace/resources?kind=categories" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Categorías
        </Link>
        <Link href="/workspace/resources?kind=vehicles" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Vehículos
        </Link>
        <Link
          href="/workspace/notifications"
          aria-current="page"
          className="px-4 py-2 rounded-lg text-sm bg-[#062918] text-white"
        >
          Notificaciones
        </Link>
        <Link href="/workspace/settings" className="px-4 py-2 rounded-lg text-sm bg-white border">
          Configuración
        </Link>
      </nav>

      <section className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Notificaciones transaccionales
            </h2>
            <p className="text-sm text-slate-500">
              Auditoría y estado de entrega de correos salientes del sistema (invitaciones y reservas).
            </p>
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            {errorMessage}
          </p>
        )}

        {notificationsData && (
          <NotificationsTable
            notifications={notificationsData.data as NotificationItem[]}
            canRetry={['OWNER', 'ADMIN'].includes(identity.role)}
          />
        )}

        <div className="flex gap-4 text-sm underline pt-2">
          {cursor && <Link href="/workspace/notifications">Primera página</Link>}
          {notificationsData?.nextCursor && (
            <Link
              href={`/workspace/notifications?after=${encodeURIComponent(
                notificationsData.nextCursor,
              )}`}
            >
              Siguiente página
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
