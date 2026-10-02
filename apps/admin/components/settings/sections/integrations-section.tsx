'use client';

import React from 'react';

export function IntegrationsSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="product-card-surface p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#111111]">
            Pasarelas de Pago y Cobro Online
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Conecta proveedores de cobro con tarjeta para confirmar reservas de manera automática.
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-[#e5e7eb]">
          <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                IZI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Izipay Pasarela</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    PROVEEDOR DIFERIDO
                  </span>
                </div>
                <p className="text-xs text-[#6b7280]">
                  Tarjetas de crédito y débito Visa, Mastercard, Diners, Amex con tokenización segura (Fase de pago diferida).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Pasarela Izipay: integración y activación diferida para siguiente fase.')}
              className="product-button-secondary text-xs"
            >
              Ver estado
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                STR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Stripe Payments</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f3f4f6] text-[#374151]">
                    INTEGRACIÓN PREVISTA
                  </span>
                </div>
                <p className="text-xs text-[#6b7280]">
                  Cobros internacionales en USD, EUR y más de 135 monedas globales.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Próximamente: conectar cuenta de Stripe Connect.')}
              className="product-button-secondary text-xs"
            >
              Conectar cuenta
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
                MP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Mercado Pago</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                    PRÓXIMAMENTE
                  </span>
                </div>
                <p className="text-xs text-[#6b7280]">
                  Cobros locales y billeteras digitales para América Latina.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="product-card-surface p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#111111]">
            Herramientas y Automatizaciones Conectadas
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Sincronización con calendarios de conductores, mensajería y webhooks.
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-[#e5e7eb]">
          <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                CAL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">Google Calendar</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                    PRÓXIMAMENTE
                  </span>
                </div>
                <p className="text-xs text-[#6b7280]">
                  Sincroniza salidas de tours y traslados directamente con el calendario de tus guías y choferes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Integración con Google Calendar programada para la siguiente fase.')}
              className="product-button-secondary text-xs"
            >
              Saber más
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                WSP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">WhatsApp Business Cloud API</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    PRÓXIMAMENTE
                  </span>
                </div>
                <p className="text-xs text-[#6b7280]">
                  Envío instantáneo de vouchers, confirmación de horarios de recojo y recordatorios a viajeros.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Integración con WhatsApp Cloud API en desarrollo.')}
              className="product-button-secondary text-xs"
            >
              Saber más
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
