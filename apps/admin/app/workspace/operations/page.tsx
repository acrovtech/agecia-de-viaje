import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  Compass,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  Users,
  Truck,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { isApiAdmin } from '../../../lib/admin-mode';
import {
  serviceResourceSchema,
  fleetVehicleSchema,
  type ServiceResourceItem,
  type FleetVehicleItem,
} from '../../../lib/reservations';
import { ServiceResourceForm, FleetVehicleForm } from './forms';
import { PageHeader } from '../../../components/design-system/page-header';
import { StatusBadge } from '../../../components/design-system/status-badge';
import { EmptyState } from '../../../components/design-system/empty-state';

export const dynamic = 'force-dynamic';

const dispatchItemSchema = z.object({
  reservationId: z.string(),
  code: z.string().nullable(),
  serviceTitle: z.string().nullable(),
  serviceType: z.string().nullable(),
  pax: z.number(),
  operationStatus: z.string().nullable(),
  pickupHotel: z.string().nullable(),
  pickupTime: z.string().nullable(),
  guide: z
    .object({ id: z.string(), displayName: z.string(), phone: z.string().nullable() })
    .nullable(),
  driver: z
    .object({ id: z.string(), displayName: z.string(), phone: z.string().nullable() })
    .nullable(),
  vehicle: z
    .object({
      id: z.string(),
      internalLabel: z.string(),
      plate: z.string(),
      vehicleTypeName: z.string(),
      capacity: z.number().nullable().optional(),
    })
    .nullable(),
  missing: z.object({
    guide: z.boolean(),
    driver: z.boolean(),
    vehicle: z.boolean(),
    any: z.boolean(),
  }),
});

const dispatchResponseSchema = z.object({
  date: z.string(),
  total: z.number(),
  data: z.array(dispatchItemSchema),
});

const vehicleTypeCatalogSchema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string(), maxPax: z.number() })),
});

