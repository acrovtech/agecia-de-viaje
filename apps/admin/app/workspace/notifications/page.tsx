import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Bell, Info, ShieldCheck } from 'lucide-react';
import { isApiAdmin } from '../../../lib/admin-mode';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { NotificationsTable, type NotificationItem } from './notifications-table';
import { PageHeader } from '../../../components/design-system/page-header';
import { EmptyState } from '../../../components/design-system/empty-state';

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
      <EmptyState
        title="Sesión no disponible"
        description="No fue posible conectar con el servicio central. Vuelve a iniciar sesión."
      />
    );
  }

  const { token, identity } = session;

  if (!['OWNER', 'ADMIN'].includes(identity.role)) {
    return (
      <EmptyState
        title="Acceso Restringido"
        description="Solo los roles Propietario o Administrador pueden auditar las notificaciones transaccionales."
        action={
          <Link href="/workspace" className="underline text-xs font-semibold">
            Volver al inicio
          </Link>
        }
      />
    );
  }

  const params = await searchParams;
  const cursor =
    typeof params.after === 'string' && params.after.length <= 128 ? params.after : undefined;
  const stateFilter =
    typeof params.state === 'string' &&
    ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD_LETTER'].includes(params.state)
      ? params.state
      : undefined;

  let notificationsData;
  let errorMessage = '';

  try {
    const query = new URLSearchParams();
    if (cursor) query.set('after', cursor);
    if (stateFilter) query.set('state', stateFilter);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const body = await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/notifications${queryString}`,
      token,
    );
    notificationsData = notificationListSchema.parse(body);
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) {
      redirect('/login?expired=1');
    }
    errorMessage =
      error instanceof CentralApiError && error.status === 403
        ? 'No tienes permiso para consultar notificaciones en esta agencia.'
        : 'No pudimos cargar la lista de notificaciones. Vuelve a intentarlo.';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones Transaccionales"
        description="Auditoría, outbox y estado de entrega de correos salientes del sistema (invitaciones y reservas)."
        breadcrumbs={[
          { label: 'Inicio', href: '/workspace' },
          { label: 'Notificaciones', isCurrent: true },
        ]}
      />

      {/* Live Email Transport Banner */}
      <div className="p-4 rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] flex items-start gap-3 shadow-none">
        <div className="p-1 rounded-lg bg-[#f3f4f6] text-[#6b7280] shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <span className="font-semibold text-[#111111] block text-xs">
            LIVE EMAIL TRANSPORT: NOT CONFIGURED
          </span>
          <p className="text-[#6b7280] mt-0.5 leading-relaxed">
            El sistema de outbox transaccional duradero y cifrado (AES-256-GCM) almacena todos los correos generados por eventos de invitaciones y reservas. La entrega real se ejecutará cuando se conecte el proveedor de transporte en vivo en una fase posterior. Los envíos manuales y reintentos están asegurados con comprobación atómica.
          </p>
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-xl border border-[#fecaca]">
          {errorMessage}
        </p>
      )}

      {/* State Filter Pills */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-[#e5e7eb] pb-3">
        <Link
          href="/workspace/notifications"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !stateFilter
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          Todas
        </Link>
        {['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD_LETTER'].map((st) => (
          <Link
            key={st}
            href={`/workspace/notifications?state=${st}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              stateFilter === st
                ? 'bg-[#111111] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            {st}
          </Link>
        ))}
      </div>

      {/* Notifications Table */}
      {notificationsData && (
        <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-none">
          <NotificationsTable
            notifications={notificationsData.data as NotificationItem[]}
            canRetry={['OWNER', 'ADMIN'].includes(identity.role)}
          />

          <div className="p-3 border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#6b7280]">
            <div>{notificationsData.data.length} registros listados</div>
            <div className="flex gap-4 font-medium text-[#111111]">
              {cursor && (
                <Link
                  href={`/workspace/notifications${stateFilter ? `?state=${stateFilter}` : ''}`}
                  className="hover:underline"
                >
                  Primera página
                </Link>
              )}
              {notificationsData.nextCursor && (
                <Link
                  href={`/workspace/notifications?after=${encodeURIComponent(
                    notificationsData.nextCursor,
                  )}${stateFilter ? `&state=${stateFilter}` : ''}`}
                  className="hover:underline"
                >
                  Siguiente página
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
