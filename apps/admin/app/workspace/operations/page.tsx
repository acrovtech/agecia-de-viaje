import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { isApiAdmin } from '../../../lib/admin-mode';
import {
  serviceResourceSchema,
  fleetVehicleSchema,
  type ServiceResourceItem,
  type FleetVehicleItem,
} from '../../../lib/reservations';
import { ServiceResourceForm, FleetVehicleForm } from './forms';

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
  guide: z.object({ id: z.string(), displayName: z.string(), phone: z.string().nullable() }).nullable(),
  driver: z.object({ id: z.string(), displayName: z.string(), phone: z.string().nullable() }).nullable(),
  vehicle: z.object({ id: z.string(), internalLabel: z.string(), plate: z.string(), vehicleTypeName: z.string(), capacity: z.number().nullable().optional() }).nullable(),
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
    if (error instanceof CentralApiError && error.status === 401) redirect('/login?expired=1');
    return (
      <main className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-semibold">Sesión no disponible</h1>
        <Link href="/workspace" className="underline">Volver</Link>
      </main>
    );
  }

  const { token, identity } = session;
  if (!['OWNER', 'ADMIN', 'OPERATOR'].includes(identity.role)) {
    return (
      <main className="p-8">
        <p role="alert">Tu rol no permite acceder al módulo de operaciones.</p>
        <Link href="/workspace" className="underline">Volver</Link>
      </main>
    );
  }

  const canMutate = ['OWNER', 'ADMIN'].includes(identity.role);
  const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}`;
  const view = params.view === 'personnel' ? 'personnel' : params.view === 'fleet' ? 'fleet' : 'dispatch';

  let content;
  try {
    if (view === 'dispatch') {
      const today = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const date = typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
      const missing = typeof params.missing === 'string' ? params.missing : '';
      const query = new URLSearchParams({ date, ...(missing ? { missing } : {}) });

      const raw = await centralRequest(`${base}/operations/dispatch?${query}`, token);
      const dispatch = dispatchResponseSchema.parse(raw);

      content = (
        <section className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Despacho operativo del día</h2>
            <form method="get" className="flex items-center gap-2">
              <input type="hidden" name="view" value="dispatch" />
              <label className="text-sm">Fecha: </label>
              <input
                type="date"
                name="date"
                defaultValue={date}
                className="border rounded-lg p-1.5 text-sm"
              />
              <button className="bg-[#062918] text-white px-3 py-1.5 rounded-lg text-sm">Consultar</button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}`}
              className={`px-3 py-1.5 rounded-lg border ${!missing ? 'bg-[#062918] text-white' : 'bg-white'}`}
            >
              Todos ({dispatch.total})
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=ANY`}
              className={`px-3 py-1.5 rounded-lg border ${missing === 'ANY' ? 'bg-[#062918] text-white' : 'bg-white'}`}
            >
              Incompletos
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=GUIDE`}
              className={`px-3 py-1.5 rounded-lg border ${missing === 'GUIDE' ? 'bg-[#062918] text-white' : 'bg-white'}`}
            >
              Falta guía
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=DRIVER`}
              className={`px-3 py-1.5 rounded-lg border ${missing === 'DRIVER' ? 'bg-[#062918] text-white' : 'bg-white'}`}
            >
              Falta conductor
            </Link>
            <Link
              href={`/workspace/operations?view=dispatch&date=${date}&missing=VEHICLE`}
              className={`px-3 py-1.5 rounded-lg border ${missing === 'VEHICLE' ? 'bg-[#062918] text-white' : 'bg-white'}`}
            >
              Falta vehículo
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Reserva / Servicio</th>
                  <th>Hora / Recojo</th>
                  <th>Pax</th>
                  <th>Guía</th>
                  <th>Conductor</th>
                  <th>Vehículo</th>
                </tr>
              </thead>
              <tbody>
                {dispatch.data.map((item) => (
                  <tr key={item.reservationId} className="border-b">
                    <td className="py-3">
                      <Link
                        href={`/workspace/reservations?id=${item.reservationId}`}
                        className="font-medium underline block"
                      >
                        {item.code ?? item.reservationId}
                      </Link>
                      <span className="text-slate-500 text-xs">{item.serviceTitle ?? 'Servicio'}</span>
                    </td>
                    <td>
                      {item.pickupTime ? <strong>{item.pickupTime}</strong> : 'Sin hora'}
                      <span className="block text-xs text-slate-500">{item.pickupHotel || 'No especificado'}</span>
                    </td>
                    <td>{item.pax}</td>
                    <td>
                      {item.guide ? (
                        <span>{item.guide.displayName}</span>
                      ) : item.missing.guide ? (
                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                          Sin guía
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No requerido</span>
                      )}
                    </td>
                    <td>
                      {item.driver ? (
                        <span>{item.driver.displayName}</span>
                      ) : item.missing.driver ? (
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                          Sin conductor
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Opcional</span>
                      )}
                    </td>
                    <td>
                      {item.vehicle ? (
                        <div>
                          <span>{item.vehicle.internalLabel}</span>
                          <span className="block text-xs text-slate-500">[{item.vehicle.plate}]</span>
                        </div>
                      ) : item.missing.vehicle ? (
                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                          Sin vehículo
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No asignado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!dispatch.data.length && (
              <p className="py-6 text-center text-slate-500">No hay servicios programados para esta fecha con el filtro seleccionado.</p>
            )}
          </div>
        </section>
      );
    } else if (view === 'personnel') {
      const raw = await centralRequest(`${base}/operations/resources`, token);
      const list = z.object({ data: z.array(serviceResourceSchema), nextCursor: z.string().nullable() }).parse(raw);
      const selected = list.data.find((r) => r.id === params.edit);

      content = (
        <section className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Personal de Servicio (Guías y Conductores)</h2>
              <p className="text-sm text-slate-600">Guías de turismo y conductores profesionales disponibles para asignación.</p>
            </div>
            {canMutate && (
              <Link
                href="/workspace/operations?view=personnel&edit=new"
                className="bg-[#062918] text-white px-4 py-2 rounded-lg text-sm"
              >
                Registrar personal
              </Link>
            )}
          </div>

          {canMutate && (selected || params.edit === 'new') && (
            <ServiceResourceForm key={selected?.id ?? 'new'} resource={selected} />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Nombre</th>
                  <th>Tipo</th>
                  <th>Teléfono / WhatsApp</th>
                  <th>Documento</th>
                  <th>Estado</th>
                  {canMutate && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {list.data.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-3 font-medium">{r.displayName}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.type === 'GUIDE' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {r.type === 'GUIDE' ? 'Guía' : 'Conductor'}
                      </span>
                    </td>
                    <td>{r.phone || 'Sin teléfono'}</td>
                    <td>{r.documentNumber || '-'}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                        {r.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canMutate && (
                      <td>
                        <Link
                          href={`/workspace/operations?view=personnel&edit=${r.id}`}
                          className="underline text-sm"
                        >
                          Editar
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.data.length && (
              <p className="py-4 text-slate-500">No hay personal registrado en tu agencia aún.</p>
            )}
          </div>
        </section>
      );
    } else {
      // view === 'fleet'
      const [vehiclesRaw, catalogRaw] = await Promise.all([
        centralRequest(`${base}/operations/vehicles`, token),
        centralRequest(`${base}/catalog/vehicles`, token),
      ]);
      const list = z.object({ data: z.array(fleetVehicleSchema), nextCursor: z.string().nullable() }).parse(vehiclesRaw);
      const vehicleTypes = vehicleTypeCatalogSchema.parse(catalogRaw).data;
      const selected = list.data.find((v) => v.id === params.edit);

      content = (
        <section className="bg-white border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Flota Operativa (Unidades Físicas)</h2>
              <p className="text-sm text-slate-600">Vehículos físicos de la agencia vinculados a sus categorías comerciales.</p>
            </div>
            {canMutate && (
              <Link
                href="/workspace/operations?view=fleet&edit=new"
                className="bg-[#062918] text-white px-4 py-2 rounded-lg text-sm"
              >
                Registrar unidad
              </Link>
            )}
          </div>

          {canMutate && (selected || params.edit === 'new') && (
            <FleetVehicleForm key={selected?.id ?? 'new'} vehicle={selected} vehicleTypes={vehicleTypes} />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3">Unidad</th>
                  <th>Placa</th>
                  <th>Categoría</th>
                  <th>Capacidad</th>
                  <th>Estado</th>
                  {canMutate && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {list.data.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td className="py-3 font-medium">{v.internalLabel}</td>
                    <td><strong className="tracking-wider">{v.plate}</strong></td>
                    <td>{v.vehicleType.name}</td>
                    <td>{v.capacity ?? v.vehicleType.maxPax} pasajeros</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs ${v.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                        {v.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canMutate && (
                      <td>
                        <Link
                          href={`/workspace/operations?view=fleet&edit=${v.id}`}
                          className="underline text-sm"
                        >
                          Editar
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.data.length && (
              <p className="py-4 text-slate-500">No hay unidades de flota registradas aún.</p>
            )}
          </div>
        </section>
      );
    }
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) redirect('/login?expired=1');
    content = (
      <p role="alert" className="text-red-700 p-4 bg-red-50 rounded-lg">
        No pudimos cargar la información operativa de tu agencia. Vuelve a intentarlo.
      </p>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/workspace" className="underline">Catálogo y equipo</Link>
        <Link href="/workspace/reservations" className="underline">Reservas</Link>
        <Link href="/workspace/operations" className="font-semibold text-[#062918]">Operaciones y Recursos</Link>
      </nav>

      <div>
        <h1 className="text-3xl font-semibold text-[#062918]">Operaciones · {identity.agencyName}</h1>
        <p className="text-sm text-slate-600 mt-1">Gestión de recursos operativos, flota y despacho diario.</p>
      </div>

      {params.saved === '1' && (
        <p role="status" className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          Cambios guardados con éxito.
        </p>
      )}

      <nav aria-label="Secciones de operaciones" className="flex flex-wrap gap-2">
        <Link
          href="/workspace/operations?view=dispatch"
          aria-current={view === 'dispatch' ? 'page' : undefined}
          className={`px-4 py-2 rounded-lg text-sm ${view === 'dispatch' ? 'bg-[#062918] text-white' : 'bg-white border'}`}
        >
          Despacho diario
        </Link>
        <Link
          href="/workspace/operations?view=personnel"
          aria-current={view === 'personnel' ? 'page' : undefined}
          className={`px-4 py-2 rounded-lg text-sm ${view === 'personnel' ? 'bg-[#062918] text-white' : 'bg-white border'}`}
        >
          Personal (Guías y Conductores)
        </Link>
        <Link
          href="/workspace/operations?view=fleet"
          aria-current={view === 'fleet' ? 'page' : undefined}
          className={`px-4 py-2 rounded-lg text-sm ${view === 'fleet' ? 'bg-[#062918] text-white' : 'bg-white border'}`}
        >
          Flota operativa
        </Link>
      </nav>

      {content}
    </main>
  );
}
