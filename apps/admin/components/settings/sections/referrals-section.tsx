'use client';

import React, { useState } from 'react';
import { Gift, Copy, Check, TrendingUp, Info } from 'lucide-react';
import type { AgencyProfileData } from '../types';

export interface ReferralsSectionProps {
  initialProfile: AgencyProfileData;
}

export function ReferralsSection({ initialProfile }: ReferralsSectionProps) {
  const [copiedReferral, setCopiedReferral] = useState(false);
  const referralLink = `https://platform.travel/ref/${initialProfile.slug || 'agencia'}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const inputClass =
    'h-[34px] block w-full rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:bg-[#f8f9fa] disabled:text-[#898989] transition-all';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Notice: Preview Status */}
      <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Vista preliminar de afiliación y referidos: </span>
          <span>
            Las métricas y conversiones a continuación son datos de demostración / vista preliminar del módulo. El motor de liquidación automática y comisiones bancarias se activará en el lanzamiento del programa comercial.
          </span>
        </div>
      </div>

      <div className="product-card-surface p-6 bg-gradient-to-br from-[#111111] to-[#242424] text-white">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-400 text-black">
            <Gift className="w-3 h-3" /> PROGRAMA OFICIAL DE SOCIOS
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Gana hasta 20% de comisión recurrente por cada agencia referida
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Recomienda la plataforma a operadores turísticos y agencias amigas. Recibe ingresos mensuales continuos durante todo el tiempo que mantengan su suscripción activa.
          </p>
        </div>
      </div>

      <div className="product-card-surface p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[#111111]">
          Tu Enlace Único de Recomendación
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className={`${inputClass} font-mono text-xs select-all bg-[#f8f9fa]`}
          />
          <button
            type="button"
            onClick={copyReferralLink}
            className="product-button-primary shrink-0 gap-1.5"
          >
            {copiedReferral ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-[#6b7280]">
          Cualquier registro que ingrese por este enlace quedará automáticamente atribuido a tu cuenta de partner.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="product-card-surface p-4 space-y-1">
          <span className="text-[11px] font-medium text-[#6b7280]">Clics en Enlace</span>
          <p className="text-xl font-bold text-[#111111]">148</p>
          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +14% este mes
          </span>
        </div>
        <div className="product-card-surface p-4 space-y-1">
          <span className="text-[11px] font-medium text-[#6b7280]">Agencias Registradas</span>
          <p className="text-xl font-bold text-[#111111]">8</p>
          <span className="text-[10px] text-[#6b7280]">3 en prueba gratuita</span>
        </div>
        <div className="product-card-surface p-4 space-y-1">
          <span className="text-[11px] font-medium text-[#6b7280]">Ganancias Acumuladas</span>
          <p className="text-xl font-bold text-[#111111]">$240.00</p>
          <span className="text-[10px] text-emerald-600">USD facturados</span>
        </div>
        <div className="product-card-surface p-4 space-y-1">
          <span className="text-[11px] font-medium text-[#6b7280]">Disponible para Retiro</span>
          <p className="text-xl font-bold text-emerald-700">$160.00</p>
          <span className="text-[10px] text-[#6b7280] italic">Desembolso diferido</span>
        </div>
      </div>

      <div className="product-card-surface overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
            Actividad Reciente de Agencias Referidas (Demostración)
          </h4>
          <span className="text-xs text-[#6b7280]">Últimas conversiones</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] border-b border-[#e5e7eb] text-[#6b7280] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Agencia</th>
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Plan Contratado</th>
                <th className="px-4 py-2.5">Comisión Mensual</th>
                <th className="px-4 py-2.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              <tr className="product-data-row">
                <td className="px-4 py-3 font-semibold text-[#111111]">Andes Explorer Travel</td>
                <td className="px-4 py-3 text-[#6b7280]">hace 4 días</td>
                <td className="px-4 py-3">Plan Pro ($59/mes)</td>
                <td className="px-4 py-3 text-emerald-700 font-semibold">$11.80 / mes</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Activo
                  </span>
                </td>
              </tr>
              <tr className="product-data-row">
                <td className="px-4 py-3 font-semibold text-[#111111]">Cusco Sacred Expeditions</td>
                <td className="px-4 py-3 text-[#6b7280]">hace 12 días</td>
                <td className="px-4 py-3">Plan Enterprise ($149/mes)</td>
                <td className="px-4 py-3 text-emerald-700 font-semibold">$29.80 / mes</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Activo
                  </span>
                </td>
              </tr>
              <tr className="product-data-row">
                <td className="px-4 py-3 font-semibold text-[#111111]">Machu Picchu Direct</td>
                <td className="px-4 py-3 text-[#6b7280]">hace 18 días</td>
                <td className="px-4 py-3">Plan Starter ($29/mes)</td>
                <td className="px-4 py-3 text-emerald-700 font-semibold">$5.80 / mes</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Activo
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
