'use client';

import { useActionState } from 'react';
import { saveServiceResourceAction, saveFleetVehicleAction } from './actions';
import type { ServiceResourceItem, FleetVehicleItem } from '../../../lib/reservations';

const inputClass = 'block w-full rounded-lg border p-2 mt-1 bg-white';
const buttonClass = 'rounded-lg bg-[#062918] px-4 py-2 text-white disabled:opacity-50 text-sm';

export function ServiceResourceForm({
  resource,
}: {
  resource?: ServiceResourceItem | null;
}) {
  const [state, action, pending] = useActionState(saveServiceResourceAction, null);
  const isEdit = Boolean(resource?.id);

  return (
    <form action={action} className="space-y-4 border rounded-xl p-5 bg-white max-w-xl">
      <h3 className="font-semibold text-lg">
        {isEdit ? `Editar recurso: ${resource?.displayName}` : 'Registrar nuevo guía o conductor'}
      </h3>
      <input type="hidden" name="id" value={resource?.id ?? 'new'} />

      {!isEdit && (
        <label className="block">
          Tipo de recurso
          <select name="type" defaultValue="GUIDE" className={inputClass}>
            <option value="GUIDE">Guía de turismo</option>
            <option value="DRIVER">Conductor profesional</option>
          </select>
        </label>
      )}

      <label className="block">
        Nombre completo / Nombre público
        <input
          name="displayName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue={resource?.displayName ?? ''}
          placeholder="Ej: Carlos Mendoza"
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          Teléfono (WhatsApp / Coordinación)
          <input
            name="phone"
            type="tel"
            maxLength={40}
            defaultValue={resource?.phone ?? ''}
            placeholder="+51 984 000 000"
            className={inputClass}
          />
        </label>

        <label className="block">
          Correo electrónico (opcional)
          <input
            name="email"
            type="email"
            maxLength={254}
            defaultValue={resource?.email ?? ''}
            placeholder="guia@agencia.com"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        Documento de identidad / RUC / Licencia (opcional)
        <input
          name="documentNumber"
          type="text"
          maxLength={40}
          defaultValue={resource?.documentNumber ?? ''}
          placeholder="DNI o Licencia de conducir"
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="isActive"
          type="checkbox"
          value="true"
          defaultChecked={resource ? resource.isActive : true}
        />
        Recurso activo para nuevas asignaciones
      </label>

      {state?.error && <p role="alert" className="text-red-700 text-sm">{state.error}</p>}

      <div className="flex gap-3">
        <button className={buttonClass} disabled={pending}>
          {pending ? 'Guardando…' : isEdit ? 'Actualizar recurso' : 'Crear recurso'}
        </button>
      </div>
    </form>
  );
}

export function FleetVehicleForm({
  vehicle,
  vehicleTypes,
}: {
  vehicle?: FleetVehicleItem | null;
  vehicleTypes: { id: string; name: string; maxPax: number }[];
}) {
  const [state, action, pending] = useActionState(saveFleetVehicleAction, null);
  const isEdit = Boolean(vehicle?.id);

  return (
    <form action={action} className="space-y-4 border rounded-xl p-5 bg-white max-w-xl">
      <h3 className="font-semibold text-lg">
        {isEdit ? `Editar vehículo: ${vehicle?.internalLabel}` : 'Registrar nueva unidad física en flota'}
      </h3>
      <input type="hidden" name="id" value={vehicle?.id ?? 'new'} />

      <label className="block">
        Categoría de vehículo (Tarifario / Catálogo)
        <select
          name="vehicleTypeId"
          required
          defaultValue={vehicle?.vehicleTypeId ?? (vehicleTypes[0]?.id ?? '')}
          className={inputClass}
        >
          {vehicleTypes.map((vt) => (
            <option key={vt.id} value={vt.id}>
              {vt.name} (capacidad catálogo: {vt.maxPax} pax)
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          Etiqueta interna / Nombre de unidad
          <input
            name="internalLabel"
            type="text"
            required
            minLength={2}
            maxLength={100}
            defaultValue={vehicle?.internalLabel ?? ''}
            placeholder="Ej: Mercedes Sprinter 01"
            className={inputClass}
          />
        </label>

        <label className="block">
          Placa de rodaje / Matrícula
          <input
            name="plate"
            type="text"
            required
            minLength={3}
            maxLength={20}
            defaultValue={vehicle?.plate ?? ''}
            placeholder="Ej: X1A-852"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        Capacidad específica de pasajeros (dejar vacío para usar la de la categoría)
        <input
          name="capacity"
          type="number"
          min={1}
          max={200}
          defaultValue={vehicle?.capacity ?? ''}
          placeholder="Opcional: ej. 14"
          className={inputClass}
        />
      </label>

      <label className="block">
        Notas operativas (año, SOAT, mantenimiento, etc.)
        <textarea
          name="notes"
          maxLength={2000}
          defaultValue={vehicle?.notes ?? ''}
          placeholder="Detalles mecánicos, vigencia de revisiones técnicas..."
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          name="isActive"
          type="checkbox"
          value="true"
          defaultChecked={vehicle ? vehicle.isActive : true}
        />
        Unidad activa para asignación de servicios
      </label>

      {state?.error && <p role="alert" className="text-red-700 text-sm">{state.error}</p>}

      <div className="flex gap-3">
        <button className={buttonClass} disabled={pending}>
          {pending ? 'Guardando…' : isEdit ? 'Actualizar vehículo' : 'Registrar vehículo'}
        </button>
      </div>
    </form>
  );
}
