'use client';

import React, { useState, useActionState } from 'react';
import { Sliders, Check, Building2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { updateAgencyProfileAction } from '../../../lib/settings-actions';
import type { AgencyProfileData, NavIdentity, SettingsActionState } from '../types';

export interface GeneralSectionProps {
  initialProfile: AgencyProfileData;
  canEdit: boolean;
  identity?: NavIdentity;
}

export function GeneralSection({
  initialProfile,
  canEdit,
  identity,
}: GeneralSectionProps) {
  const [profileState, profileAction, isProfilePending] = useActionState<
    SettingsActionState | null,
    FormData
  >(updateAgencyProfileAction, null);

  const [timezone, setTimezone] = useState('America/Lima');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [monthlyDigestEnabled, setMonthlyDigestEnabled] = useState(true);
  const [monthlyDigestEmail, setMonthlyDigestEmail] = useState(
    initialProfile.email || identity?.email || ''
  );

  const inputClass =
    'h-[34px] mt-1 block w-full rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:bg-[#f8f9fa] disabled:text-[#898989] transition-all';
  const labelClass = 'block text-xs sm:text-[13px] font-medium text-[#374151]';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Notice: Regional parameters status */}
      <div className="p-3.5 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] flex items-start gap-2.5 text-xs text-[#374151]">
        <Info className="w-4 h-4 text-[#6b7280] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#111111]">Vista preliminar de preferencias regionales: </span>
          <span className="text-[#6b7280]">
            El idioma, zona horaria y formato horario son funcionales en la sesión de interfaz; la persistencia duradera en base de datos central está programada para la siguiente fase. La información comercial a continuación sí es persistente.
          </span>
        </div>
      </div>

      {/* Card: Parámetros del Sistema */}
      <div className="product-card-surface p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#6b7280]" />
            <span>Preferencias Regionales y del Sistema</span>
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Configura idioma, huso horario oficial para el despacho y recepción de resúmenes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e5e7eb]">
          {/* Idioma */}
          <div>
            <label className={labelClass}>Idioma de la Plataforma</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
              className={inputClass}
            >
              <option value="es">Español (Predeterminado)</option>
              <option value="en" disabled>English (Próximamente)</option>
            </select>
            <p className="text-[11px] text-[#898989] mt-1">
              La interfaz operativa y los comprobantes se emitirán en el idioma elegido.
            </p>
          </div>

          {/* Zona Horaria */}
          <div>
            <label className={labelClass}>Zona Horaria (Timezone)</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={inputClass}
            >
              <option value="America/Lima">America/Lima (UTC-05:00 - Perú)</option>
              <option value="America/Bogota">America/Bogota (UTC-05:00 - Colombia)</option>
              <option value="America/Mexico_City">America/Mexico_City (UTC-06:00 - México)</option>
              <option value="America/Santiago">America/Santiago (UTC-04:00 - Chile)</option>
              <option value="America/Buenos_Aires">America/Buenos_Aires (UTC-03:00 - Argentina)</option>
              <option value="UTC">UTC (Tiempo Universal Coordinado)</option>
            </select>
            <p className="text-[11px] text-[#898989] mt-1">
              Afecta el cálculo de fechas de despacho y horarios de recogida de traslados.
            </p>
          </div>
        </div>

        {/* Formato de Hora */}
        <div className="pt-2">
          <label className={labelClass}>Formato de Visualización de Hora</label>
          <div className="grid grid-cols-2 gap-3 mt-1.5 max-w-sm">
            <button
              type="button"
              onClick={() => setTimeFormat('12h')}
              className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                timeFormat === '12h'
                  ? 'border-[#111111] bg-[#f8f9fa] text-[#111111] shadow-product-card'
                  : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8f9fa]'
              }`}
            >
              <span>12 Horas (AM / PM)</span>
              {timeFormat === '12h' && <Check className="w-3.5 h-3.5 text-[#111111]" />}
            </button>
            <button
              type="button"
              onClick={() => setTimeFormat('24h')}
              className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                timeFormat === '24h'
                  ? 'border-[#111111] bg-[#f8f9fa] text-[#111111] shadow-product-card'
                  : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8f9fa]'
              }`}
            >
              <span>24 Horas (14:30)</span>
              {timeFormat === '24h' && <Check className="w-3.5 h-3.5 text-[#111111]" />}
            </button>
          </div>
        </div>

        {/* Correo de Resumen Mensual */}
        <div className="pt-3 border-t border-[#e5e7eb] space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#111111]">
                Correo Electrónico de Resumen Mensual
              </h4>
              <p className="text-xs text-[#6b7280] mt-0.5">
                Recibe un informe ejecutivo el primer día de cada mes con el volumen de reservas, ingresos y gastos.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={monthlyDigestEnabled}
                onChange={(e) => setMonthlyDigestEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#e5e7eb] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#e5e7eb] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111111]"></div>
            </label>
          </div>

          {monthlyDigestEnabled && (
            <div className="max-w-md pt-1">
              <label className={labelClass}>Email Destinatario del Resumen</label>
              <input
                type="email"
                value={monthlyDigestEmail}
                onChange={(e) => setMonthlyDigestEmail(e.target.value)}
                placeholder="gerencia@agencia.com"
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* Card: Datos de Contacto de la Empresa */}
      <form action={profileAction} className="product-card-surface p-5 space-y-4">
        <input type="hidden" name="expectedUpdatedAt" value={initialProfile.updatedAt} />
        <input type="hidden" name="logoUrl" value={initialProfile.logoUrl || ''} />
        <input type="hidden" name="iconUrl" value={initialProfile.iconUrl || ''} />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6b7280]" />
              <span>Información Comercial de la Empresa</span>
            </h3>
            <p className="text-xs text-[#6b7280]">
              Nombre comercial, teléfonos y datos de atención pública para clientes y reservas.
            </p>
          </div>
        </div>

        {profileState?.success && (
          <p role="alert" className="text-xs text-[#166534] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span>Información general actualizada exitosamente.</span>
          </p>
        )}

        {profileState?.error && (
          <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
            <span>{profileState.error}</span>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e5e7eb]">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nombre Comercial de la Empresa *</label>
            <input
              type="text"
              name="name"
              required
              disabled={!canEdit}
              defaultValue={initialProfile.name}
              placeholder="Ej. Incas Travel Agency"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono de Atención / WhatsApp</label>
            <input
              type="tel"
              name="phone"
              disabled={!canEdit}
              defaultValue={initialProfile.phone || ''}
              placeholder="+51 984 000 000"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Correo Electrónico de Contacto</label>
            <input
              type="email"
              name="email"
              disabled={!canEdit}
              defaultValue={initialProfile.email || ''}
              placeholder="reservas@agencia.com"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Dirección Física de la Oficina</label>
            <input
              type="text"
              name="address"
              disabled={!canEdit}
              defaultValue={initialProfile.address || ''}
              placeholder="Portal de Panes 123, Plaza de Armas, Cusco"
              className={inputClass}
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-3 border-t border-[#e5e7eb]">
            <button
              type="submit"
              disabled={isProfilePending}
              className="product-button-primary"
            >
              {isProfilePending ? 'Guardando cambios...' : 'Guardar información general'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
