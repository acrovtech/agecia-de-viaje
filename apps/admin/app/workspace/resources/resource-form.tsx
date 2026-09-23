'use client';
import { useActionState, useState } from 'react';
import type { CategoryResource, VehicleResource } from '../../../lib/catalog-content';
import { catalogContentAction } from '../content/actions';
import { RowEditor, type Row } from '../content/row-editor';

export function ResourceForm({ kind, record }: { kind: 'categories' | 'vehicles'; record?: CategoryResource | VehicleResource }) {
  const vehicle = record && 'code' in record ? record : undefined;
  const category = record && 'slug' in record ? record : undefined;
  const [state, action, pending] = useActionState(catalogContentAction, null);
  const [fields, setFields] = useState<Record<string, string>>({ name: record?.name ?? '', slug: category?.slug ?? '', code: vehicle?.code ?? '', subtitle: vehicle?.subtitle ?? '', maxPax: String(vehicle?.maxPax ?? 3), maxLuggage: String(vehicle?.maxLuggage ?? 3), image: vehicle?.image ?? '' });
  const [features, setFeatures] = useState<Row[]>(vehicle?.features.map((content) => ({ content })) ?? []);
  const [active, setActive] = useState(vehicle?.isActive ?? true);
  const payload = kind === 'categories' ? { name: fields.name, slug: fields.slug } : { name: fields.name, code: fields.code, subtitle: fields.subtitle || null, maxPax: Number(fields.maxPax), maxLuggage: Number(fields.maxLuggage), image: fields.image, features: features.map((row) => row.content), isActive: active };
  const input = (key: string, label: string, type = 'text', required = true) => <label className="block text-sm" key={key}>{label}<input type={type} required={required} maxLength={key === 'image' ? 2000 : 200} value={fields[key]} onChange={(event) => setFields({ ...fields, [key]: event.target.value })} className="block w-full border rounded-lg p-2 mt-1" /></label>;
  return <form action={action} className="bg-white border rounded-xl p-5 space-y-4">
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={record?.id ?? ''} /><input type="hidden" name="operation" value="resource" /><input type="hidden" name="payload" value={JSON.stringify({ ...payload, ...(record ? { expectedUpdatedAt: record.updatedAt } : {}) })} />
    <h2 className="text-xl font-semibold">{record ? 'Editar' : 'Crear'} {kind === 'categories' ? 'categoría' : 'vehículo'}</h2>
    {state?.error && <p role="alert" className="text-red-700">{state.error}</p>}
    <fieldset disabled={pending} className="space-y-4">
      {input('name', 'Nombre')}{kind === 'categories' ? input('slug', 'Nombre en la URL (ej. aventura)') : <>
        {input('code', 'Código (ej. mi-agencia-sedan)')}{input('subtitle', 'Subtítulo', 'text', false)}<div className="grid sm:grid-cols-2 gap-4">{input('maxPax', 'Capacidad de pasajeros', 'number')}{input('maxLuggage', 'Capacidad de equipaje', 'number')}</div>{input('image', 'URL de imagen')}
        <label className="flex gap-2"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Vehículo activo</label>
        <RowEditor title="Características" rows={features} onChange={setFeatures} limit={30} fields={[{ key: 'content', label: 'Característica' }]} />
      </>}
      {record && <p className="text-sm text-slate-600">Los servicios que usan este recurso volverán a borrador al guardar. Revísalos antes de publicarlos nuevamente.</p>}
      <button disabled={pending} className="px-4 py-2 bg-[#062918] text-white rounded-lg disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar'}</button>
    </fieldset>
  </form>;
}
