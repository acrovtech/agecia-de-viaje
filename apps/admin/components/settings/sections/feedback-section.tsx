'use client';

import React, { useActionState, useState } from 'react';
import { HelpCircle, Bug, Lightbulb, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitFeedbackAction, type FeedbackActionState } from '@/lib/feedback-actions';

export function FeedbackSection() {
  const [state, formAction, isPending] = useActionState<FeedbackActionState | null, FormData>(
    submitFeedbackAction,
    null,
  );
  const [selectedType, setSelectedType] = useState<'BUG' | 'IMPROVEMENT' | 'FEATURE'>('IMPROVEMENT');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#6b7280]" />
          <span>Ayuda y Comentarios</span>
        </h2>
        <p className="text-xs text-[#6b7280] mt-1">
          Comparte tu experiencia, reporta problemas o sugiere nuevas capacidades para la plataforma.
        </p>
      </div>

      {state?.success && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{state.message}</span>
            <p className="text-emerald-700 mt-0.5">
              Tus sugerencias son analizadas para priorizar el desarrollo continuo.
            </p>
          </div>
        </div>
      )}

      {state?.error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{state.error}</span>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="type" value={selectedType} />

        {/* Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-2">
            Tipo de participación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedType('BUG')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedType === 'BUG'
                  ? 'border-[#111111] bg-white shadow-product-card'
                  : 'border-[#e5e7eb] bg-[#f8f9fa] hover:bg-white text-[#6b7280]'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-[#111111]">
                <Bug className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Reportar un error</span>
              </div>
              <p className="text-[11px] text-[#6b7280] mt-1">
                Comportamiento inesperado o fallas en el sistema.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('IMPROVEMENT')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedType === 'IMPROVEMENT'
                  ? 'border-[#111111] bg-white shadow-product-card'
                  : 'border-[#e5e7eb] bg-[#f8f9fa] hover:bg-white text-[#6b7280]'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-[#111111]">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Sugerir una mejora</span>
              </div>
              <p className="text-[11px] text-[#6b7280] mt-1">
                Optimizar un flujo, pantalla o herramienta existente.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('FEATURE')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedType === 'FEATURE'
                  ? 'border-[#111111] bg-white shadow-product-card'
                  : 'border-[#e5e7eb] bg-[#f8f9fa] hover:bg-white text-[#6b7280]'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-[#111111]">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Solicitar una función</span>
              </div>
              <p className="text-[11px] text-[#6b7280] mt-1">
                Nuevas integraciones o capacidades para tu negocio.
              </p>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="feedback-title" className="block text-xs font-medium text-[#374151]">
            Título o resumen corto
          </label>
          <input
            id="feedback-title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={120}
            placeholder={
              selectedType === 'BUG'
                ? 'Ej. Error al guardar tarifa privada en asistido'
                : selectedType === 'IMPROVEMENT'
                  ? 'Ej. Facilitar la exportación del calendario'
                  : 'Ej. Integración con facturación electrónica SUNAT'
            }
            className="h-[36px] mt-1 block w-full rounded-lg border border-[#e5e7eb] px-3 text-xs sm:text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="feedback-desc" className="block text-xs font-medium text-[#374151]">
            Descripción detallada
          </label>
          <textarea
            id="feedback-desc"
            name="description"
            required
            rows={5}
            minLength={5}
            maxLength={2000}
            placeholder="Describe los pasos para reproducir o explica por qué esta sugerencia sería valiosa para la operativa de tu agencia..."
            className="mt-1 block w-full rounded-lg border border-[#e5e7eb] p-3 text-xs sm:text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
          />
        </div>

        {/* Policy Notice */}
        <div className="p-3.5 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] text-xs text-[#6b7280] space-y-1">
          <p className="font-semibold text-[#111111]">Política de participación y créditos:</p>
          <p>
            Los comentarios enviados se agrupan por temas para priorizar el roadmap según el impacto en múltiples agencias. Las sugerencias y reportes validados por el equipo de producto pueden recibir bonificaciones de 5 a 20 créditos IA tras su revisión.
          </p>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isPending}
            className="product-button-primary disabled:opacity-50"
          >
            {isPending ? 'Enviando comentario...' : 'Enviar comentario'}
          </button>
        </div>
      </form>
    </div>
  );
}
