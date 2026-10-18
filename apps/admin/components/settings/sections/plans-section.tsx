'use client';

import React, { useState } from 'react';
import { Check, Info } from 'lucide-react';

export function PlansSection() {
  const [selectedPlanNotice, setSelectedPlanNotice] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Notice: SaaS Plans preview status */}
      <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/70 flex items-start gap-2.5 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Vista preliminar de planes SaaS: </span>
          <span>
            Comparativa de niveles de servicio de referencia. El flujo de contratación automatizada con facturación recurrente se habilitará en el lanzamiento comercial oficial.
          </span>
        </div>
      </div>

      {selectedPlanNotice && (
        <div className="p-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] text-xs text-[#374151]">
          {selectedPlanNotice}
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto space-y-1">
        <h3 className="text-lg font-bold text-[#111111]">
          Niveles de Servicio Diseñados para tu Crecimiento
        </h3>
        <p className="text-xs text-[#6b7280]">
          Comparativa referencial de capacidades para agencias de viajes independientes y operadores consolidados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        {/* Starter */}
        <div className="product-card-surface p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-[#111111]">Starter</h4>
              <p className="text-xs text-[#6b7280] mt-1">Para operadores y guías independientes.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#111111]">$29</span>
              <span className="text-xs text-[#6b7280]">USD / mes</span>
            </div>
            <ul className="space-y-2 text-xs text-[#374151] pt-2 border-t border-[#e5e7eb]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hasta 15 tours publicados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>1 cuenta de operador</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>1 idioma de catálogo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pasarela de pagos Izipay</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPlanNotice('La contratación directa del Plan Starter estará disponible próximamente.')}
            className="product-button-secondary w-full"
          >
            Ver detalles Starter
          </button>
        </div>

        {/* Pro */}
        <div className="product-card-surface p-6 border-2 border-[#111111] relative flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-[#111111]">Pro Crecimiento</h4>
              <p className="text-xs text-[#6b7280] mt-1">Para agencias de turismo en expansión.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#111111]">$59</span>
              <span className="text-xs text-[#6b7280]">USD / mes</span>
            </div>
            <ul className="space-y-2 text-xs text-[#374151] pt-2 border-t border-[#e5e7eb]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-[#111111]">Tours ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Reportes comerciales avanzados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hasta 5 operadores de equipo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Múltiples idiomas de catálogo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Diagnóstico SEO contextual</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPlanNotice('La contratación directa del Plan Pro estará disponible en el lanzamiento comercial.')}
            className="product-button-secondary w-full"
          >
            Ver detalles Pro
          </button>
        </div>

        {/* Enterprise */}
        <div className="product-card-surface p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-[#111111]">Enterprise</h4>
              <p className="text-xs text-[#6b7280] mt-1">Para grandes agencias y mayoristas.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#111111]">$149</span>
              <span className="text-xs text-[#6b7280]">USD / mes</span>
            </div>
            <ul className="space-y-2 text-xs text-[#374151] pt-2 border-t border-[#e5e7eb]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-[#111111]">Todo lo del Plan Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dominio personalizado con SSL</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Operadores de equipo ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Acceso a API y webhooks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>SLA 99.9% y Onboarding dedicado</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPlanNotice('Para opciones Enterprise personalizadas, contacta a ventas.')}
            className="product-button-primary w-full"
          >
            Consultar Enterprise
          </button>
        </div>
      </div>
    </div>
  );
}
