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
    'block w-full border border-slate-200 rounded-lg p-2.5 mt-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900';
  const labelClass = 'block text-xs font-semibold text-slate-700 tracking-tight';

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

      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-base font-bold text-slate-900">
          {record ? 'Editar' : 'Crear'} {kind === 'categories' ? 'categoría' : 'vehículo comercial'}
        </h3>
      </div>

      {state?.error && (
        <p role="alert" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
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
            <label className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
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
          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Nota: Al modificar este recurso, los servicios vinculados volverán a estado borrador para su revisión antes de republicar.
          </p>
        )}

        <button
          disabled={pending}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'Guardando…' : 'Guardar recurso'}
        </button>
      </fieldset>
    </form>
  );
}
