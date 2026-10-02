'use client';

import React, { useActionState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { updateLegalProfileAction } from '@/lib/settings-actions';
import type { LegalProfileData } from '../types';

interface LegalSectionProps {
  initialLegal: LegalProfileData;
  canEdit: boolean;
}

export function LegalSection({ initialLegal, canEdit }: LegalSectionProps) {
  const [legalState, legalAction, isLegalPending] = useActionState(updateLegalProfileAction, null);

  const labelClass = 'block text-xs font-semibold text-[#111111] mb-1.5';
  const inputClass =
    'block w-full rounded-lg border border-[#e5e7eb] p-2.5 text-xs text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] transition-colors disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed';

  return (
    <div className="space-y-6 max-w-3xl">
      <form action={legalAction} className="product-card-surface p-5 space-y-4">
        <input
          type="hidden"
          name="expectedUpdatedAt"
          value={initialLegal.updatedAt || ''}
        />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6b7280]" />
              <span>Perfil Legal y Fiscal de la Empresa</span>
            </h3>
            <p className="text-xs text-[#6b7280]">
              Datos constitutivos requeridos para facturación electrónica y cumplimiento tributario.
            </p>
          </div>
        </div>

        {legalState?.success && (
          <p role="alert" className="text-xs text-[#166534] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span>Perfil legal actualizado exitosamente.</span>
          </p>
        )}

        {legalState?.error && (
          <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
            <span>{legalState.error}</span>
          </p>
        )}

        <fieldset disabled={isLegalPending || !canEdit} className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                RUC / Identificador Fiscal <span className="text-rose-500">*</span>
              </label>
              <input
                name="ruc"
                type="text"
                required
                pattern="^\d{11}$"
                maxLength={11}
                defaultValue={initialLegal.ruc}
                placeholder="20600000001"
                className={`${inputClass} font-mono`}
              />
              <p className="text-[11px] text-[#898989] mt-0.5">Exactamente 11 dígitos numéricos.</p>
            </div>

            <div>
              <label className={labelClass}>
                Razón Social Completa <span className="text-rose-500">*</span>
              </label>
              <input
                name="legalName"
                type="text"
                required
                defaultValue={initialLegal.legalName}
                placeholder="Agencia de Viajes y Turismo S.A.C."
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nombre Comercial Registrado</label>
            <input
              name="tradeName"
              type="text"
              defaultValue={initialLegal.tradeName || ''}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Domicilio Fiscal Oficial <span className="text-rose-500">*</span>
            </label>
            <input
              name="fiscalAddress"
              type="text"
              required
              defaultValue={initialLegal.fiscalAddress}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Representante Legal</label>
              <input
                name="legalRepresentative"
                type="text"
                defaultValue={initialLegal.legalRepresentative || ''}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email de Notificación Fiscal</label>
              <input
                name="contactEmail"
                type="email"
                defaultValue={initialLegal.contactEmail || ''}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono Legal</label>
              <input
                name="contactPhone"
                type="tel"
                defaultValue={initialLegal.contactPhone || ''}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isLegalPending || !canEdit}
              className="product-button-primary"
            >
              {isLegalPending ? 'Guardando datos legales…' : 'Guardar perfil legal'}
            </button>
          </div>
        </fieldset>
      </form>

      <div className="product-card-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#6b7280]" />
          <span>Auditoría de Sesiones y Accesos</span>
        </h3>
        <p className="text-xs text-[#6b7280]">
          Dispositivos autenticados actualmente en tu cuenta.
        </p>

        <div className="space-y-3 pt-2">
          <div className="p-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <span className="font-semibold text-[#111111] block">Navegador Actual (Windows · Chrome)</span>
                <span className="text-[#6b7280]">Conexión activa ahora · IP verificada</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ESTA SESIÓN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
