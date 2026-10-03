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
  Search,
  LayoutList,
  Calendar,
  ListFilter,
  ChevronLeft,
  ChevronRight,
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

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getMonthCalendar(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();

  const cells: Array<{
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
  }> = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, monthIndex - 1, d);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    cells.push({
      dateStr: `${y}-${m}-${dayStr}`,
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(monthIndex + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    cells.push({
      dateStr: `${year}-${m}-${dayStr}`,
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  const totalSlots = Math.ceil(cells.length / 7) * 7;
  let nextDay = 1;
  while (cells.length < totalSlots) {
    const nextDate = new Date(year, monthIndex + 1, nextDay);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(nextDay).padStart(2, '0');
    cells.push({
      dateStr: `${y}-${m}-${dayStr}`,
      dayNumber: nextDay,
      isCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
}

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

  const searchQuery = typeof params.q === 'string' ? params.q.trim().toLowerCase() : '';
  const viewMode = params.view === 'calendar' ? 'calendar' : 'list';

  const filteredData = searchQuery
    ? list.data.filter((item) =>
        (item.code?.toLowerCase().includes(searchQuery)) ||
        (item.customerFirstName?.toLowerCase().includes(searchQuery)) ||
        (item.customerLastName?.toLowerCase().includes(searchQuery)) ||
        (item.serviceTitle?.toLowerCase().includes(searchQuery))
      )
    : list.data;

  const PAGE_SIZE = 10;
  const rawPage = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const pageNumber = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const totalFiltered = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPage = Math.min(pageNumber, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalFiltered);
  const pageItems = filteredData.slice(startIndex, endIndex);

  const todayDateStr = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
  const defaultMonthStr = todayDateStr.slice(0, 7);
  const activeMonthStr = (typeof params.month === 'string' && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(params.month))
    ? params.month
    : defaultMonthStr;

  const [activeYearStr, activeMonthNumStr] = activeMonthStr.split('-');
  const activeYear = parseInt(activeYearStr || '2026', 10);
  const activeMonthIndex = (parseInt(activeMonthNumStr || '10', 10) || 1) - 1;

  const prevMonthDate = new Date(activeYear, activeMonthIndex - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthDate = new Date(activeYear, activeMonthIndex + 1, 1);
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const activeMonthLabel = `${MONTH_NAMES_ES[activeMonthIndex] ?? 'Octubre'} ${activeYear}`;

  const calendarCells = getMonthCalendar(activeYear, activeMonthIndex);

  // Group reservations by date for month calendar
  const reservationsByDate = new Map<string, typeof list.data>();
  for (const row of filteredData) {
    const dateKey = row.date.slice(0, 10);
    const arr = reservationsByDate.get(dateKey) ?? [];
    arr.push(row);
    reservationsByDate.set(dateKey, arr);
  }
  const reservationsInActiveMonth = filteredData.filter((r) => r.date.startsWith(activeMonthStr));

  const buildMonthHref = (monthStr: string) => {
    const q = new URLSearchParams();
    if (params.status && typeof params.status === 'string') q.set('status', params.status);
    if (searchQuery) q.set('q', searchQuery);
    q.set('view', 'calendar');
    q.set('month', monthStr);
    const str = q.toString();
    return `/reservations${str ? `?${str}` : ''}`;
  };

  const buildStatusHref = (statusKey?: string) => {
    const q = new URLSearchParams();
    if (statusKey) q.set('status', statusKey);
    if (searchQuery) q.set('q', searchQuery);
    if (viewMode === 'calendar') {
      q.set('view', 'calendar');
      if (activeMonthStr !== defaultMonthStr) q.set('month', activeMonthStr);
    }
    const str = q.toString();
    return `/reservations${str ? `?${str}` : ''}`;
  };

  const buildViewHref = (targetView: 'list' | 'calendar') => {
    const q = new URLSearchParams();
    if (params.status && typeof params.status === 'string') q.set('status', params.status);
    if (searchQuery) q.set('q', searchQuery);
    if (targetView === 'calendar') {
      q.set('view', 'calendar');
      if (activeMonthStr !== defaultMonthStr) q.set('month', activeMonthStr);
    } else {
      if (currentPage > 1) q.set('page', String(currentPage));
      if (params.after && typeof params.after === 'string') q.set('after', params.after);
    }
    const str = q.toString();
    return `/reservations${str ? `?${str}` : ''}`;
  };

  const buildPageHref = (targetPage: number) => {
    const q = new URLSearchParams();
    if (params.status && typeof params.status === 'string') q.set('status', params.status);
    if (searchQuery) q.set('q', searchQuery);
    if (viewMode === 'calendar') q.set('view', 'calendar');
    if (params.after && typeof params.after === 'string') q.set('after', params.after);
    if (targetPage > 1) q.set('page', String(targetPage));
    const str = q.toString();
    return `/reservations${str ? `?${str}` : ''}`;
  };

  const buildFirstPageHref = () => {
    const q = new URLSearchParams();
    if (params.status && typeof params.status === 'string') q.set('status', params.status);
    if (searchQuery) q.set('q', searchQuery);
    if (viewMode === 'calendar') q.set('view', 'calendar');
    const str = q.toString();
    return `/reservations${str ? `?${str}` : ''}`;
  };

  const buildNextBatchHref = (nextCursor: string) => {
    const q = new URLSearchParams();
    if (params.status && typeof params.status === 'string') q.set('status', params.status);
    if (searchQuery) q.set('q', searchQuery);
    if (viewMode === 'calendar') q.set('view', 'calendar');
    q.set('after', nextCursor);
    const str = q.toString();
    return `/reservations${str ? `?${str}` : ''}`;
  };

  return (
    <div className="space-y-4">
      {params.saved === '1' && (
        <div
          role="status"
          className="p-3 rounded-lg bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span>Reserva guardada con éxito.</span>
        </div>
      )}

      {/* Top Toolbar Row: Filters on Left, Search + New Reservation + Views on Right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#e5e7eb]">
        {/* Left: Filter tabs + Filtrar button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 inline-flex items-center p-1 bg-[#f3f4f6] rounded-[8px] text-xs box-border">
            <Link
              href={buildStatusHref(undefined)}
              className={`h-7 px-3 inline-flex items-center justify-center rounded-[6px] font-medium transition-all ${
                !params.status
                  ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                  : 'text-[#6b7280] hover:text-[#111111]'
              }`}
            >
              Todas
            </Link>
            {Object.entries(operationLabels).map(([statusKey, label]) => {
              const isActive = params.status === statusKey;
              return (
                <Link
                  key={statusKey}
                  href={buildStatusHref(statusKey)}
                  className={`h-7 px-3 inline-flex items-center justify-center rounded-[6px] font-medium transition-all ${
                    isActive
                      ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                      : 'text-[#6b7280] hover:text-[#111111]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-[8px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] hover:bg-[#f9fafb] shadow-2xs transition-colors cursor-pointer box-border"
          >
            <ListFilter className="w-3.5 h-3.5 text-[#6b7280]" />
            <span>Filtrar</span>
          </button>
        </div>

        {/* Right: Search, Nueva reserva, View toggle icons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Search input (to the left of Nueva reserva) */}
          <form method="GET" action="/reservations" className="relative flex items-center">
            {params.status && typeof params.status === 'string' && (
              <input type="hidden" name="status" value={params.status} />
            )}
            {viewMode === 'calendar' && (
              <input type="hidden" name="view" value="calendar" />
            )}
            {activeMonthStr && (
              <input type="hidden" name="month" value={activeMonthStr} />
            )}
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#9ca3af] pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Buscar reserva..."
              className="h-9 pl-8 pr-3 text-xs bg-white border border-[#e5e7eb] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] w-36 sm:w-48 placeholder:text-[#9ca3af] transition-all box-border"
            />
          </form>

          {/* Nueva reserva */}
          <Link
            href="/reservations?new=1"
            className="h-9 px-3.5 rounded-[8px] bg-[#111111] hover:bg-black text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer box-border"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva reserva</span>
          </Link>

          {/* View toggle icons: List & Calendar (to the right of Nueva reserva) */}
          <div className="h-9 inline-flex items-center p-1 bg-[#f3f4f6] border border-[#e5e7eb] rounded-[8px] shrink-0 box-border">
            <Link
              href={buildViewHref('list')}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-[6px] transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#6b7280] hover:text-[#111111]'
              }`}
              title="Vista de lista"
              aria-label="Vista de lista"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={buildViewHref('calendar')}
              className={`h-7 w-7 inline-flex items-center justify-center rounded-[6px] transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#6b7280] hover:text-[#111111]'
              }`}
              title="Vista de calendario"
              aria-label="Vista de calendario"
            >
              <Calendar className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content: Calendar View vs List View */}
      {viewMode === 'calendar' ? (
        <div className="product-card-surface overflow-hidden">
          {/* Calendar Header with Month Navigation */}
          <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fafafa]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Link
                  href={buildMonthHref(prevMonthStr)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111111] shadow-2xs transition-colors cursor-pointer"
                  title="Mes anterior"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={buildMonthHref(nextMonthStr)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111111] shadow-2xs transition-colors cursor-pointer"
                  title="Mes siguiente"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <h3 className="text-base font-bold text-[#111111] capitalize">
                {activeMonthLabel}
              </h3>

              {activeMonthStr !== defaultMonthStr && (
                <Link
                  href={buildMonthHref(defaultMonthStr)}
                  className="h-7 px-2.5 rounded-[6px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111111] shadow-2xs transition-colors inline-flex items-center"
                >
                  Hoy
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-[#6b7280]">
              <span className="font-medium">
                {reservationsInActiveMonth.length} {reservationsInActiveMonth.length === 1 ? 'reserva' : 'reservas'} en {MONTH_NAMES_ES[activeMonthIndex]}
              </span>
            </div>
          </div>

          {/* Weekdays Header */}
          <div className="grid grid-cols-7 border-b border-[#e5e7eb] bg-[#f8f9fa] text-center text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider py-2">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 border-l border-t border-[#e5e7eb] bg-[#e5e7eb] gap-[1px]">
            {calendarCells.map((cell) => {
              const isToday = cell.dateStr === todayDateStr;
              const dayReservations = reservationsByDate.get(cell.dateStr) ?? [];

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-[#fafafa]/80 text-[#9ca3af]'
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[11px] shadow-2xs'
                          : cell.isCurrentMonth
                            ? 'text-[#111111]'
                            : 'text-[#9ca3af]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {dayReservations.length > 0 && (
                      <span className="text-[10px] font-semibold text-[#6b7280]">
                        {dayReservations.length}
                      </span>
                    )}
                  </div>

                  {/* Day Reservations */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayReservations.slice(0, 3).map((res) => {
                      const publicCode = res.code ?? res.id.slice(0, 8);
                      const statusColors: Record<string, string> = {
                        CONFIRMED: 'bg-[#ecfdf5] border-[#bbf7d0] text-[#166534] hover:bg-[#dcfce7]',
                        PENDING: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e] hover:bg-[#fef3c7]',
                        CANCELLED: 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b] hover:bg-[#fee2e2]',
                        COMPLETED: 'bg-[#f0f9ff] border-[#bae6fd] text-[#0369a1] hover:bg-[#e0f2fe]',
                      };
                      const colorClass = statusColors[res.operationStatus || 'PENDING'] ?? statusColors.PENDING;

                      return (
                        <Link
                          key={res.id}
                          href={`/reservations?id=${res.id}`}
                          title={`${publicCode} - ${res.serviceTitle ?? 'Reserva'} (${res.customerFirstName} ${res.customerLastName})`}
                          className={`px-1.5 py-0.5 rounded-[4px] border text-[10px] leading-tight font-medium flex items-center justify-between gap-1 transition-all truncate block hover:shadow-2xs ${colorClass}`}
                        >
                          <span className="font-mono font-bold shrink-0">{publicCode}</span>
                          <span className="truncate text-[9.5px]">
                            {res.customerFirstName}
                          </span>
                          <span className="shrink-0 text-[9px] opacity-75 font-semibold">
                            {res.pax}p
                          </span>
                        </Link>
                      );
                    })}
                    {dayReservations.length > 3 && (
                      <span className="text-[10px] text-[#6b7280] font-medium block px-1">
                        +{dayReservations.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="p-3 border-t border-[#e5e7eb] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6b7280]">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[11px] font-semibold text-[#374151] uppercase tracking-wider">
                Estados:
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#166534]" />
                Confirmada
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#92400e]" />
                Pendiente
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#0369a1]" />
                Completada
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#991b1b]" />
                Cancelada
              </span>
            </div>
            <div className="text-[11px] text-[#6b7280]">
              Haz clic en cualquier reserva para abrir sus detalles
            </div>
          </div>
        </div>
      ) : (
        /* Grouped List / Modern Data Table */
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
                {pageItems.map((row) => {
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
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#898989]">
                      {searchQuery ? 'No se encontraron reservas con ese criterio' : 'No hay reservas todavía'}
                    </td>
                  </tr>
                )}

                {/* 11th Row: Dedicated table pagination row */}
                <tr className="border-t border-[#e5e7eb] bg-[#f9fafb]/80">
                  <td colSpan={5} className="py-2.5 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6b7280]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>Mostrando</span>
                        <span className="font-semibold text-[#111111]">
                          {totalFiltered > 0 ? startIndex + 1 : 0} - {endIndex}
                        </span>
                        <span>de</span>
                        <span className="font-semibold text-[#111111]">{totalFiltered}</span>
                        <span>reservas</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#9ca3af]">
                          Página {currentPage} de {totalPages}
                        </span>

                        <div className="inline-flex items-center gap-1">
                          {currentPage > 1 ? (
                            <Link
                              href={buildPageHref(currentPage - 1)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111111] shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>← Anterior</span>
                            </Link>
                          ) : params.after ? (
                            <Link
                              href={buildFirstPageHref()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111111] shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>« Primera pág.</span>
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#f3f4f6] bg-[#f9fafb] text-xs font-medium text-[#d1d5db] cursor-not-allowed">
                              <span>← Anterior</span>
                            </span>
                          )}

                          {currentPage < totalPages ? (
                            <Link
                              href={buildPageHref(currentPage + 1)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111111] shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Siguiente →</span>
                            </Link>
                          ) : list.nextCursor ? (
                            <Link
                              href={buildNextBatchHref(list.nextCursor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] hover:bg-[#f3f4f6] hover:text-[#111111] shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Siguiente lote »</span>
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#f3f4f6] bg-[#f9fafb] text-xs font-medium text-[#d1d5db] cursor-not-allowed">
                              <span>Siguiente →</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
