'use client';

import React, { useState } from 'react';
import { CreditCard, Sparkles, Download, AlertTriangle, Info } from 'lucide-react';
import { ConfirmDialog } from '../../design-system/confirm-dialog';
import type { AgencyProfileData } from '../types';

export interface BillingSectionProps {
  initialProfile: AgencyProfileData;
}

export function BillingSection({ initialProfile }: BillingSectionProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [planCancelled, setPlanCancelled] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Notice: Status & Frozen Payments */}
      <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/70 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Suscripción SaaS y Gestión de Pagos: </span>
          <span>
            Esta sección administra tu plan de acceso a la plataforma. Las pasarelas de cobro a clientes finales en reservas turísticas permanecen en estado <strong>FROZEN / PROVIDER DEFERRED</strong>.
          </span>
        </div>
      </div>

      <div className="product-card-surface p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e7eb] pb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
              Suscripción Actual
            </span>
            <h3 className="text-base font-semibold text-[#111111] flex items-center gap-2">
              <span>Plan Pro Crecimiento</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {planCancelled ? 'CANCELACIÓN PROGRAMADA' : 'ACTIVO'}
              </span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              $59.00 USD / mes · Próxima renovación: 28 de Octubre, 2026
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!planCancelled ? (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="product-button-secondary text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Deshabilitar o cancelar plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPlanCancelled(false)}
                className="product-button-primary"
              >
                Reactivar suscripción
              </button>
            )}
          </div>
        </div>

        {planCancelled && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Tu plan se encuentra en período de gracia. Mantendrás el acceso a todas las funcionalidades hasta el término del ciclo de facturación.
            </span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3 text-xs pt-1">
          <div>
            <span className="text-[#6b7280] block text-[11px]">Método de Pago:</span>
            <span className="font-semibold text-[#111111]">Visa terminada en •••• 4242</span>
          </div>
          <div>
            <span className="text-[#6b7280] block text-[11px]">Facturado a:</span>
            <span className="font-semibold text-[#111111]">{initialProfile.name}</span>
          </div>
          <div>
            <span className="text-[#6b7280] block text-[11px]">Estado del Cobro:</span>
            <span className="font-semibold text-emerald-700">Al día sin cargos pendientes</span>
          </div>
        </div>
      </div>

      <div className="product-card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Créditos de la Plataforma</span>
            </h3>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Utilizados para cotizaciones automáticas, notificaciones transaccionales y herramientas avanzadas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Próximamente: recarga de paquetes de 500 y 1,000 créditos.')}
            className="product-button-secondary text-xs"
          >
            Recargar créditos
          </button>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#111111]">Saldo restante: 750 créditos</span>
            <span className="text-[#6b7280]">Límite mensual: 1,000 créditos</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
            <div className="h-full bg-[#111111] rounded-full w-3/4"></div>
          </div>
          <p className="text-[11px] text-[#898989]">
            Se renovarán automáticamente 1,000 créditos al inicio del siguiente ciclo de facturación.
          </p>
        </div>
      </div>

      <div className="product-card-surface overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[#111111]">
              Registro de Gastos y Facturación Mensual
            </h4>
            <p className="text-xs text-[#6b7280]">
              Histórico de recibos emitidos por el uso de la plataforma.
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert('Generando reporte consolidado en PDF…')}
            className="product-button-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar historial</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] border-b border-[#e5e7eb] text-[#6b7280] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Factura / ID</th>
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Concepto</th>
                <th className="px-4 py-2.5">Importe</th>
                <th className="px-4 py-2.5 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              <tr className="product-data-row">
                <td className="px-4 py-3 font-mono text-[#111111]">INV-2026-0901</td>
                <td className="px-4 py-3 text-[#6b7280]">01 Sep, 2026</td>
                <td className="px-4 py-3">Suscripción Mensual - Plan Pro</td>
                <td className="px-4 py-3 font-semibold text-[#111111]">$59.00 USD</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => alert('Descargando comprobante INV-2026-0901.pdf')}
                    className="text-xs text-[#111111] hover:underline"
                  >
                    PDF
                  </button>
                </td>
              </tr>
              <tr className="product-data-row">
                <td className="px-4 py-3 font-mono text-[#111111]">INV-2026-0801</td>
                <td className="px-4 py-3 text-[#6b7280]">01 Ago, 2026</td>
                <td className="px-4 py-3">Suscripción Mensual - Plan Pro</td>
                <td className="px-4 py-3 font-semibold text-[#111111]">$59.00 USD</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => alert('Descargando comprobante INV-2026-0801.pdf')}
                    className="text-xs text-[#111111] hover:underline"
                  >
                    PDF
                  </button>
                </td>
              </tr>
              <tr className="product-data-row">
                <td className="px-4 py-3 font-mono text-[#111111]">INV-2026-0701</td>
                <td className="px-4 py-3 text-[#6b7280]">01 Jul, 2026</td>
                <td className="px-4 py-3">Suscripción Mensual - Plan Pro</td>
                <td className="px-4 py-3 font-semibold text-[#111111]">$59.00 USD</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => alert('Descargando comprobante INV-2026-0701.pdf')}
                    className="text-xs text-[#111111] hover:underline"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => {
          setPlanCancelled(true);
          setCancelModalOpen(false);
        }}
        title="¿Deshabilitar o cancelar tu suscripción?"
        description="Al cancelar el plan, tu suscripción no se renovará al final del ciclo actual. Podrás seguir operando hasta el 28 de Octubre, 2026."
        confirmLabel="Confirmar cancelación"
        cancelLabel="Mantener plan"
        isDestructive={true}
      />
    </div>
  );
}
