'use client';

import React from 'react';
import { Sparkles, Info, ShieldCheck } from 'lucide-react';
import type { AgencyProfileData } from '../types';

export interface BillingSectionProps {
  initialProfile: AgencyProfileData;
  credits?: {
    balance: number;
    ledger: Array<{ id: string; amount?: number; delta?: number; reason: string; createdAt: string }>;
  } | null;
}

export function BillingSection({ initialProfile, credits }: BillingSectionProps) {
  const creditBalance = credits?.balance ?? 0;
  const ledger = credits?.ledger || [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Notice: Status & Frozen Payments */}
      <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/70 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Suscripción SaaS y Gestión de Pagos: </span>
          <span>
            Esta sección administra tu plan de acceso a la plataforma. Las pasarelas de cobro a clientes finales en reservas turísticas permanecen en estado <strong>DIFERIDO / PROVEEDOR PENDIENTE</strong>.
          </span>
        </div>
      </div>

      {/* Subscription Status Card - Preview / Empty State */}
      <div className="product-card-surface p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e7eb] pb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
              Suscripción de la Agencia
            </span>
            <h3 className="text-base font-semibold text-[#111111] flex items-center gap-2">
              <span>Plan Base de Plataforma</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                MODO VISTA PREVIA
              </span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              La facturación recurrente SaaS se encuentra en fase de integración. Tu agencia opera con acceso estándar habilitado.
            </p>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f3f4f6] text-[#6b7280]">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Suscripción no vinculada
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs pt-1">
          <div>
            <span className="text-[#6b7280] block text-[11px]">Titular de la Cuenta:</span>
            <span className="font-semibold text-[#111111]">{initialProfile.name}</span>
          </div>
          <div>
            <span className="text-[#6b7280] block text-[11px]">Método de Pago Registrado:</span>
            <span className="font-medium text-[#6b7280]">Ninguna tarjeta o método registrado</span>
          </div>
        </div>
      </div>

      {/* AI Credits Card - Authoritative Data */}
      <div className="product-card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Créditos de Inteligencia Artificial</span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Balance institucional verificado para asistencia de catálogo y optimización de contenido.
            </p>
          </div>
          <div>
            <span className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
              Recargas próximamente
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#111111]">{creditBalance}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">créditos disponibles</span>
          </div>

          {ledger.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-xs text-[#6b7280]">
              No hay movimientos de créditos registrados para esta agencia.
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] block">
                Historial reciente de créditos
              </span>
              <div className="divide-y divide-[#e5e7eb] border border-[#e5e7eb] rounded-lg overflow-hidden text-xs">
                {ledger.map((item) => {
                  const amount = item.amount ?? item.delta ?? 0;
                  return (
                    <div key={item.id} className="p-2.5 flex items-center justify-between bg-white">
                      <div>
                        <span className="font-medium text-[#111111]">{item.reason}</span>
                        <span className="text-[10px] text-[#6b7280] block">
                          {new Date(item.createdAt).toLocaleDateString('es-PE', { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <span className={`font-mono font-semibold ${amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {amount > 0 ? `+${amount}` : amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoicing History - Preview / Empty State */}
      <div className="product-card-surface p-5 space-y-3">
        <div className="border-b border-[#e5e7eb] pb-3">
          <h4 className="text-sm font-semibold text-[#111111]">
            Comprobantes y Facturación
          </h4>
          <p className="text-xs text-[#6b7280]">
            Historial de facturas y recibos emitidos por el servicio SaaS.
          </p>
        </div>

        <div className="py-6 text-center text-xs text-[#6b7280]">
          No hay comprobantes emitidos. La emisión de facturas se activará cuando se configure un plan de pago.
        </div>
      </div>
    </div>
  );
}
