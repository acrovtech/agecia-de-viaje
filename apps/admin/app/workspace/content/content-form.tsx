'use client';

import { useActionState, useState } from 'react';
import type { CategoryResource, VehicleResource, TourContent, TransferContent } from '../../../lib/catalog-content';
import type { CatalogKind } from '../../../lib/catalog-editor';
import { RowEditor, type Row } from './row-editor';
import { catalogContentAction } from './actions';

export function PublicationForm({ kind, id, updatedAt, isPublished }: { kind: CatalogKind; id: string; updatedAt: string; isPublished: boolean }) {
  const [state, action, pending] = useActionState(catalogContentAction, null);
  return <form action={action} className="border rounded-xl bg-white p-5 space-y-3">
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="operation" value="publication" /><input type="hidden" name="payload" value={JSON.stringify({ expectedUpdatedAt: updatedAt, isPublished: !isPublished })} />
    <p className="font-semibold">{isPublished ? 'Publicado' : 'Borrador'}</p><p className="text-sm text-slate-600">Guardar una edición retira el servicio del catálogo público hasta que vuelvas a publicarlo. Guarda primero tus cambios; este botón publica la última versión guardada.</p>
    {state?.error && <p role="alert" className="text-red-700">{state.error}</p>}
    <button disabled={pending} className="bg-[#062918] text-white rounded-lg px-4 py-2 disabled:opacity-50">{pending ? 'Procesando…' : isPublished ? 'Retirar publicación' : 'Publicar servicio'}</button>
  </form>;
}

const stringifyRows = (rows: object[]): Row[] => rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value === null ? '' : String(value)])));
export function ContentForm({ kind, record, categories, vehicles }: { kind: CatalogKind; record: TourContent | TransferContent; categories: CategoryResource[]; vehicles: VehicleResource[] }) {
  const tour = 'itineraries' in record ? record : undefined;
  const transfer = 'vehiclePrices' in record ? record : undefined;
  const [state, action, pending] = useActionState(catalogContentAction, null);
  const [privateService, setPrivate] = useState(record.hasPrivateService);
  const [selectedCategories, setCategories] = useState(tour?.categories.map((row) => row.id) ?? []);
  const [images, setImages] = useState(stringifyRows(tour?.images ?? []));
  const [itineraries, setItineraries] = useState(stringifyRows(tour?.itineraries ?? []));
  const [inclusions, setInclusions] = useState(stringifyRows(tour?.inclusions ?? []));
  const [exclusions, setExclusions] = useState(stringifyRows(tour?.exclusions ?? []));
  const [recommendations, setRecommendations] = useState(stringifyRows(tour?.recommendations ?? []));
  const [faqs, setFaqs] = useState(stringifyRows(tour?.faqs ?? []));
  const [prices, setPrices] = useState(stringifyRows(tour?.privatePricing ?? transfer?.vehiclePrices.map((row) => ({ vehicleId: row.vehicleId, price: row.price })) ?? []));
  const shared = { expectedUpdatedAt: record.updatedAt, hasPrivateService: privateService };
  const payload = kind === 'tours' ? {
    ...shared, categoryIds: selectedCategories,
    images: images.map((row) => ({ url: row.url, alt: row.alt || null })), itineraries: itineraries.map((row) => ({ title: row.title, content: row.content })),
    inclusions: inclusions.map((row) => ({ content: row.content })), exclusions: exclusions.map((row) => ({ content: row.content })), recommendations: recommendations.map((row) => ({ content: row.content })),
    faqs: faqs.map((row) => ({ question: row.question, answer: row.answer })), privatePricing: prices.map((row) => ({ pax: Number(row.pax), price: Number(row.price) })),
  } : { ...shared, vehiclePrices: prices.map((row) => ({ vehicleId: row.vehicleId, price: Number(row.price) })) };
  return <form action={action} className="bg-white border rounded-xl p-5 space-y-5">
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={record.id} /><input type="hidden" name="operation" value="content" /><input type="hidden" name="payload" value={JSON.stringify(payload)} />
    {state?.error && <p role="alert" className="text-red-700">{state.error}</p>}
    <fieldset disabled={pending} className="space-y-5">
      {kind === 'tours' && <>
        <fieldset className="border rounded-xl p-4"><legend className="px-2 font-semibold">Categorías</legend><div className="flex flex-wrap gap-4">{categories.map((row) => <label key={row.id} className="text-sm flex gap-2"><input type="checkbox" checked={selectedCategories.includes(row.id)} onChange={(event) => setCategories(event.target.checked ? [...selectedCategories, row.id] : selectedCategories.filter((id) => id !== row.id))} />{row.name}</label>)}</div>{!categories.length && <p className="text-sm">Crea categorías en la sección Categorías antes de asignarlas.</p>}</fieldset>
        <RowEditor title="Imágenes" rows={images} onChange={setImages} fields={[{ key: 'url', label: 'URL de la imagen' }, { key: 'alt', label: 'Descripción accesible', optional: true }]} />
        <RowEditor title="Etapas del itinerario" rows={itineraries} onChange={setItineraries} fields={[{ key: 'title', label: 'Título' }, { key: 'content', label: 'Descripción', type: 'long' }]} />
        <RowEditor title="Inclusiones" rows={inclusions} onChange={setInclusions} fields={[{ key: 'content', label: 'Incluye' }]} />
        <RowEditor title="Exclusiones" rows={exclusions} onChange={setExclusions} fields={[{ key: 'content', label: 'No incluye' }]} />
        <RowEditor title="Recomendaciones" rows={recommendations} onChange={setRecommendations} fields={[{ key: 'content', label: 'Recomendación' }]} />
        <RowEditor title="Preguntas frecuentes" rows={faqs} onChange={setFaqs} fields={[{ key: 'question', label: 'Pregunta' }, { key: 'answer', label: 'Respuesta', type: 'long' }]} />
      </>}
      <label className="flex gap-2 font-medium"><input type="checkbox" checked={privateService} onChange={(event) => setPrivate(event.target.checked)} />Ofrecer modalidad privada</label>
      <RowEditor title="Tarifas privadas" rows={prices} onChange={setPrices} limit={100} fields={kind === 'tours' ? [{ key: 'pax', label: 'Cantidad de pasajeros', type: 'number' }, { key: 'price', label: 'Precio por persona (USD)', type: 'number' }] : [{ key: 'vehicleId', label: 'Vehículo', options: vehicles.filter((row) => row.isActive).map((row) => ({ value: row.id, label: `${row.name} · ${row.maxPax} pasajeros` })) }, { key: 'price', label: 'Precio total por vehículo (USD)', type: 'number' }]} />
      <button disabled={pending} className="bg-[#062918] text-white rounded-lg px-5 py-2 disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar borrador'}</button>
    </fieldset>
  </form>;
}