export default async function OperationsPage({
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
        description="No fue posible conectar con el servicio central. Vuelve a iniciar sesión."
      />
    );
  }

  const { token, identity } = session;
  const canMutate = ['OWNER', 'ADMIN', 'OPERATOR'].includes(identity.role);
  if (!canMutate) {
    return (
      <EmptyState
        title="Acceso Restringido"
        description="Tu rol no tiene permiso para consultar o gestionar operaciones."
        action={
          <Link href="/workspace" className="underline text-xs font-semibold">
            Volver al inicio
          </Link>
        }
      />
    );
  }

  const view = params.view === 'personnel' ? 'personnel' : params.view === 'fleet' ? 'fleet' : 'dispatch';
  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;

  let content;
  try {
    if (view === 'dispatch') {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
      const date =
        typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
          ? params.date
          : today;
      const missing = typeof params.missing === 'string' ? params.missing : '';
      const query = new URLSearchParams({ date, ...(missing ? { missing } : {}) });

      const raw = await centralRequest(`${base}/operations/dispatch?${query}`, token);
      const dispatch = dispatchResponseSchema.parse(raw);

      // Calculate relative dates for quick navigation
      const currDateObj = new Date(date + 'T12:00:00Z');
      const prevDate = new Date(currDateObj.getTime() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const nextDate = new Date(currDateObj.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      content = (
        <div className="space-y-5">
          {/* Dispatch Date Control Bar */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-3 sm:p-4 shadow-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/workspace/operations?view=dispatch&date=${prevDate}${
                  missing ? `&missing=${missing}` : ''
                }`}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] bg-white text-[#111111] hover:bg-[#f8f9fa] transition-colors"
              >
                ← Día anterior
              </Link>
              <Link
                href={`/workspace/operations?view=dispatch&date=${today}${
                  missing ? `&missing=${missing}` : ''
                }`}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  date === today
                    ? 'bg-[#111111] text-white'
                    : 'border border-[#e5e7eb] bg-white hover:bg-[#f8f9fa] text-[#374151]'
                }`}
              >
                Hoy
              </Link>
              <Link
                href={`/workspace/operations?view=dispatch&date=${nextDate}${
                  missing ? `&missing=${missing}` : ''
                }`}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#e5e7eb] bg-white text-[#111111] hover:bg-[#f8f9fa] transition-colors"
              >
                Día siguiente →
              </Link>
            </div>

            <form method="get" className="flex items-center gap-2 text-xs">
              <input type="hidden" name="view" value="dispatch" />
              {missing && <input type="hidden" name="missing" value={missing} />}
              <span className="text-[#6b7280] font-medium">Fecha:</span>
              <input
                type="date"
                name="date"
                defaultValue={date}
                className="border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
              />
              <button className="bg-[#111111] hover:bg-[#242424] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer">
                Consultar
              </button>
            </form>
          </div>

          {/* Missing filters */}
          <div className="flex flex-wrap gap-2 text-xs border-b border-[#e5e7eb] pb-3">
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !missing
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
              }`}
            >
              Todos los servicios ({dispatch.total})
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=ANY`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                missing === 'ANY'
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
              }`}
            >
              Incompletos (Requieren atención)
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=GUIDE`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                missing === 'GUIDE'
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
              }`}
            >
              Falta guía
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=DRIVER`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                missing === 'DRIVER'
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
              }`}
            >
              Falta conductor
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=VEHICLE`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                missing === 'VEHICLE'
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
              }`}
            >
              Falta vehículo
            </Link>
          </div>

          {/* Dispatch Service Rows Table */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Reserva / Servicio</th>
                    <th className="py-3 px-4 font-semibold">Hora & Recojo</th>
                    <th className="py-3 px-4 font-semibold">Pax</th>
                    <th className="py-3 px-4 font-semibold">Guía</th>
                    <th className="py-3 px-4 font-semibold">Conductor</th>
                    <th className="py-3 px-4 font-semibold">Vehículo de Flota</th>
                    <th className="py-3 px-4 font-semibold text-right">Completitud</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {dispatch.data.map((item) => {
                    const publicCode = item.code ?? item.reservationId.slice(0, 8);
                    const isFullyAssigned = !item.missing.any;

                    return (
                      <tr key={item.reservationId} className="hover:bg-[#f8f9fa]/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/workspace/reservations?id=${item.reservationId}`}
                            className="font-medium text-[#111111] text-xs hover:underline font-mono"
                          >
                            {publicCode}
                          </Link>
                          <span className="text-[#6b7280] text-xs block truncate max-w-xs">
                            {item.serviceTitle ?? 'Servicio'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#111111]">
                            {item.pickupTime || 'Hora por definir'}
                          </div>
                          <span className="text-[11px] text-[#6b7280] block truncate max-w-[180px]">
                            {item.pickupHotel || 'No especificado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#111111]">{item.pax}</td>
                        <td className="py-3.5 px-4">
                          {item.guide ? (
                            <span className="font-medium text-[#111111]">
                              {item.guide.displayName}
                            </span>
                          ) : item.missing.guide ? (
                            <span className="inline-block px-2 py-0.5 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded text-[11px] font-medium">
                              Falta guía
                            </span>
                          ) : (
                            <span className="text-[#898989] text-xs">Opcional</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.driver ? (
                            <span className="font-medium text-[#111111]">
                              {item.driver.displayName}
                            </span>
                          ) : item.missing.driver ? (
                            <span className="inline-block px-2 py-0.5 bg-[#fffbeb] text-[#d97706] border border-[#fde68a] rounded text-[11px] font-medium">
                              Falta conductor
                            </span>
                          ) : (
                            <span className="text-[#898989] text-xs">Opcional</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.vehicle ? (
                            <div>
                              <span className="font-medium text-[#111111]">
                                {item.vehicle.internalLabel}
                              </span>
                              <span className="block text-[11px] text-[#6b7280] font-mono">
                                [{item.vehicle.plate}]
                              </span>
                            </div>
                          ) : item.missing.vehicle ? (
                            <span className="inline-block px-2 py-0.5 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded text-[11px] font-medium">
                              Falta vehículo
                            </span>
                          ) : (
                            <span className="text-[#898989] text-xs">Opcional</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isFullyAssigned ? (
                            <span className="inline-flex items-center gap-1 text-[#16a34a] text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#d97706] text-xs font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Incompleto</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {dispatch.data.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#898989]">
                        No hay servicios operativos programados para el {date}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else if (view === 'personnel') {
      const raw = await centralRequest(`${base}/operations/resources`, token);
      const list = z
        .object({ data: z.array(serviceResourceSchema), nextCursor: z.string().nullable() })
        .parse(raw);
      const selected = list.data.find((r) => r.id === params.edit);

      content = (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#111111]">
                Personal Operativo (Guías y Conductores)
              </h2>
              <p className="text-xs text-[#6b7280]">
                Guías oficiales y conductores asignables a los servicios de tu agencia.
              </p>
            </div>
            {canMutate && (
              <Link
                href="/workspace/operations?view=personnel&edit=new"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#111111] hover:bg-[#242424] text-white rounded-lg text-xs font-semibold shadow-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar colaborador</span>
              </Link>
            )}
          </div>

          {canMutate && (selected || params.edit === 'new') && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-none">
              <ServiceResourceForm key={selected?.id ?? 'new'} resource={selected} />
            </div>
          )}

          <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Nombre</th>
                    <th className="py-3 px-4 font-semibold">Rol Operativo</th>
                    <th className="py-3 px-4 font-semibold">Teléfono</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    {canMutate && <th className="py-3 px-4 font-semibold text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {list.data.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#111111] text-sm">
                        {item.displayName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#374151]">
                          {item.type === 'GUIDE' ? 'Guía de Turismo' : 'Conductor'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#6b7280]">
                        {item.phone || 'Sin registrar'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      {canMutate && (
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/workspace/operations?view=personnel&edit=${item.id}`}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                          >
                            Editar
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                  {list.data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#898989]">
                        No hay personal operativo registrado en tu agencia aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    } else {
      // view === 'fleet'
      const [vehiclesRaw, catalogRaw] = await Promise.all([
        centralRequest(`${base}/operations/vehicles`, token),
        centralRequest(`${base}/catalog/vehicles`, token),
      ]);
      const list = z
        .object({ data: z.array(fleetVehicleSchema), nextCursor: z.string().nullable() })
        .parse(vehiclesRaw);
      const vehicleTypes = vehicleTypeCatalogSchema.parse(catalogRaw).data;
      const selected = list.data.find((v) => v.id === params.edit);

      content = (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#111111]">
                Flota Operativa (Unidades Físicas)
              </h2>
              <p className="text-xs text-[#6b7280]">
                Vehículos físicos propios o contratados de la agencia asociados a su categoría.
              </p>
            </div>
            {canMutate && (
              <Link
                href="/workspace/operations?view=fleet&edit=new"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#111111] hover:bg-[#242424] text-white rounded-lg text-xs font-semibold shadow-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar unidad</span>
              </Link>
            )}
          </div>

          {canMutate && (selected || params.edit === 'new') && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-none">
              <FleetVehicleForm
                key={selected?.id ?? 'new'}
                vehicle={selected}
                vehicleTypes={vehicleTypes}
              />
            </div>
          )}

          <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Identificador</th>
                    <th className="py-3 px-4 font-semibold">Placa</th>
                    <th className="py-3 px-4 font-semibold">Tipo Comercial</th>
                    <th className="py-3 px-4 font-semibold">Capacidad Pax</th>
                    <th className="py-3 px-4 font-semibold">Estado</th>
                    {canMutate && <th className="py-3 px-4 font-semibold text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {list.data.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#111111] text-sm">
                        {item.internalLabel}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-[#111111]">
                        {item.plate}
                      </td>
                      <td className="py-3.5 px-4 text-[#374151]">{item.vehicleType.name}</td>
                      <td className="py-3.5 px-4 font-medium text-[#111111]">
                        {item.capacity ?? item.vehicleType.maxPax} pax
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      {canMutate && (
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/workspace/operations?view=fleet&edit=${item.id}`}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors"
                          >
                            Editar
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                  {list.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#898989]">
                        No hay vehículos de flota registrados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
  } catch {
    content = (
      <EmptyState
        title="Error operativo"
        description="No pudimos cargar la información de operaciones. Intenta nuevamente."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operaciones y Despacho Diario"
        description="Coordinación logística diaria, asignación de guías, conductores y unidades de flota."
        breadcrumbs={[
          { label: 'Inicio', href: '/workspace' },
          { label: 'Operaciones', isCurrent: true },
        ]}
      />

      {params.saved === '1' && (
        <div
          role="status"
          className="p-3 rounded-xl bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
          <span>Cambios guardados con éxito.</span>
        </div>
      )}

      {/* Main Operations Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#e5e7eb] pb-3">
        <Link
          href="/workspace/operations?view=dispatch"
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            view === 'dispatch'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          Despacho diario
        </Link>
        <Link
          href="/workspace/operations?view=personnel"
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            view === 'personnel'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          Personal (Guías y Conductores)
        </Link>
        <Link
          href="/workspace/operations?view=fleet"
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            view === 'fleet'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          Flota operativa
        </Link>
      </div>

      {content}
    </div>
  );
}
