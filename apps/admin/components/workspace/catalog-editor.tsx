'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import type { CatalogDetail, CatalogKind } from '../../lib/catalog-editor';
import { saveCatalogAction } from '../../app/workspace/catalog-actions';
import { MediaUploader } from './media-uploader';
import { TourForm } from '../forms/tour-form';

interface CatalogEditorProps {
  kind: CatalogKind;
  record?: CatalogDetail;
}

export function CatalogEditor({ kind, record }: CatalogEditorProps) {
  // If editing/creating tours, render the exact TourForm design from the specification
  if (kind === 'tours') {
    return <TourForm initialData={record} />;
  }

  const [state, formAction, isPending] = useActionState(saveCatalogAction, null);

  // Transfer Form State
  const [fields, setFields] = useState<Record<string, string>>({
    title: record?.title ?? '',
    slug: record?.slug ?? '',
    description: record?.description ?? '',
    duration: record?.duration ?? '',
    bannerImage: record?.bannerImage ?? '',
    origin: record?.origin ?? '',
    destination: record?.destination ?? '',
    tripType: record?.tripType ?? 'Solo ida',
    sharedPrice: record?.sharedPrice?.toString() ?? '',
  });

  const [hasShared, setHasShared] = useState(record?.hasSharedService ?? true);
  const [isActive, setIsActive] = useState(record?.isActive ?? false);

  const inputClass =
    'w-full mt-1.5 h-[34px] px-3 bg-white border border-[#e5e7eb] rounded-md text-sm text-[#111111] placeholder-[#898989] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all';
  const labelClass = 'block text-xs sm:text-[13px] font-medium text-[#374151]';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-2">
        <Link
          href={`/catalog/${kind}`}
          className="p-1.5 text-[#6b7280] hover:text-[#111111] rounded-lg hover:bg-[#f3f4f6] transition-colors"
          title="Volver al catálogo"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
            Gestión de Traslado
          </span>
          <h1 className="text-[1.125rem] font-semibold text-[#111111]">
            {record ? 'Editar Traslado' : 'Crear Nuevo Traslado'}
          </h1>
        </div>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs sm:text-sm font-medium"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={record?.id ?? ''} />
        <input type="hidden" name="updatedAt" value={record?.updatedAt ?? ''} />

        {/* Sección 1: Información General */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
            1. Información General
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Nombre del traslado
              <input
                name="title"
                required
                value={fields.title}
                onChange={(e) => setFields({ ...fields, title: e.target.value })}
                placeholder="Ej. Traslado Aeropuerto Cusco - Valle Sagrado"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Enlace amigable (slug)
              <input
                name="slug"
                required
                value={fields.slug}
                onChange={(e) => setFields({ ...fields, slug: e.target.value })}
                placeholder="aeropuerto-cusco-valle-sagrado"
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Descripción del servicio
            <textarea
              name="description"
              rows={3}
              value={fields.description}
              onChange={(e) => setFields({ ...fields, description: e.target.value })}
              placeholder="Detalla los puntos de recogida, vehículos y condiciones..."
              className="w-full mt-1.5 p-3 bg-white border border-[#e5e7eb] rounded-md text-sm text-[#111111] placeholder-[#898989] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
            />
          </label>
        </section>

        {/* Sección 2: Ruta y Tiempos */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
            2. Ruta y Tiempos
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Punto de origen
              <input
                name="origin"
                required
                value={fields.origin}
                onChange={(e) => setFields({ ...fields, origin: e.target.value })}
                placeholder="Aeropuerto Alejandro Velasco Astete"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Punto de destino
              <input
                name="destination"
                required
                value={fields.destination}
                onChange={(e) => setFields({ ...fields, destination: e.target.value })}
                placeholder="Ollantaytambo"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Duración estimada
              <input
                name="duration"
                required
                value={fields.duration}
                onChange={(e) => setFields({ ...fields, duration: e.target.value })}
                placeholder="1h 45m"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Tipo de trayecto
              <select
                name="tripType"
                value={fields.tripType}
                onChange={(e) => setFields({ ...fields, tripType: e.target.value })}
                className={inputClass}
              >
                <option value="Solo ida">Solo ida</option>
                <option value="Ida y vuelta">Ida y vuelta</option>
                <option value="Por horas">Por horas / Disposición</option>
              </select>
            </label>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900"
              />
              <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Servicio operativo y disponible para venta inmediata
              </label>
            </div>
          </div>
        </section>

        {/* Sección 3: Tarifas y Precios */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
            3. Tarifas de Referencia
          </h2>

          <div className="flex items-center gap-3 pb-2">
            <input
              type="checkbox"
              id="hasSharedService"
              name="hasSharedService"
              checked={hasShared}
              onChange={(e) => setHasShared(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900"
            />
            <label htmlFor="hasSharedService" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Habilitar modalidad compartida con tarifa por pasajero
            </label>
          </div>

          {hasShared && (
            <label className={`max-w-xs ${labelClass}`}>
              Precio por persona ($ USD)
              <input
                name="sharedPrice"
                type="number"
                step="0.01"
                min="0.01"
                required={hasShared}
                placeholder="Ej. 25.00"
                value={fields.sharedPrice}
                onChange={(e) => setFields({ ...fields, sharedPrice: e.target.value })}
                className={inputClass}
              />
            </label>
          )}
        </section>

        {/* Sección 4: Multimedia */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
            4. Multimedia
          </h2>

          <MediaUploader
            name="bannerImage"
            label="Imagen representativa (Banner horizontal)"
            kind="TRANSFER"
            value={fields.bannerImage ?? ''}
            onChange={(val) => setFields((prev) => ({ ...prev, bannerImage: val }))}
            required={false}
            placeholder="https://..."
            helpText="Recomendado 1920x1080px o formato panorámico."
          />
        </section>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href={`/catalog/${kind}`}
            className="product-button-secondary text-xs"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="product-button-primary text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>{isPending ? 'Guardando…' : 'Guardar servicio'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
