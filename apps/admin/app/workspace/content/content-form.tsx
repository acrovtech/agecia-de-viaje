'use client';

import React, { useActionState, useState } from 'react';
import type { CategoryResource, VehicleResource, TourContent, TransferContent } from '../../../lib/catalog-content';
import type { CatalogKind } from '../../../lib/catalog-editor';
import { RowEditor, type Row } from './row-editor';
import { catalogContentAction } from './actions';
import { StatusBadge } from '../../../components/design-system/status-badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function PublicationForm({
  kind,
  id,
  updatedAt,
  isPublished,
}: {
  kind: CatalogKind;
  id: string;
  updatedAt: string;
  isPublished: boolean;
}) {
  const [state, action, pending] = useActionState(catalogContentAction, null);

  return (
    <form action={action} className="rounded-xl bg-white p-5 space-y-4 shadow-cal-surface">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="operation" value="publication" />
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({ expectedUpdatedAt: updatedAt, isPublished: !isPublished })}
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#111111]">Estado de Publicación en Catálogo</h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Los borradores solo son visibles para operadores; los servicios publicados aparecen en la vitrina pública.
          </p>
        </div>
        <StatusBadge status={isPublished ? 'PUBLISHED' : 'DRAFT'} />
      </div>

      {state?.error && (
        <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-2.5 rounded-lg border border-[#fecaca]">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className={`h-8 px-3 text-xs font-semibold rounded-md shadow-none transition-colors cursor-pointer disabled:opacity-50 ${
          isPublished
            ? 'bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#111111] shadow-cal-ring'
            : 'bg-[#111111] hover:bg-[#242424] text-white'
        }`}
      >
        {pending ? 'Procesando…' : isPublished ? 'Retirar publicación (Pasar a borrador)' : 'Publicar servicio'}
      </button>
    </form>
  );
}

const stringifyRows = (rows: object[]): Row[] =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value === null ? '' : String(value)]),
    ),
  );

export function ContentForm({
  kind,
  record,
  categories,
  vehicles,
}: {
  kind: CatalogKind;
  record: TourContent | TransferContent;
  categories: CategoryResource[];
  vehicles: VehicleResource[];
}) {
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
  const [prices, setPrices] = useState(
    stringifyRows(
      tour?.privatePricing ??
        transfer?.vehiclePrices.map((row) => ({ vehicleId: row.vehicleId, price: row.price })) ??
        [],
    ),
  );

  const shared = { expectedUpdatedAt: record.updatedAt, hasPrivateService: privateService };
  const payload =
    kind === 'tours'
      ? {
          ...shared,
          categoryIds: selectedCategories,
          images: images.map((row) => ({ url: row.url, alt: row.alt || null })),
          itineraries: itineraries.map((row) => ({ title: row.title, content: row.content })),
          inclusions: inclusions.map((row) => ({ content: row.content })),
          exclusions: exclusions.map((row) => ({ content: row.content })),
          recommendations: recommendations.map((row) => ({ content: row.content })),
          faqs: faqs.map((row) => ({ question: row.question, answer: row.answer })),
          privatePricing: prices.map((row) => ({ pax: Number(row.pax), price: Number(row.price) })),
        }
      : {
          ...shared,
          vehiclePrices: prices.map((row) => ({ vehicleId: row.vehicleId, price: Number(row.price) })),
        };

  return (
    <form action={action} className="bg-white rounded-xl shadow-cal-surface p-5 sm:p-6 space-y-6">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={record.id} />
      <input type="hidden" name="operation" value="content" />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      {state?.error && (
        <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-2.5 rounded-lg border border-[#fecaca]">
          {state.error}
        </p>
      )}

      <fieldset disabled={pending} className="space-y-6">
        {kind === 'tours' && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                Categorías Asociadas
              </h4>
              <div className="flex flex-wrap gap-3 pt-1">
                {categories.map((row) => (
                  <label
                    key={row.id}
                    className="text-xs flex items-center gap-2 p-2 rounded-lg border border-[#e5e7eb] hover:bg-[#f8f9fa] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(row.id)}
                      onChange={(event) =>
                        setCategories(
                          event.target.checked
                            ? [...selectedCategories, row.id]
                            : selectedCategories.filter((id) => id !== row.id),
                        )
                      }
                      className="w-3.5 h-3.5 rounded text-[#111111] border-[#e5e7eb]"
                    />
                    <span className="font-medium text-[#111111]">{row.name}</span>
                  </label>
                ))}
              </div>
              {!categories.length && (
                <p className="text-xs text-[#898989]">
                  Crea categorías en Recursos antes de asignarlas.
                </p>
              )}
            </div>

            <RowEditor
              title="Galería de imágenes secundarias"
              rows={images}
              onChange={setImages}
              fields={[
                { key: 'url', label: 'URL de la imagen' },
                { key: 'alt', label: 'Descripción accesible', optional: true },
              ]}
            />
            <RowEditor
              title="Etapas del itinerario"
              rows={itineraries}
              onChange={setItineraries}
              fields={[
                { key: 'title', label: 'Título de la etapa' },
                { key: 'content', label: 'Detalle o descripción', type: 'long' },
              ]}
            />
            <RowEditor
              title="Inclusiones (Qué incluye)"
              rows={inclusions}
              onChange={setInclusions}
              fields={[{ key: 'content', label: 'Elemento incluido' }]}
            />
            <RowEditor
              title="Exclusiones (Qué no incluye)"
              rows={exclusions}
              onChange={setExclusions}
              fields={[{ key: 'content', label: 'Elemento excluido' }]}
            />
            <RowEditor
              title="Recomendaciones para el viajero"
              rows={recommendations}
              onChange={setRecommendations}
              fields={[{ key: 'content', label: 'Recomendación' }]}
            />
            <RowEditor
              title="Preguntas frecuentes (FAQ)"
              rows={faqs}
              onChange={setFaqs}
              fields={[
                { key: 'question', label: 'Pregunta' },
                { key: 'answer', label: 'Respuesta detallada', type: 'long' },
              ]}
            />
          </>
        )}

        {/* Modalidad Privada */}
        <div className="space-y-4 pt-2">
          <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#111111] cursor-pointer">
            <input
              type="checkbox"
              checked={privateService}
              onChange={(event) => setPrivate(event.target.checked)}
              className="w-4 h-4 rounded text-[#111111] focus:ring-[#111111] border-[#e5e7eb]"
            />
            <span>Ofrecer modalidad privada en este servicio</span>
          </label>

          {privateService && (
            <RowEditor
              title="Tarifas privadas"
              rows={prices}
              onChange={setPrices}
              limit={100}
              fields={
                kind === 'tours'
                  ? [
                      { key: 'pax', label: 'Cantidad de pasajeros (Pax)', type: 'number' },
                      { key: 'price', label: 'Precio por persona (USD)', type: 'number' },
                    ]
                  : [
                      {
                        key: 'vehicleId',
                        label: 'Vehículo comercial',
                        options: vehicles
                          .filter((row) => row.isActive)
                          .map((row) => ({
                            value: row.id,
                            label: `${row.name} · ${row.maxPax} pasajeros`,
                          })),
                      },
                      { key: 'price', label: 'Precio total por vehículo (USD)', type: 'number' },
                    ]
              }
            />
          )}
        </div>

        <button
          disabled={pending}
          className="h-10 px-5 bg-[#111111] hover:bg-[#242424] text-white rounded-lg text-xs font-semibold shadow-none disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'Guardando…' : 'Guardar borrador de contenido'}
        </button>
      </fieldset>
    </form>
  );
}
