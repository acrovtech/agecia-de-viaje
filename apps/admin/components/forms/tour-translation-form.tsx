'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2, Copy, Sparkles } from 'lucide-react';
import { saveTourTranslationAction } from '../../app/workspace/catalog-actions';
import { AutoResizeTextarea, SubmitSaveButton } from './shared/form-utils';
import { analyzeSeo } from './shared/seo-analysis';
import type { TourTranslationItem } from '../../lib/catalog-content';

interface TourTranslationFormProps {
  tourId: string;
  locale: string;
  localeMeta: { label: string; flag: string };
  defaultLocale: string;
  sourceTour: any;
  translation?: TourTranslationItem | null;
  currentSourceRevision?: string;
}

export function TourTranslationForm({
  tourId,
  locale,
  localeMeta,
  defaultLocale,
  sourceTour,
  translation,
  currentSourceRevision,
}: TourTranslationFormProps) {
  const [state, formAction] = useActionState(saveTourTranslationAction, null);

  const [hasDraftStarted, setHasDraftStarted] = useState<boolean>(Boolean(translation));
  const [showSource, setShowSource] = useState(false);

  // Form Fields
  const [title, setTitle] = useState(translation?.title || '');
  const [slug, setSlug] = useState(translation?.slug || sourceTour?.slug || '');
  const [description, setDescription] = useState(translation?.description || '');
  const [focusKeyphrase, setFocusKeyphrase] = useState(translation?.focusKeyphrase || '');
  const [metaTitle, setMetaTitle] = useState(translation?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(translation?.metaDescription || '');

  // Itinerary
  const initialItinerary = (translation?.itinerary && translation.itinerary.length > 0)
    ? translation.itinerary.map((it, idx) => ({ id: idx + 1, title: it.title, content: it.content }))
    : [{ id: 1, title: '', content: '' }];
  const [itinerary, setItinerary] = useState(initialItinerary);

  // Inclusions, Exclusions, Recommendations
  const [inclusions, setInclusions] = useState(
    (translation?.inclusions || []).map((i) => i.content).join('\n')
  );
  const [exclusions, setExclusions] = useState(
    (translation?.exclusions || []).map((e) => e.content).join('\n')
  );
  const [recommendations, setRecommendations] = useState(
    (translation?.recommendations || []).map((r) => r.content).join('\n')
  );

  // FAQs
  const initialFaqs = (translation?.faqs && translation.faqs.length > 0)
    ? translation.faqs.map((f, idx) => ({ id: idx + 1, question: f.question, answer: f.answer }))
    : [{ id: 1, question: '', answer: '' }];
  const [faqs, setFaqs] = useState(initialFaqs);

  const isStale = Boolean(
    translation &&
    (!translation.sourceRevision || translation.sourceRevision !== currentSourceRevision)
  );

  // Deterministic SEO Diagnostics for this localized language
  const seoAnalysis = analyzeSeo({
    title,
    metaTitle,
    metaDescription,
    slug,
    focusKeyphrase,
    description,
    itinerariesCount: itinerary.filter((i) => i.title.trim() && i.content.trim()).length,
    faqsCount: faqs.filter((f) => f.question.trim() && f.answer.trim()).length,
  });

  const handleCopySourceAsDraft = () => {
    if (!title && sourceTour?.title) setTitle(sourceTour.title);
    if (!description && sourceTour?.description) setDescription(sourceTour.description);
    if (!metaTitle && sourceTour?.metaTitle) setMetaTitle(sourceTour.metaTitle);
    if (!metaDescription && sourceTour?.metaDescription) setMetaDescription(sourceTour.metaDescription);
    if (!focusKeyphrase && sourceTour?.focusKeyphrase) setFocusKeyphrase(sourceTour.focusKeyphrase);

    if ((!inclusions || inclusions.trim() === '') && sourceTour?.inclusions) {
      setInclusions(sourceTour.inclusions.map((i: any) => i.content).join('\n'));
    }
    if ((!exclusions || exclusions.trim() === '') && sourceTour?.exclusions) {
      setExclusions(sourceTour.exclusions.map((e: any) => e.content).join('\n'));
    }
    if ((!recommendations || recommendations.trim() === '') && sourceTour?.recommendations) {
      setRecommendations(sourceTour.recommendations.map((r: any) => r.content).join('\n'));
    }
    if (itinerary.length === 1 && !itinerary[0]?.title && sourceTour?.itineraries?.length > 0) {
      setItinerary(sourceTour.itineraries.map((it: any, idx: number) => ({
        id: idx + 1,
        title: it.title,
        content: it.content,
      })));
    }
    if (faqs.length === 1 && !faqs[0]?.question && sourceTour?.faqs?.length > 0) {
      setFaqs(sourceTour.faqs.map((f: any, idx: number) => ({
        id: idx + 1,
        question: f.question,
        answer: f.answer,
      })));
    }
  };

  if (!hasDraftStarted && !translation) {
    return (
      <div className="product-card-surface p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#111111]">
            No existe una versión en {localeMeta.label} para este tour
          </h2>
          <p className="text-xs text-[#6b7280] max-w-md mx-auto mt-1">
            Crea una traducción manual para comercializar este producto en {localeMeta.label}. Las tarifas, disponibilidad y fotos se mantendrán sincronizadas con el tour principal.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setHasDraftStarted(true)}
            className="product-button-primary inline-flex items-center gap-1.5 text-xs px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear versión en {localeMeta.label}</span>
          </button>
        </div>
      </div>
    );
  }

  const labelClass = 'block text-xs font-semibold text-slate-700';
  const inputClass =
    'w-full h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors placeholder:text-slate-400';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header / Language status */}
      <div className="product-card-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{localeMeta.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                {locale.toUpperCase()}
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Traducción: {localeMeta.label}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-900 border border-amber-200">
                {isStale ? 'Desactualizada' : (translation ? 'Borrador' : 'Nueva traducción')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tour base: <span className="font-medium text-slate-700">{sourceTour?.title || 'Tour'}</span> ({defaultLocale.toUpperCase()})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSource((prev) => !prev)}
            className="product-button-secondary text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
          >
            <span>{showSource ? 'Ocultar original' : 'Ver contenido original'}</span>
            {showSource ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleCopySourceAsDraft}
            className="product-button-secondary text-xs inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700"
            title="Rellena campos vacíos con el texto fuente original"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copiar fuente en vacíos</span>
          </button>
        </div>
      </div>

      {/* Stale translation notice */}
      {isStale && (
        <div role="alert" className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">El contenido principal cambió desde la última actualización de esta traducción.</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Revisa los textos para sincronizar los cambios realizados en el contenido oficial en {defaultLocale.toUpperCase()}.
            </p>
          </div>
        </div>
      )}

      {/* Error alert from server */}
      {state?.error && (
        <div role="alert" className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Read-only Source Reference Panel */}
      {showSource && (
        <div className="product-card-surface p-5 border-blue-200 bg-blue-50/40 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Referencia del Contenido Original ({defaultLocale.toUpperCase()})
            </span>
            <span className="text-[11px] text-blue-700">Solo lectura</span>
          </div>

          <div className="grid gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-700 block">Título original:</span>
              <p className="text-slate-900 bg-white p-2.5 rounded border border-blue-100">{sourceTour?.title}</p>
            </div>
            {sourceTour?.description && (
              <div>
                <span className="font-semibold text-slate-700 block">Descripción original:</span>
                <p className="text-slate-900 bg-white p-2.5 rounded border border-blue-100 whitespace-pre-wrap">{sourceTour.description}</p>
              </div>
            )}
            {sourceTour?.itineraries && sourceTour.itineraries.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Itinerario original:</span>
                <div className="space-y-1.5 bg-white p-2.5 rounded border border-blue-100">
                  {sourceTour.itineraries.map((it: any, i: number) => (
                    <div key={i} className="pb-1.5 border-b border-slate-100 last:border-b-0">
                      <span className="font-semibold text-slate-800">Día {i + 1}: {it.title}</span>
                      <p className="text-slate-600 mt-0.5">{it.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sourceTour?.inclusions && sourceTour.inclusions.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Incluye original:</span>
                <ul className="list-disc pl-5 bg-white p-2.5 rounded border border-blue-100 text-slate-700">
                  {sourceTour.inclusions.map((inc: any, i: number) => (
                    <li key={i}>{inc.content}</li>
                  ))}
                </ul>
              </div>
            )}
            {sourceTour?.exclusions && sourceTour.exclusions.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">No incluye original:</span>
                <ul className="list-disc pl-5 bg-white p-2.5 rounded border border-blue-100 text-slate-700">
                  {sourceTour.exclusions.map((exc: any, i: number) => (
                    <li key={i}>{exc.content}</li>
                  ))}
                </ul>
              </div>
            )}
            {sourceTour?.recommendations && sourceTour.recommendations.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Recomendaciones originales:</span>
                <ul className="list-disc pl-5 bg-white p-2.5 rounded border border-blue-100 text-slate-700">
                  {sourceTour.recommendations.map((rec: any, i: number) => (
                    <li key={i}>{rec.content}</li>
                  ))}
                </ul>
              </div>
            )}
            {sourceTour?.faqs && sourceTour.faqs.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Preguntas frecuentes originales:</span>
                <div className="space-y-1.5 bg-white p-2.5 rounded border border-blue-100">
                  {sourceTour.faqs.map((f: any, i: number) => (
                    <div key={i} className="pb-1.5 border-b border-slate-100 last:border-b-0">
                      <span className="font-semibold text-slate-800">{f.question}</span>
                      <p className="text-slate-600 mt-0.5">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Translation Form */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="tourId" value={tourId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="expectedUpdatedAt" value={translation?.updatedAt || ''} />
        <input type="hidden" name="expectedSourceRevision" value={currentSourceRevision || ''} />
        <input type="hidden" name="itineraryCount" value={itinerary.length} />
        <input type="hidden" name="faqsCount" value={faqs.length} />

        {/* 1. Título y Enlace amigable (Slug) */}
        <section className="product-card-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            1. Título y Enlace Amigable ({localeMeta.label})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Título traducido *</label>
              <input
                type="text"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Ej. Machu Picchu Full Day Tour (${locale.toUpperCase()})`}
                className={`${inputClass} mt-1`}
              />
            </div>

            <div>
              <label className={labelClass}>Enlace amigable traducido (slug) *</label>
              <input
                type="text"
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="machu-picchu-full-day"
                className={`${inputClass} mt-1 font-mono`}
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Solo minúsculas, números y guiones. Visible para clientes internacionales.
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Descripción general traducida</label>
            <AutoResizeTextarea
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe la experiencia en ${localeMeta.label}...`}
              className="mt-1"
            />
          </div>
        </section>

        {/* 2. Itinerario detallado */}
        <section className="product-card-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900">
              2. Itinerario traducido ({localeMeta.label})
            </h3>
            <button
              type="button"
              onClick={() => setItinerary((prev) => [...prev, { id: Date.now(), title: '', content: '' }])}
              className="product-button-secondary text-xs inline-flex items-center gap-1 px-2.5 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir día</span>
            </button>
          </div>

          <div className="space-y-3">
            {itinerary.map((item, idx) => (
              <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Día {idx + 1}</span>
                  {itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItinerary((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Eliminar día"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  name={`itinerary_title_${idx}`}
                  value={item.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItinerary((prev) => prev.map((it, i) => i === idx ? { ...it, title: val } : it));
                  }}
                  placeholder={`Título del día ${idx + 1} en ${localeMeta.label}`}
                  className={inputClass}
                />

                <AutoResizeTextarea
                  name={`itinerary_content_${idx}`}
                  rows={2}
                  value={item.content}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItinerary((prev) => prev.map((it, i) => i === idx ? { ...it, content: val } : it));
                  }}
                  placeholder={`Descripción de actividades en ${localeMeta.label}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 3. Inclusiones, Exclusiones y Recomendaciones */}
        <section className="product-card-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            3. Qué incluye, exclusiones y recomendaciones ({localeMeta.label})
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Qué incluye (1 ítem por línea)</label>
              <textarea
                name="inclusions"
                rows={6}
                value={inclusions}
                onChange={(e) => setInclusions(e.target.value)}
                placeholder="Guía bilingüe&#10;Transporte turístico&#10;Entradas oficiales"
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
              />
            </div>

            <div>
              <label className={labelClass}>No incluye (1 ítem por línea)</label>
              <textarea
                name="exclusions"
                rows={6}
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                placeholder="Almuerzo buffet&#10;Propinas voluntarias"
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
              />
            </div>

            <div>
              <label className={labelClass}>Recomendaciones (1 por línea)</label>
              <textarea
                name="recommendations"
                rows={6}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Ropa cómoda de abrigo&#10;Pasaporte original vigente"
                className="w-full mt-1 p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* 4. Preguntas Frecuentes (FAQs) */}
        <section className="product-card-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900">
              4. Preguntas Frecuentes ({localeMeta.label})
            </h3>
            <button
              type="button"
              onClick={() => setFaqs((prev) => [...prev, { id: Date.now(), question: '', answer: '' }])}
              className="product-button-secondary text-xs inline-flex items-center gap-1 px-2.5 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir FAQ</span>
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Pregunta {idx + 1}</span>
                  {faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Eliminar FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  name={`faq_question_${idx}`}
                  value={faq.question}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFaqs((prev) => prev.map((f, i) => i === idx ? { ...f, question: val } : f));
                  }}
                  placeholder={`Pregunta en ${localeMeta.label}`}
                  className={inputClass}
                />

                <AutoResizeTextarea
                  name={`faq_answer_${idx}`}
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFaqs((prev) => prev.map((f, i) => i === idx ? { ...f, answer: val } : f));
                  }}
                  placeholder={`Respuesta en ${localeMeta.label}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 5. SEO y Diagnóstico Determinista */}
        <section className="product-card-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                5. Posicionamiento SEO ({localeMeta.label})
              </h3>
              <p className="text-xs text-slate-500">
                Optimización de metadatos para motores de búsqueda en idioma {localeMeta.label}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${seoAnalysis.badgeClass}`}>
                {seoAnalysis.level} ({seoAnalysis.score}/100)
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Frase clave objetivo ({localeMeta.label})</label>
              <input
                type="text"
                name="focusKeyphrase"
                value={focusKeyphrase}
                onChange={(e) => setFocusKeyphrase(e.target.value)}
                placeholder="machu picchu day tour"
                className={`${inputClass} mt-1`}
              />
            </div>

            <div>
              <label className={labelClass}>Meta Título SEO</label>
              <input
                type="text"
                name="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Machu Picchu Full Day Tour | Official Agency"
                className={`${inputClass} mt-1`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Meta Descripción SEO</label>
              <AutoResizeTextarea
                name="metaDescription"
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Book your Machu Picchu day tour with expert local guides and all-inclusive transport."
                className="mt-1"
              />
            </div>
          </div>

          {/* SEO Checklist */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Diagnóstico SEO determinista
            </span>
            <div className="grid gap-1.5 sm:grid-cols-2 text-xs">
              {seoAnalysis.results.map((res, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${res.type === 'good' ? 'bg-emerald-500' : res.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  <span className={res.type === 'good' ? 'text-slate-700' : 'text-slate-600'}>{res.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Link
            href={`/catalog/tours?edit=${tourId}`}
            className="product-button-secondary text-xs inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al tour principal</span>
          </Link>

          <div className="flex items-center gap-3">
            <SubmitSaveButton
              label={translation ? 'Guardar cambios de traducción' : 'Crear traducción'}
              className="text-xs px-4 py-2"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
