'use client';

import React, { useState, useEffect, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Save, Eye, Layers } from 'lucide-react';
import type { CatalogDetail, CatalogKind } from '../../lib/catalog-editor';
import { saveCatalogAction } from '../../app/workspace/catalog-actions';
import { MediaUploader } from './media-uploader';
import { EditorModeSwitch, type EditorMode } from '../design-system/editor-mode-switch';
import { GuidedProgress, type StepItem } from '../design-system/guided-progress';
import { RadioCardGroup, type RadioCardOption } from '../design-system/radio-card';
import { StickySaveBar } from '../design-system/sticky-save-bar';

interface CatalogEditorProps {
  kind: CatalogKind;
  record?: CatalogDetail;
}

const tourSteps: StepItem[] = [
  { id: 'basic', label: '1. Básico' },
  { id: 'service-type', label: '2. Tipo' },
  { id: 'modalities', label: '3. Modalidades' },
  { id: 'pricing', label: '4. Precios' },
  { id: 'content', label: '5. Contenido' },
  { id: 'media', label: '6. Multimedia' },
  { id: 'seo', label: '7. SEO' },
  { id: 'publication', label: '8. Publicación' },
  { id: 'review', label: '9. Revisión' },
];

const transferSteps: StepItem[] = [
  { id: 'basic', label: '1. Básico' },
  { id: 'route', label: '2. Ruta' },
  { id: 'modalities', label: '3. Modalidades' },
  { id: 'pricing', label: '4. Tarifas' },
  { id: 'media', label: '5. Multimedia' },
  { id: 'review', label: '6. Revisión' },
];

