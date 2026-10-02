import Link from 'next/link';
import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  Plus,
  ArrowLeft,
  User,
  Users,
  MapPin,
  DollarSign,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';
import { centralRequest, centralSession, CentralApiError } from '@/lib/central-api';
import { isApiAdmin } from '@/lib/admin-mode';
import {
  canOperateReservations,
  operationLabels,
  priceLabel,
  reservationSummarySchema,
  reservationDetailSchema,
  serviceResourceSchema,
  fleetVehicleSchema,
} from '@/lib/reservations';
import { tourContentSchema, transferContentSchema } from '@/lib/catalog-content';
import { BookingForm, StatusForm, OperationsAssignmentForm } from '@/app/workspace/reservations/forms';
import { PageHeader } from '@/components/design-system/page-header';
import { StatusBadge } from '@/components/design-system/status-badge';
import { EmptyState } from '@/components/design-system/empty-state';

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
          <Link href="/dashboard" className="underline text-xs font-semibold">
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
            <Link href="/reservations" className="underline text-xs font-semibold">
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

      const publicCode = row.code ?? row.id;

      return (
        <div className="max-w-5xl mx-auto space-y-6">
          <PageHeader
            title={publicCode}
            description={`Servicio: ${row.serviceTitle ?? 'Reserva anterior'} · Fecha: ${row.date.slice(0, 10)} · ${row.pax} pasajeros`}
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
            <div className="product-card-surface p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Cliente Titular</span>
              </h3>
              <div className="space-y-1 text-sm">
                <div className="font-semibold text-[#111111] text-base">
                  {row.customerFirstName} {row.customerLastName}
                </div>
                <div className="flex items-center gap-2 text-[#374151] text-xs">
                  <Mail className="w-3.5 h-3.5 text-[#898989]" />
                  <span>{row.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-[#374151] text-xs">
                  <Phone className="w-3.5 h-3.5 text-[#898989]" />
                  <span>{row.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Instantánea Comercial (FROZEN / DEFERRED) */}
            <div className="product-card-surface p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Instantánea Comercial</span>
              </h3>
              <div className="space-y-1">
                <div className="text-2xl font-semibold tracking-tight text-[#111111]">
                  {priceLabel(row.totalMinor ?? Math.round(row.totalPrice * 100), row.currency)}
                </div>
                {row.unitPriceMinor !== null && (
                  <p className="text-xs text-[#6b7280]">
                    Tarifa guardada: {priceLabel(row.unitPriceMinor, row.currency)}{' '}
                    {row.pricingUnit === 'GROUP' ? 'por vehículo' : 'por persona'}
                  </p>
                )}
                <div className="pt-2 text-[11px] text-[#374151] bg-[#f8f9fa] p-2.5 rounded-lg">
                  Estado de pagos: <strong>FROZEN / PROVIDER DEFERRED</strong>. No se procesan cobros en pasarela en esta versión.
                </div>
              </div>
            </div>

            {/* Card 3: Servicio y Recojo */}
            <div className="product-card-surface p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Logística y Recojo</span>
              </h3>
              <div className="space-y-2 text-xs text-[#374151]">
                <div>
                  <span className="text-[#898989] block font-medium">Hotel o punto de encuentro:</span>
                  <span className="font-medium text-[#111111] text-sm">
                    {row.pickupHotel || 'No especificado'}
                  </span>
                </div>
                {row.pickupTime && (
                  <div>
                    <span className="text-[#898989] block font-medium">Hora de recojo:</span>
                    <span className="font-medium text-[#111111]">{row.pickupTime}</span>
                  </div>
                )}
                {row.vehicleName && (
                  <div>
                    <span className="text-[#898989] block font-medium">Categoría de vehículo:</span>
                    <span className="font-medium text-[#111111]">{row.vehicleName}</span>
                  </div>
                )}
                {row.specialRequirements && (
                  <div>
                    <span className="text-[#898989] block font-medium">Observaciones:</span>
                    <p className="whitespace-pre-wrap text-[#374151] bg-[#f8f9fa] p-2.5 rounded-lg mt-1">
                      {row.specialRequirements}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Manifiesto de Pasajeros */}
            <div className="product-card-surface p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Manifiesto de Pasajeros ({row.passengers.length})</span>
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {row.passengers.map((p, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[#f8f9fa] flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-[#111111]">
                      {i + 1}. {p.firstName} {p.lastName}
                    </span>
                    <span className="text-[#6b7280] font-mono text-[11px]">
                      {p.docNumber ? `${p.docType}: ${p.docNumber}` : 'Sin documento'}
                    </span>
                  </div>
                ))}
                {!row.passengers.length && (
                  <p className="text-xs text-[#898989]">Sin pasajeros registrados.</p>
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
          <div className="product-card-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#111111]">Historial Operativo</h3>
            {!row.events.length && (
              <p className="text-xs text-[#898989]">
                Esta reserva no tiene eventos registrados aún.
              </p>
            )}
            <div className="space-y-3">
              {row.events.map((event) => (
                <div key={event.id} className="border-l-2 border-[#e5e7eb] pl-3 py-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-[#111111]">
                      {event.fromStatus ? `${operationLabels[event.fromStatus]} → ` : ''}
                      {operationLabels[event.toStatus]}
                    </span>
                    <span className="text-[#898989] text-[11px]">
                      {new Date(event.createdAt).toLocaleString('es-PE', {
                        timeZone: 'America/Lima',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6b7280]">{event.actorLabel}</p>
                  {event.note && (
                    <p className="text-xs text-[#374151] bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e5e7eb] whitespace-pre-wrap">
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
            <Link href="/reservations" className="underline text-xs font-semibold">
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
        redirect('/reservations?new=1');
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
              href={`/reservations?new=1&kind=${kind}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-[#111111]"
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
              <Link href="/reservations?new=1" className="underline text-xs font-semibold">
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
          />

          <div className="flex gap-2 border-b border-[#e5e7eb] pb-3">
            <Link
              href="/reservations?new=1&kind=tours"
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                kind === 'tours' ? 'bg-[#111111] text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
              }`}
            >
              Tours
            </Link>
            <Link
              href="/reservations?new=1&kind=transfers"
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                kind === 'transfers' ? 'bg-[#111111] text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
              }`}
            >
              Traslados
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/reservations?new=1&kind=${kind}&serviceId=${r.id}`}
                className="p-4 rounded-xl border border-[#e5e7eb] bg-white hover:border-[#111111] hover:bg-[#f8f9fa] transition-all flex items-center justify-between group shadow-none"
              >
                <div>
                  <span className="font-medium text-sm text-[#111111] block group-hover:text-black transition-colors">
                    {r.title}
                  </span>
                  {r.slug && <span className="text-xs text-[#6b7280] font-mono">/{r.slug}</span>}
                </div>
                <Plus className="w-4 h-4 text-[#898989] group-hover:text-[#111111] transition-colors" />
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
                href={`/reservations?new=1&kind=${kind}&after=${list.nextCursor}`}
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
        title="Reservas"
        description="Gestiona las reservas de tu agencia."
        actions={
          <Link
            href="/reservations?new=1"
            className="product-button-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva reserva</span>
          </Link>
        }
      />

      {params.saved === '1' && (
        <div
          role="status"
          className="p-3 rounded-lg bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span>Reserva guardada con éxito.</span>
        </div>
      )}

      {/* Filter Tabs by Operation Status */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-[#e5e7eb] pb-3">
        <Link
          href="/reservations"
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            !params.status
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]'
          }`}
        >
          Todas
        </Link>
        {Object.entries(operationLabels).map(([statusKey, label]) => {
          const isActive = params.status === statusKey;
          return (
            <Link
              key={statusKey}
              href={`/reservations?status=${statusKey}`}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Grouped List / Modern Data Table */}
      <div className="product-card-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-medium">Código / Servicio</th>
                <th className="py-2.5 px-4 font-medium">Cliente</th>
                <th className="py-2.5 px-4 font-medium">Fecha del Servicio</th>
                <th className="py-2.5 px-4 font-medium">Estado Operativo</th>
                <th className="py-2.5 px-4 font-medium text-right">Total Acordado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {list.data.map((row) => {
                const publicCode = row.code ?? row.id.slice(0, 8);
                return (
                  <tr key={row.id} className="product-data-row">
                    <td className="py-3 px-4 pr-3">
                      <Link
                        href={`/reservations?id=${row.id}`}
                        className="font-semibold text-[#111111] text-sm hover:underline font-mono"
                      >
                        {publicCode}
                      </Link>
                      <p className="text-[#6b7280] text-xs mt-0.5">
                        {row.serviceTitle ?? 'Reserva anterior'}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#111111]">
                      {row.customerFirstName} {row.customerLastName}
                    </td>
                    <td className="py-3 px-4 text-[#6b7280] font-mono text-[11px]">
                      {row.date.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={row.operationStatus || 'PENDING'} />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#111111]">
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
                  <td colSpan={5} className="py-8 text-center text-[#898989]">
                    No hay reservas todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[#e5e7eb] flex items-center justify-between text-xs text-[#6b7280]">
          <div>{list.data.length} reservas listadas</div>
          <div className="flex gap-4 font-medium">
            {params.after && (
              <Link
                href={`/reservations${
                  params.status ? `?status=${encodeURIComponent(String(params.status))}` : ''
                }`}
                className="hover:underline text-[#111111]"
              >
                Primera página
              </Link>
            )}
            {list.nextCursor && (
              <Link href={`/reservations?${nextParams}`} className="hover:underline text-[#111111]">
                Siguiente página
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
