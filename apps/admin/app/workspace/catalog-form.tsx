'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import type { CatalogDetail, CatalogKind } from '../../lib/catalog-editor';
import { saveCatalogAction } from './catalog-actions';

export function CatalogForm({ kind, record }: { kind: CatalogKind; record?: CatalogDetail }) {
  const [state, action, pending] = useActionState(saveCatalogAction, null);
  const [fields, setFields] = useState<Record<string, string>>({
    title: record?.title ?? '', slug: record?.slug ?? '', description: record?.description ?? '', duration: record?.duration ?? '',
    bannerImage: record?.bannerImage ?? '', cardImage: record?.cardImage ?? '', region: record?.region ?? '',
    origin: record?.origin ?? '', destination: record?.destination ?? '', tripType: record?.tripType ?? 'Solo ida',
    sharedPrice: record?.sharedPrice?.toString() ?? '',
  });
  const [shared, setShared] = useState(record?.hasSharedService ?? true);
  const [active, setActive] = useState(record?.isActive ?? false);
  const inputClass = 'w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 bg-white';
  const field = (name: string, label: string, required = true, maxLength = 200) => <label key={name} className="block text-sm font-medium">{label}<input name={name} required={required} maxLength={maxLength} pattern={name === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined} autoCapitalize={name === 'slug' ? 'none' : undefined} value={fields[name]} onChange={(event) => setFields({ ...fields, [name]: event.target.value })} className={inputClass} /></label>;
  return <form action={action} className="max-w-3xl bg-white border rounded-xl p-6 space-y-5">
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={record?.id ?? ''} /><input type="hidden" name="updatedAt" value={record?.updatedAt ?? ''} />
    <h2 className="text-xl font-semibold">{record ? 'Editar' : 'Crear'} {kind === 'tours' ? 'tour' : 'traslado'}</h2>
    {state?.error && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded-lg">{state.error}</p>}
    <fieldset disabled={pending} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">{field('title', 'Nombre')}{field('slug', 'Nombre en la URL (ej. tour-cusco)', true, 160)}{field('duration', 'Duración')}{kind === 'tours' && field('region', 'Región', false)}</div>
      <label className="block text-sm font-medium">Descripción<textarea name="description" required={kind === 'tours'} maxLength={20000} rows={5} value={fields.description} onChange={(event) => setFields({ ...fields, description: event.target.value })} className={inputClass} /></label>
      <div className="grid sm:grid-cols-2 gap-4">{field('bannerImage', 'URL de imagen principal', kind === 'tours', 2000)}{kind === 'tours' && field('cardImage', 'URL de imagen de tarjeta', true, 2000)}</div>
      {kind === 'transfers' && <div className="grid sm:grid-cols-2 gap-4">{field('origin', 'Origen')}{field('destination', 'Destino')}<label className="block text-sm font-medium">Tipo de viaje<select name="tripType" value={fields.tripType} onChange={(event) => setFields({ ...fields, tripType: event.target.value })} className={inputClass}><option>Solo ida</option><option>Ida y vuelta</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" checked={active} onChange={(event) => setActive(event.target.checked)} />Traslado activo</label></div>}
      <fieldset className="border rounded-lg p-4 space-y-3"><legend className="px-2 font-medium">Modalidad compartida</legend><label className="flex gap-2 items-center text-sm"><input type="checkbox" name="hasSharedService" checked={shared} onChange={(event) => setShared(event.target.checked)} />Disponible</label>{shared && <label className="block text-sm font-medium">Precio por persona (USD)<input name="sharedPrice" type="number" step="0.01" min="0.01" max="1000000" required value={fields.sharedPrice} onChange={(event) => setFields({ ...fields, sharedPrice: event.target.value })} className={inputClass} /></label>}</fieldset>
      <div className="flex items-center gap-4"><button disabled={pending} className="bg-[#062918] text-white rounded-lg px-5 py-2 disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar servicio'}</button><Link href={`/workspace?view=${kind}`} className="text-sm underline">Volver al catálogo</Link></div>
    </fieldset>
  </form>;
}
