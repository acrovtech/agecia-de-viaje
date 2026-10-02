'use client';

import React, { useActionState, useState } from 'react';
import type { CategoryResource, VehicleResource } from '../../../lib/catalog-content';
import { catalogContentAction } from '../content/actions';
import { RowEditor, type Row } from '../content/row-editor';
import { MediaUploader } from '../../../components/workspace/media-uploader';

export function ResourceForm({
  kind,
  record,
}: {
  kind: 'categories' | 'vehicles';
  record?: CategoryResource | VehicleResource;
}) {
  const vehicle = record && 'code' in record ? record : undefined;
  const category = record && 'slug' in record ? record : undefined;
  const [state, action, pending] = useActionState(catalogContentAction, null);
  const [fields, setFields] = useState<Record<string, string>>({
    name: record?.name ?? '',
    slug: category?.slug ?? '',
    code: vehicle?.code ?? '',
    subtitle: vehicle?.subtitle ?? '',
    maxPax: String(vehicle?.maxPax ?? 3),
    maxLuggage: String(vehicle?.maxLuggage ?? 3),
    image: vehicle?.image ?? '',
  });
  const [features, setFeatures] = useState<Row[]>(
    vehicle?.features.map((content) => ({ content })) ?? [],
  );
  const [active, setActive] = useState(vehicle?.isActive ?? true);

  const payload =
    kind === 'categories'
      ? { name: fields.name, slug: fields.slug }
      : {
          name: fields.name,
          code: fields.code,
          subtitle: fields.subtitle || null,
          maxPax: Number(fields.maxPax),
          maxLuggage: Number(fields.maxLuggage),
          image: fields.image,
          features: features.map((row) => row.content),
          isActive: active,
        };

  const inputClass =
    'h-[34px] block w-full border border-[#e5e7eb] rounded-lg px-3 mt-1 text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all';
  const labelClass = 'block text-xs sm:text-[13px] font-medium text-[#374151]';

  const input = (key: string, label: string, type = 'text', required = true) => (
    <label className={labelClass} key={key}>
      {label}
      <input
        type={type}
        required={required}
        maxLength={key === 'image' ? 2000 : 200}
        value={fields[key]}
        onChange={(event) => setFields({ ...fields, [key]: event.target.value })}
        className={inputClass}
      />
    </label>
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={record?.id ?? ''} />
      <input type="hidden" name="operation" value="resource" />
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          ...payload,
          ...(record ? { expectedUpdatedAt: record.updatedAt } : {}),
        })}
      />

      <div className="pb-1">
        <h3 className="text-base font-semibold tracking-tight text-[#111111]">
          {record ? 'Editar' : 'Crear'} {kind === 'categories' ? 'categoría' : 'vehículo comercial'}
        </h3>
      </div>

      {state?.error && (
        <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-2.5 rounded-lg border border-[#fecaca]">
          {state.error}
        </p>
      )}

      <fieldset disabled={pending} className="space-y-4">
        {input('name', 'Nombre')}
        {kind === 'categories' ? (
          input('slug', 'Nombre en la URL (ej. aventura)')
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              {input('code', 'Código comercial (ej. sedan-ejecutivo)')}
              {input('subtitle', 'Subtítulo o descripción breve', 'text', false)}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {input('maxPax', 'Capacidad de pasajeros (Pax)', 'number')}
              {input('maxLuggage', 'Capacidad de equipaje', 'number')}
            </div>
            <MediaUploader
              name="image"
              label="Imagen del vehículo"
              kind="VEHICLE"
              value={fields.image ?? ''}
              onChange={(val) => setFields((prev) => ({ ...prev, image: val }))}
              required={false}
              placeholder="https://..."
              helpText="Foto lateral o frontal de la unidad"
            />
            <label className="flex items-center gap-2 text-xs text-[#374151] font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="w-4 h-4 rounded text-[#111111] focus:ring-[#111111] border-[#e5e7eb]"
              />
              <span>Vehículo activo para cotizaciones comerciales</span>
            </label>
            <RowEditor
              title="Características comerciales"
              rows={features}
              onChange={setFeatures}
              limit={30}
              fields={[{ key: 'content', label: 'Característica' }]}
            />
          </>
        )}

        {record && (
          <p className="text-xs text-[#6b7280] bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e5e7eb]">
            Nota: Al modificar este recurso, los servicios vinculados volverán a estado borrador para su revisión antes de republicar.
          </p>
        )}

        <button
          disabled={pending}
          className="product-button-primary"
        >
          {pending ? 'Guardando…' : 'Guardar recurso'}
        </button>
      </fieldset>
    </form>
  );
}