export function CatalogEditor({ kind, record }: CatalogEditorProps) {
  const [state, formAction, isPending] = useActionState(saveCatalogAction, null);

  // Form State
  const [fields, setFields] = useState<Record<string, string>>({
    title: record?.title ?? '',
    slug: record?.slug ?? '',
    description: record?.description ?? '',
    duration: record?.duration ?? '',
    bannerImage: record?.bannerImage ?? '',
    cardImage: record?.cardImage ?? '',
    region: record?.region ?? '',
    origin: record?.origin ?? '',
    destination: record?.destination ?? '',
    tripType: record?.tripType ?? 'Solo ida',
    sharedPrice: record?.sharedPrice?.toString() ?? '',
  });

  const [hasShared, setHasShared] = useState(record?.hasSharedService ?? true);
  const [isActive, setIsActive] = useState(record?.isActive ?? false);

  // Service Type selection ('shared', 'private', 'both')
  const [serviceTypeSelection, setServiceTypeSelection] = useState<string>(
    hasShared ? 'shared' : 'private'
  );

  // Editor mode: complete vs guided
  // Desktop default: complete
  // Mobile default: guided
  const [mode, setMode] = useState<EditorMode>('complete');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('catalog-editor-mode') as EditorMode | null;
      if (savedMode === 'complete' || savedMode === 'guided') {
        setMode(savedMode);
      } else if (window.innerWidth < 768) {
        setMode('guided');
      } else {
        setMode('complete');
      }
    } catch {
      // Fallback
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMode('guided');
      }
    }
  }, []);

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode);
    try {
      localStorage.setItem('catalog-editor-mode', newMode);
    } catch {
      // Ignore storage errors
    }
  };

  const steps = kind === 'tours' ? tourSteps : transferSteps;

  const handleServiceTypeChange = (val: string) => {
    setServiceTypeSelection(val);
    if (val === 'shared' || val === 'both') {
      setHasShared(true);
    } else {
      setHasShared(false);
    }
  };

  const serviceTypeOptions: RadioCardOption[] = [
    {
      value: 'shared',
      title: 'Servicio Compartido',
      description: 'Salidas grupales regulares con tarifa por persona.',
      badge: 'Grupal',
    },
    {
      value: 'private',
      title: 'Servicio Privado',
      description: 'Atención exclusiva para el cliente o grupo dedicado.',
      badge: 'Exclusivo',
    },
    {
      value: 'both',
      title: 'Ambas Modalidades',
      description: 'Permite ofrecer cupos compartidos y cotizaciones privadas.',
      badge: 'Recomendado',
    },
  ];

  const inputClass =
    'w-full mt-1.5 h-10 px-3 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#111111] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-[#111111] transition-all';
  const labelClass = 'block text-xs font-medium text-[#374151] tracking-tight';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top action header: Back link, Title, Mode switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e5e7eb] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace?view=${kind}`}
            className="p-1.5 text-[#6b7280] hover:text-[#111111] rounded-lg hover:bg-[#f3f4f6] transition-colors"
            title="Volver al catálogo"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
              {kind === 'tours' ? 'Gestión de Tour' : 'Gestión de Traslado'}
            </span>
            <h1 className="text-xl sm:text-[22px] font-semibold tracking-tight text-[#111111]">
              {record ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <EditorModeSwitch mode={mode} onChange={handleModeChange} />
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

      {/* Guided Progress Stepper (Visible in Guided Mode) */}
      {mode === 'guided' && (
        <GuidedProgress
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepClick={(idx) => setCurrentStepIndex(idx)}
        />
      )}

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={record?.id ?? ''} />
        <input type="hidden" name="updatedAt" value={record?.updatedAt ?? ''} />

        {/* ========================================================================= */}
        {/* SECTION 1: INFORMACIÓN BÁSICA (Shown in Complete Mode or Guided Step 0) */}
        {/* ========================================================================= */}
        {(mode === 'complete' || (mode === 'guided' && currentStepIndex === 0)) && (
          <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
            <div className="pb-1">
              <h2 className="text-base font-semibold text-[#111111]">
                1. Información General
              </h2>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Datos principales con los que tus clientes identificarán el servicio.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Nombre comercial del servicio
                <input
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Ej. Machu Picchu Full Day Mágico"
                  value={fields.title}
                  onChange={(e) => setFields({ ...fields, title: e.target.value })}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Enlace web (slug)
                <input
                  name="slug"
                  required
                  maxLength={160}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  autoCapitalize="none"
                  placeholder="ej. tour-machu-picchu-full-day"
                  value={fields.slug}
                  onChange={(e) => setFields({ ...fields, slug: e.target.value })}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Duración aproximada
                <input
                  name="duration"
                  required
                  maxLength={100}
                  placeholder="Ej. 1 día completo / 8 horas"
                  value={fields.duration}
                  onChange={(e) => setFields({ ...fields, duration: e.target.value })}
                  className={inputClass}
                />
              </label>

              {kind === 'tours' && (
                <label className={labelClass}>
                  Región o destino
                  <input
                    name="region"
                    maxLength={100}
                    placeholder="Ej. Cusco, Perú"
                    value={fields.region}
                    onChange={(e) => setFields({ ...fields, region: e.target.value })}
                    className={inputClass}
                  />
                </label>
              )}
            </div>

            <label className={labelClass}>
              Descripción comercial
              <textarea
                name="description"
                required={kind === 'tours'}
                maxLength={20000}
                rows={4}
                placeholder="Describe los aspectos más destacados de la experiencia..."
                value={fields.description}
                onChange={(e) => setFields({ ...fields, description: e.target.value })}
                className={inputClass}
              />
            </label>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2 (TOUR): TIPO DE SERVICIO (Complete or Guided Step 1)           */}
        {/* SECTION 2 (TRANSFER): RUTA Y DETALLES (Complete or Guided Step 1)        */}
        {/* ========================================================================= */}
        {kind === 'tours' &&
          (mode === 'complete' || (mode === 'guided' && currentStepIndex === 1)) && (
            <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
              <div className="pb-1">
                <h2 className="text-base font-semibold text-[#111111]">
                  2. Tipo de Servicio
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Elige cómo operará este tour en tu agencia.
                </p>
              </div>

              <RadioCardGroup
                name="serviceType"
                options={serviceTypeOptions}
                value={serviceTypeSelection}
                onChange={handleServiceTypeChange}
                columns={3}
              />
            </section>
          )}

        {kind === 'transfers' &&
          (mode === 'complete' || (mode === 'guided' && currentStepIndex === 1)) && (
            <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
              <div className="pb-1">
                <h2 className="text-base font-semibold text-[#111111]">
                  2. Ruta del Traslado
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Configura el origen, destino y modalidad del trayecto.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Lugar de origen
                  <input
                    name="origin"
                    required
                    maxLength={150}
                    placeholder="Ej. Aeropuerto de Cusco (CUZ)"
                    value={fields.origin}
                    onChange={(e) => setFields({ ...fields, origin: e.target.value })}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Lugar de destino
                  <input
                    name="destination"
                    required
                    maxLength={150}
                    placeholder="Ej. Hoteles en el Valle Sagrado"
                    value={fields.destination}
                    onChange={(e) => setFields({ ...fields, destination: e.target.value })}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Tipo de viaje
                  <select
                    name="tripType"
                    value={fields.tripType}
                    onChange={(e) => setFields({ ...fields, tripType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="Solo ida">Solo ida</option>
                    <option value="Ida y vuelta">Ida y vuelta</option>
                  </select>
                </label>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#111111] cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#111111] focus:ring-[#111111] border-[#e5e7eb]"
                    />
                    <span>Traslado activo para reservas operativas</span>
                  </label>
                </div>
              </div>
            </section>
          )}

        {/* ========================================================================= */}
        {/* SECTION 3: MODALIDADES Y CAPACIDAD (Complete or Guided Step 2)            */}
        {/* ========================================================================= */}
        {(mode === 'complete' || (mode === 'guided' && currentStepIndex === 2)) && (
          <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
            <div className="pb-1">
              <h2 className="text-base font-semibold text-[#111111]">
                3. Modalidad y Disponibilidad
              </h2>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Activa las opciones comerciales que estarán a disposición del cliente.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-lg border border-[#e5e7eb] hover:bg-[#f8f9fa] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="hasSharedService"
                  checked={hasShared}
                  onChange={(e) => setHasShared(e.target.checked)}
                  className="w-4 h-4 rounded text-[#111111] focus:ring-[#111111] border-[#e5e7eb]"
                />
                <div>
                  <span className="text-sm font-semibold text-[#111111] block">
                    Habilitar modalidad compartida (Grupal)
                  </span>
                  <span className="text-xs text-[#6b7280]">
                    Permite vender asientos individuales a diferentes pasajeros.
                  </span>
                </div>
              </label>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: TARIFAS Y PRECIOS (Complete or Guided Step 3)                 */}
        {/* ========================================================================= */}
        {(mode === 'complete' || (mode === 'guided' && currentStepIndex === 3)) && (
          <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
            <div className="pb-1">
              <h2 className="text-base font-semibold text-[#111111]">
                4. Tarifas de Referencia
              </h2>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Establece el precio base por persona o vehículo para cotizaciones inmediatas.
              </p>
            </div>

            {hasShared ? (
              <label className={`max-w-xs ${labelClass}`}>
                Precio por persona (USD)
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#898989] font-medium text-sm">
                    $
                  </span>
                  <input
                    name="sharedPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    required={hasShared}
                    placeholder="0.00"
                    value={fields.sharedPrice}
                    onChange={(e) => setFields({ ...fields, sharedPrice: e.target.value })}
                    className="w-full h-10 pl-8 pr-3 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#111111] font-medium focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </label>
            ) : (
              <p className="text-xs text-[#6b7280] bg-[#f8f9fa] p-3.5 rounded-lg border border-[#e5e7eb]">
                La modalidad compartida está desactivada. Las tarifas privadas se configuran en el editor de contenido y vehículos.
              </p>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5 (TOUR ONLY): CONTENIDO Y DETALLES (Complete or Guided Step 4)    */}
        {/* ========================================================================= */}
        {kind === 'tours' &&
          (mode === 'complete' || (mode === 'guided' && currentStepIndex === 4)) && (
            <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
              <div className="pb-1 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#111111]">
                    5. Itinerario y Contenido Detallado
                  </h2>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    Itinerarios por etapas, inclusiones, exclusiones y preguntas frecuentes.
                  </p>
                </div>
                {record?.id && (
                  <Link
                    href={`/workspace/content?kind=${kind}&id=${record.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111111] bg-white border border-[#e5e7eb] hover:bg-[#f8f9fa] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#6b7280]" />
                    <span>Editor de itinerario enriquecido</span>
                  </Link>
                )}
              </div>

              <div className="bg-[#f8f9fa] p-4 rounded-lg border border-[#e5e7eb] text-xs text-[#374151] leading-relaxed space-y-1">
                <p className="font-semibold text-[#111111]">
                  Gestión modular de contenidos:
                </p>
                <p className="text-[#6b7280]">
                  Los bloques avanzados (etapas del itinerario hora por hora, qué incluye, qué no incluye y preguntas frecuentes) se vinculan directamente con la versión publicada del tour una vez guardada la ficha base.
                </p>
              </div>
            </section>
          )}

        {/* ========================================================================= */}
        {/* SECTION 6 (TOUR) / SECTION 5 (TRANSFER): MULTIMEDIA (Media Step)          */}
        {/* ========================================================================= */}
        {(mode === 'complete' ||
          (mode === 'guided' &&
            ((kind === 'tours' && currentStepIndex === 5) ||
              (kind === 'transfers' && currentStepIndex === 4)))) && (
          <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
            <div className="pb-1">
              <h2 className="text-base font-semibold text-[#111111]">
                {kind === 'tours' ? '6. Multimedia' : '5. Multimedia'}
              </h2>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Imágenes oficiales optimizadas para catálogo y ficha de producto.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MediaUploader
                name="bannerImage"
                label="Imagen principal (Banner horizontal)"
                kind={kind === 'tours' ? 'TOUR_BANNER' : 'TRANSFER'}
                value={fields.bannerImage ?? ''}
                onChange={(val) => setFields((prev) => ({ ...prev, bannerImage: val }))}
                required={kind === 'tours'}
                placeholder="https://..."
                helpText="Recomendado 1920x1080px o formato panorámico."
              />

              {kind === 'tours' && (
                <MediaUploader
                  name="cardImage"
                  label="Imagen de tarjeta (Vista previa catálogo)"
                  kind="TOUR_CARD"
                  value={fields.cardImage ?? ''}
                  onChange={(val) => setFields((prev) => ({ ...prev, cardImage: val }))}
                  required={true}
                  placeholder="https://..."
                  helpText="Formato 4:3 o cuadrado para listados."
                />
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7 (TOUR ONLY): SEO PREVIEW (Step 6)                              */}
        {/* ========================================================================= */}
        {kind === 'tours' &&
          (mode === 'complete' || (mode === 'guided' && currentStepIndex === 6)) && (
            <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
              <div className="pb-1">
                <h2 className="text-base font-semibold text-[#111111]">
                  7. Optimización y Búsqueda (SEO)
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Vista previa de cómo aparecerá tu tour en los resultados de búsqueda.
                </p>
              </div>

              {/* Google Search Snippet Preview */}
              <div className="bg-[#f8f9fa] p-4 rounded-lg border border-[#e5e7eb] space-y-1 font-sans">
                <span className="text-[11px] text-[#6b7280] font-mono block">
                  https://tu-agencia.com/{fields.slug || 'tour-slug'}
                </span>
                <h3 className="text-sm font-semibold text-[#111111] truncate hover:underline cursor-pointer">
                  {fields.title || 'Título del tour en el catálogo'} · Tu Agencia
                </h3>
                <p className="text-xs text-[#6b7280] line-clamp-2">
                  {fields.description ||
                    'La descripción del tour se mostrará aquí para atraer visitantes desde motores de búsqueda y redes sociales.'}
                </p>
              </div>
            </section>
          )}

        {/* ========================================================================= */}
        {/* SECTION 8 (TOUR ONLY): PUBLICACIÓN (Step 7)                              */}
        {/* ========================================================================= */}
        {kind === 'tours' &&
          (mode === 'complete' || (mode === 'guided' && currentStepIndex === 7)) && (
            <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
              <div className="pb-1">
                <h2 className="text-base font-semibold text-[#111111]">
                  8. Estado de Publicación
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Controla la visibilidad pública de este tour en la vitrina comercial.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-[#111111] block">
                    {record?.isPublished ? 'Servicio Publicado' : 'Borrador Privado'}
                  </span>
                  <span className="text-xs text-[#6b7280]">
                    {record?.isPublished
                      ? 'Visible para clientes en el catálogo público de la agencia.'
                      : 'Oculto al público. Solo visible para operadores de tu agencia.'}
                  </span>
                </div>
                {record?.id && (
                  <Link
                    href={`/workspace/content?kind=${kind}&id=${record.id}`}
                    className="text-xs font-medium underline text-[#111111]"
                  >
                    Gestionar publicación
                  </Link>
                )}
              </div>
            </section>
          )}

        {/* ========================================================================= */}
        {/* FINAL STEP: REVISIÓN GENERAL (Step 8 for Tour / Step 5 for Transfer)       */}
        {/* ========================================================================= */}
        {mode === 'guided' &&
          currentStepIndex === steps.length - 1 && (
            <section className="space-y-4 pb-6 border-b border-[#e5e7eb]">
              <div className="pb-1">
                <h2 className="text-base font-semibold text-[#111111]">
                  Revisión Final del Servicio
                </h2>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Verifica que la información configurada esté completa antes de guardar.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block font-medium">Nombre:</span>
                  <strong className="text-[#111111] text-sm">{fields.title || '-'}</strong>
                </div>
                <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block font-medium">Enlace:</span>
                  <strong className="text-[#111111] font-mono">/{fields.slug || '-'}</strong>
                </div>
                <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block font-medium">Modalidad:</span>
                  <strong className="text-[#111111]">
                    {hasShared ? 'Compartida disponible' : 'Solo privada'}
                  </strong>
                </div>
                <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#e5e7eb]">
                  <span className="text-[#6b7280] block font-medium">Tarifa de referencia:</span>
                  <strong className="text-[#111111]">
                    {hasShared && fields.sharedPrice ? `$${fields.sharedPrice} USD` : 'Por cotizar'}
                  </strong>
                </div>
              </div>
            </section>
          )}

        {/* ========================================================================= */}
        {/* GUIDED STEP CONTROLS (Next / Prev buttons)                                */}
        {/* ========================================================================= */}
        {mode === 'guided' && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#e5e7eb]">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 h-8 px-3 border border-[#e5e7eb] rounded-md text-xs font-medium text-[#111111] bg-white hover:bg-[#f8f9fa] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Paso anterior</span>
            </button>

            {currentStepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))
                }
                className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none cursor-pointer transition-colors"
              >
                <span>Siguiente paso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isPending ? 'Guardando…' : 'Finalizar y Guardar'}</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPLETE MODE: STICKY SAVE BAR                                            */}
        {/* ========================================================================= */}
        {mode === 'complete' && (
          <StickySaveBar
            isPending={isPending}
            saveLabel="Guardar cambios del servicio"
            cancelLabel="Descartar y volver"
            onCancel={() => {
              window.location.href = `/workspace?view=${kind}`;
            }}
            error={state?.error}
          />
        )}
      </form>
    </div>
  );
}
