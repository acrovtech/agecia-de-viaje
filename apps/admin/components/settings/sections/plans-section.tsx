'use client';

import React from 'react';
import { Check, Info } from 'lucide-react';

export function PlansSection() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Notice: SaaS Plans preview status */}
      <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/70 flex items-start gap-2.5 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Planes de la Plataforma SaaS: </span>
          <span>
            Comparativa de niveles de servicio. Tu agencia se encuentra actualmente en el <strong>Plan Pro Crecimiento</strong>. El flujo de actualización automática de planes con facturación recurrente se habilitará en el lanzamiento comercial.
          </span>
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-1">
        <h3 className="text-lg font-bold text-[#111111]">
          Planes Diseñados para Escalar tu Agencia de Viajes
        </h3>
        <p className="text-xs text-[#6b7280]">
          Elige el nivel de capacidad operativa y canales de venta que mejor se adapte a tu crecimiento.
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
                <span>Pasarela de pagos Izipay</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Soporte por ticket</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => alert('Seleccionar plan Starter')}
            className="product-button-secondary w-full"
          >
            Cambiar a Starter
          </button>
        </div>

        {/* Pro (Active) */}
        <div className="product-card-surface p-6 border-2 border-[#111111] relative flex flex-col justify-between space-y-5 bg-[#f8f9fa]/30">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#111111] text-white">
            PLAN ACTUAL
          </span>
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
                <span className="font-medium text-[#111111]">Tours y traslados ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Despacho y asignación de flota</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hasta 5 operadores de equipo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Página social móvil</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Soporte prioritario</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            disabled
            className="w-full h-8 rounded-lg bg-[#e5e7eb] text-[#374151] text-xs font-semibold cursor-default"
          >
            Plan Activo
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
                <span>Acceso a API y webhooks en vivo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>SLA 99.9% y Onboarding dedicado</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => alert('Mejorar a Enterprise: te conectaremos con un asesor comercial.')}
            className="product-button-primary w-full"
          >
            Mejorar a Enterprise
          </button>
        </div>
      </div>
    </div>
  );
}
