'use client';

import { useActionState } from 'react';
import { saveServiceResourceAction, saveFleetVehicleAction } from './actions';
import type { ServiceResourceItem, FleetVehicleItem } from '../../../lib/reservations';

const inputClass =
  'h-[34px] block w-full rounded-lg border border-[#e5e7eb] px-3 mt-1 bg-white text-sm text-[#111111] shadow-product-card focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all';
const textareaClass =
  'block w-full rounded-lg border border-[#e5e7eb] p-3 mt-1 bg-white text-sm text-[#111111] shadow-product-card focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all';
const buttonClass = 'product-button-primary';
const labelClass = 'block text-xs sm:text-[13px] font-medium text-[#374151]';

export function ServiceResourceForm({
  resource,
}: {
  resource?: ServiceResourceItem | null;
}) {
  const [state, action, pending] = useActionState(saveServiceResourceAction, null);
  const isEdit = Boolean(resource?.id);

  return (
    <form action={action} className="space-y-4 max-w-xl">
      <h3 className="font-semibold text-base text-[#111111]">
        {isEdit ? `Editar recurso: ${resource?.displayName}` : 'Registrar nuevo guía o conductor'}
      </h3>
      <input type="hidden" name="id" value={resource?.id ?? 'new'} />

      {!isEdit && (
        <label className={labelClass}>
          Tipo de recurso
          <select name="type" defaultValue="GUIDE" className={inputClass}>
            <option value="GUIDE">Guía de turismo</option>
            <option value="DRIVER">Conductor profesional</option>
          </select>
        </label>
      )}

      <label className={labelClass}>
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
        <label className={labelClass}>
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

        <label className={labelClass}>
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

      <label className={labelClass}>
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

      <label className="flex items-center gap-2 text-xs text-[#374151] cursor-pointer">
        <input
          name="isActive"
          type="checkbox"
          value="true"
          className="w-4 h-4 rounded text-[#111111] border-[#e5e7eb]"
          defaultChecked={resource ? resource.isActive : true}
        />
        Recurso activo para nuevas asignaciones
      </label>

      {state?.error && (
        <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-2.5 rounded-lg border border-[#fecaca]">
          {state.error}
        </p>
      )}

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
    <form action={action} className="space-y-4 max-w-xl">
      <h3 className="font-semibold text-base text-[#111111]">
        {isEdit ? `Editar vehículo: ${vehicle?.internalLabel}` : 'Registrar nueva unidad física en flota'}
      </h3>
      <input type="hidden" name="id" value={vehicle?.id ?? 'new'} />

      <label className={labelClass}>
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
        <label className={labelClass}>
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

        <label className={labelClass}>
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

      <label className={labelClass}>
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

      <label className={labelClass}>
        Notas operativas (año, SOAT, mantenimiento, etc.)
        <textarea
          name="notes"
          maxLength={2000}
          rows={3}
          defaultValue={vehicle?.notes ?? ''}
          placeholder="Detalles mecánicos, vigencia de revisiones técnicas..."
          className={textareaClass}
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-[#374151] cursor-pointer">
        <input
          name="isActive"
          type="checkbox"
          value="true"
          className="w-4 h-4 rounded text-[#111111] border-[#e5e7eb]"
          defaultChecked={vehicle ? vehicle.isActive : true}
        />
        Unidad activa para asignación de servicios
      </label>

      {state?.error && (
        <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-2.5 rounded-lg border border-[#fecaca]">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button className={buttonClass} disabled={pending}>
          {pending ? 'Guardando…' : isEdit ? 'Actualizar vehículo' : 'Registrar vehículo'}
        </button>
      </div>
    </form>
  );
}
