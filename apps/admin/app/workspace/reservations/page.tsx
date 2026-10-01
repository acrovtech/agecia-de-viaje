import Link from 'next/link';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  CalendarCheck2,
  Plus,
  ArrowLeft,
  User,
  Users,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Mail,
  Phone,
} from 'lucide-react';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { isApiAdmin } from '../../../lib/admin-mode';
import {
  canOperateReservations,
  operationLabels,
  priceLabel,
  reservationSummarySchema,
  reservationDetailSchema,
  serviceResourceSchema,
  fleetVehicleSchema,
} from '../../../lib/reservations';
import { tourContentSchema, transferContentSchema } from '../../../lib/catalog-content';
import { BookingForm, StatusForm, OperationsAssignmentForm } from './forms';
import { PageHeader } from '../../../components/design-system/page-header';
import { StatusBadge } from '../../../components/design-system/status-badge';
import { EmptyState } from '../../../components/design-system/empty-state';

export const dynamic = 'force-dynamic';

const validId = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);

const catalogSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string().optional(),
      isPublished: z.boolean(),
      isActive: z.boolean().optional(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

const paymentLabels: Record<string, string> = {
  PENDING: 'Pendiente (Diferido)',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagada',
  REFUND_PENDING: 'Reembolso pendiente',
  PARTIALLY_REFUNDED: 'Reembolso parcial',
  REFUNDED: 'Reembolsada',
  PAYMENT_RECEIVED_REVIEW: 'Pago en revisión',
  FAILED: 'Fallido',
  EXPIRED: 'Expirado',
  LEGACY_UNKNOWN: 'Estado sin verificar',
};

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isApiAdmin()) redirect('/');
  const params = await searchParams;

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
        description="No fue posible conectar con el servicio central. Inicia sesión nuevamente."
      />
    );
  }

  const { token, identity } = session;
  if (!canOperateReservations(identity.role)) {
    return (
      <EmptyState
        title="Acceso Restringido"
        description="Tu rol actual no tiene autorización para gestionar reservas en esta agencia."
        action={
          <Link href="/workspace" className="underline text-xs font-semibold">
            Volver al inicio
          </Link>
        }
      />
    );
  }

  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;

  // =========================================================================
  // VIEW: RESERVATION DETAIL (?id=...)
  // =========================================================================
  if (params.id !== undefined) {
    if (!validId(params.id)) {
      return (
        <EmptyState
          title="Reserva no encontrada"
          description="El identificador de reserva no es válido."
          action={
            <Link href="/workspace/reservations" className="underline text-xs font-semibold">
              Volver al listado
            </Link>
          }
        />
      );
    }

    try {
      const [resRow, guidesBody, driversBody, vehiclesBody] = await Promise.all([
        centralRequest(`${base}/reservations/${params.id}`, token),
        centralRequest(`${base}/operations/resources?type=GUIDE&isActive=true`, token).catch(
          () => ({ data: [] }),
        ),
        centralRequest(`${base}/operations/resources?type=DRIVER&isActive=true`, token).catch(
          () => ({ data: [] }),
        ),
        centralRequest(`${base}/operations/vehicles?isActive=true`, token).catch(() => ({
          data: [],
        })),
      ]);

      const row = reservationDetailSchema.parse(resRow);
      const guides = z.object({ data: z.array(serviceResourceSchema) }).parse(guidesBody).data;
      const drivers = z.object({ data: z.array(serviceResourceSchema) }).parse(driversBody).data;
      const vehicles = z.object({ data: z.array(fleetVehicleSchema) }).parse(vehiclesBody).data;

      // Public reservation code is visually primary
      const publicCode = row.code ?? row.id;

      return (
        <div className="max-w-5xl mx-auto space-y-6">
          <PageHeader
            title={publicCode}
            description={`Servicio: ${row.serviceTitle ?? 'Reserva anterior'} · Fecha: ${row.date.slice(0, 10)} · ${row.pax} pasajeros`}
            breadcrumbs={[
              { label: 'Inicio', href: '/workspace' },
              { label: 'Reservas', href: '/workspace/reservations' },
              { label: publicCode, isCurrent: true },
            ]}
            badges={
              <div className="flex items-center gap-2">
                <StatusBadge status={row.operationStatus || 'PENDING'} />
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800">
                  Pago: {paymentLabels[row.paymentStatus] ?? row.paymentStatus}
                </span>
              </div>
            }
          />

          {/* Overview Grid: Customer, Passengers, Service, Commercial */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Card 1: Cliente y Contacto */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Cliente Titular</span>
              </h3>
              <div className="space-y-1 text-sm">
                <div className="font-bold text-slate-900 text-base">
                  {row.customerFirstName} {row.customerLastName}
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{row.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{row.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Instantánea Comercial (FROZEN / DEFERRED) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Instantánea Comercial</span>
              </h3>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-slate-900">
                  {priceLabel(row.totalMinor ?? Math.round(row.totalPrice * 100), row.currency)}
                </div>
                {row.unitPriceMinor !== null && (
                  <p className="text-xs text-slate-500">
                    Tarifa guardada: {priceLabel(row.unitPriceMinor, row.currency)}{' '}
                    {row.pricingUnit === 'GROUP' ? 'por vehículo' : 'por persona'}
                  </p>
                )}
                <div className="pt-2 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  Estado de pagos: <strong>FROZEN / PROVIDER DEFERRED</strong>. No se procesan cobros en pasarela en esta versión.
                </div>
              </div>
            </div>

            {/* Card 3: Servicio y Recojo */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Logística y Recojo</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block font-medium">Hotel o punto de encuentro:</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {row.pickupHotel || 'No especificado'}
                  </span>
                </div>
                {row.pickupTime && (
                  <div>
                    <span className="text-slate-400 block font-medium">Hora de recojo:</span>
                    <span className="font-semibold text-slate-900">{row.pickupTime}</span>
                  </div>
                )}
                {row.vehicleName && (
                  <div>
                    <span className="text-slate-400 block font-medium">Categoría de vehículo:</span>
                    <span className="font-semibold text-slate-900">{row.vehicleName}</span>
                  </div>
                )}
                {row.specialRequirements && (
                  <div>
                    <span className="text-slate-400 block font-medium">Observaciones:</span>
                    <p className="whitespace-pre-wrap text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                      {row.specialRequirements}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Manifiesto de Pasajeros */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Manifiesto de Pasajeros ({row.passengers.length})</span>
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {row.passengers.map((p, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">
                      {i + 1}. {p.firstName} {p.lastName}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {p.docNumber ? `${p.docType}: ${p.docNumber}` : 'Sin documento'}
                    </span>
                  </div>
                ))}
                {!row.passengers.length && (
                  <p className="text-xs text-slate-400">Sin pasajeros registrados.</p>
                )}
              </div>
            </div>
          </div>

          {/* Formulario de Asignación de Recursos Operativos */}
          <OperationsAssignmentForm
            key={`ops-${row.updatedAt}`}
            reservation={row}
            guides={guides}
            drivers={drivers}
            vehicles={vehicles}
          />

          {/* Formulario de Transición de Estado */}
          <StatusForm key={row.updatedAt} reservation={row} />

          {/* Historial Operativo */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Historial Operativo</h3>
            {!row.events.length && (
              <p className="text-xs text-slate-400">
                Esta reserva no tiene eventos registrados aún.
              </p>
            )}
            <div className="space-y-3">
              {row.events.map((event) => (
                <div key={event.id} className="border-l-2 border-slate-200 pl-3 py-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-900">
                      {event.fromStatus ? `${operationLabels[event.fromStatus]} → ` : ''}
                      {operationLabels[event.toStatus]}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(event.createdAt).toLocaleString('es-PE', {
                        timeZone: 'America/Lima',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{event.actorLabel}</p>
                  {event.note && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">
                      {event.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } catch {
      return (
        <EmptyState
          title="Error al cargar la reserva"
          description="No pudimos encontrar la información de esta reserva en tu agencia."
          action={
            <Link href="/workspace/reservations" className="underline text-xs font-semibold">
              Volver al listado
            </Link>
          }
        />
      );
    }
  }

  // =========================================================================
  // VIEW: CREAR RESERVA MANUAL (?new=1)
  // =========================================================================
  if (params.new === '1') {
    const kind = params.kind === 'transfers' ? 'transfers' : 'tours';

    if (params.serviceId !== undefined) {
      if (!validId(params.serviceId)) {
        redirect('/workspace/reservations?new=1');
      }

      try {
        const body = await centralRequest(`${base}/catalog/${kind}/${params.serviceId}/content`, token);
        const row = kind === 'tours' ? tourContentSchema.parse(body) : transferContentSchema.parse(body);

        if (!row.isPublished || ('isActive' in row && !row.isActive)) {
          throw new CentralApiError(404);
        }

        const vehicles =
          'vehiclePrices' in row
            ? row.vehiclePrices
                .filter((p) => p.vehicle.isActive)
                .map((p) => ({ id: p.vehicleId, name: p.vehicle.name, maxPax: p.vehicle.maxPax }))
            : [];

        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <Link
              href={`/workspace/reservations?new=1&kind=${kind}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Elegir otro servicio</span>
            </Link>

            <BookingForm
              key={row.id}
              requestKey={randomUUID()}
              service={{
                id: row.id,
                title: row.title,
                kind: kind === 'tours' ? 'TOUR' : 'TRANSFER',
                hasSharedService: row.hasSharedService,
                hasPrivateService: row.hasPrivateService,
                vehicles,
              }}
            />
          </div>
        );
      } catch {
        return (
          <EmptyState
            title="Servicio no disponible"
            description="El servicio seleccionado no está publicado o no está disponible para cotización."
            action={
              <Link href="/workspace/reservations?new=1" className="underline text-xs font-semibold">
                Volver a la selección
              </Link>
            }
          />
        );
      }
    } else {
      // Step: Select published service
      const after = validId(params.after) ? `?after=${encodeURIComponent(params.after)}` : '';
      const list = catalogSchema.parse(
        await centralRequest(`${base}/catalog/${kind}${after}`, token).catch(() => ({
          data: [],
          nextCursor: null,
        })),
      );
      const rows = list.data.filter((r) => r.isPublished && (kind === 'tours' || r.isActive));

      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            title="Nueva Reserva Manual"
            description="Selecciona un servicio publicado para iniciar la cotización y registro."
            breadcrumbs={[
              { label: 'Inicio', href: '/workspace' },
              { label: 'Reservas', href: '/workspace/reservations' },
              { label: 'Nueva Reserva', isCurrent: true },
            ]}
          />

          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <Link
              href="/workspace/reservations?new=1&kind=tours"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                kind === 'tours' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tours
            </Link>
            <Link
              href="/workspace/reservations?new=1&kind=transfers"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                kind === 'transfers' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Traslados
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/workspace/reservations?new=1&kind=${kind}&serviceId=${r.id}`}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between group shadow-xs"
              >
                <div>
                  <span className="font-bold text-sm text-slate-900 block group-hover:text-blue-700 transition-colors">
                    {r.title}
                  </span>
                  {r.slug && <span className="text-xs text-slate-500 font-mono">/{r.slug}</span>}
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </Link>
            ))}
          </div>

          {!rows.length && (
            <EmptyState
              title="Sin servicios publicados"
              description={`No hay ${kind === 'tours' ? 'tours' : 'traslados'} publicados en esta página. Publica un servicio en el catálogo antes de crear reservas manuales.`}
            />
          )}

          {list.nextCursor && (
            <div className="pt-2">
              <Link
                href={`/workspace/reservations?new=1&kind=${kind}&after=${list.nextCursor}`}
                className="text-xs font-semibold underline"
              >
                Siguiente página
              </Link>
            </div>
          )}
        </div>
      );
    }
  }

  // =========================================================================
  // VIEW: RESERVATIONS LIST
  // =========================================================================
  const query = new URLSearchParams();
  if (validId(params.after)) query.set('after', params.after);
  if (typeof params.status === 'string' && Object.hasOwn(operationLabels, params.status)) {
    query.set('status', params.status);
  }

  let list;
  try {
    const raw = await centralRequest(`${base}/reservations?${query}`, token);
    list = z
      .object({
        data: z.array(reservationSummarySchema),
        nextCursor: z.string().nullable(),
      })
      .parse(raw);
  } catch {
    list = { data: [], nextCursor: null };
  }

  const nextParams = new URLSearchParams(query);
  if (list.nextCursor) nextParams.set('after', list.nextCursor);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Reservas"
        description="Listado operativo de reservas de clientes de tu agencia."
        breadcrumbs={[
          { label: 'Inicio', href: '/workspace' },
          { label: 'Reservas', isCurrent: true },
        ]}
        actions={
          <Link
            href="/workspace/reservations?new=1"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear reserva manual</span>
          </Link>
        }
      />

      {params.saved === '1' && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Reserva guardada con éxito.</span>
        </div>
      )}

      {/* Filter Tabs by Operation Status */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-slate-200/80 pb-3">
        <Link
          href="/workspace/reservations"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            !params.status
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
          }`}
        >
          Todas
        </Link>
        {Object.entries(operationLabels).map(([statusKey, label]) => {
          const isActive = params.status === statusKey;
          return (
            <Link
              key={statusKey}
              href={`/workspace/reservations?status=${statusKey}`}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Modern Data Table */}
      <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Código / Servicio</th>
                <th className="py-3 px-4 font-semibold">Cliente</th>
                <th className="py-3 px-4 font-semibold">Fecha del Servicio</th>
                <th className="py-3 px-4 font-semibold">Estado Operativo</th>
                <th className="py-3 px-4 font-semibold text-right">Total Acordado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((row) => {
                const publicCode = row.code ?? row.id.slice(0, 8);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 pr-3">
                      <Link
                        href={`/workspace/reservations?id=${row.id}`}
                        className="font-bold text-slate-900 text-sm hover:underline font-mono"
                      >
                        {publicCode}
                      </Link>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {row.serviceTitle ?? 'Reserva anterior'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {row.customerFirstName} {row.customerLastName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {row.date.slice(0, 10)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={row.operationStatus || 'PENDING'} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {priceLabel(
                        row.totalMinor ?? Math.round(row.totalPrice * 100),
                        row.currency,
                      )}
                    </td>
                  </tr>
                );
              })}
              {list.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No hay reservas registradas para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>{list.data.length} reservas listadas</div>
          <div className="flex gap-4 font-semibold">
            {params.after && (
              <Link
                href={`/workspace/reservations${
                  params.status ? `?status=${encodeURIComponent(String(params.status))}` : ''
                }`}
                className="hover:underline"
              >
                Primera página
              </Link>
            )}
            {list.nextCursor && (
              <Link href={`/workspace/reservations?${nextParams}`} className="hover:underline">
                Siguiente página
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
