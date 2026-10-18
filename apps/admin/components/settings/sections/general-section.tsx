'use client';

import React, { useState, useActionState } from 'react';
import { Sliders, Check, Building2, CheckCircle2, AlertTriangle, Info, Globe } from 'lucide-react';
import { updateAgencyProfileAction } from '../../../lib/settings-actions';
import type { AgencyProfileData, NavIdentity, SettingsActionState } from '../types';

export interface GeneralSectionProps {
  initialProfile: AgencyProfileData;
  canEdit: boolean;
  identity?: NavIdentity;
  initialEntitlements?: {
    maxCatalogLocales: number;
    aiEnabled: boolean;
    aiMonthlyCredits: number;
  };
  initialLocales?: Array<{
    id: string;
    locale: string;
    isDefault: boolean;
    enabled: boolean;
  }> | null;
}

export function GeneralSection({
  initialProfile,
  canEdit,
  identity,
  initialEntitlements,
  initialLocales,
}: GeneralSectionProps) {
  const [profileState, profileAction, isProfilePending] = useActionState<
    SettingsActionState | null,
    FormData
  >(updateAgencyProfileAction, null);

  const [timezone, setTimezone] = useState('America/Lima');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [interfaceLanguage, setInterfaceLanguage] = useState<'es' | 'en'>('es');
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
          <span className="font-semibold text-[#111111]">Parámetros de configuración del sistema: </span>
          <span className="text-[#6b7280]">
            El idioma de la interfaz del software es independiente de los idiomas en los que se publican los tours del catálogo. La información comercial a continuación es persistente en tu perfil de agencia.
          </span>
        </div>
      </div>

      {/* Card: Preferencias de la Interfaz */}
      <div className="product-card-surface p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#6b7280]" />
            <span>Preferencias de la Interfaz</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Vista previa
            </span>
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Configura el idioma del panel administrativo, huso horario y formato de visualización de horas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e5e7eb]">
          {/* Idioma de la interfaz */}
          <div>
            <label className={labelClass}>Idioma de la Interfaz</label>
            <select
              value={interfaceLanguage}
              onChange={(e) => setInterfaceLanguage(e.target.value as 'es' | 'en')}
              className={inputClass}
            >
              <option value="es">Español (Activo)</option>
              <option value="en" disabled>Inglés (Próximamente)</option>
            </select>
            <p className="text-[11px] text-[#898989] mt-1">
              Idioma en el que se muestran los menús y paneles del administrador.
            </p>
          </div>

          {/* Zona Horaria */}
          <div>
            <label className={labelClass}>Zona horaria</label>
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
              Huso horario oficial para la visualización de fechas y calendario.
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
                Recibe un informe ejecutivo el primer día de cada mes con el volumen de reservas y valor comercial registrado.
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

      {/* Card: Idiomas del Catálogo */}
      <div className="product-card-surface p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#6b7280]" />
            <span>Idiomas del Catálogo</span>
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Idiomas en los que tus experiencias y tours se comercializan ante clientes y en la tienda online.
          </p>
        </div>

        <div className="pt-2 border-t border-[#e5e7eb] space-y-3">
          {initialLocales === null || initialLocales === undefined ? (
            <div className="p-3.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] flex items-center gap-2.5 text-xs text-[#991b1b]">
              <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
              <span>No fue posible consultar los idiomas del catálogo.</span>
            </div>
          ) : (
            (() => {
              const maxLocales = initialEntitlements?.maxCatalogLocales ?? 1;
              const activeLocales = initialLocales;
              const enabledCount = activeLocales.filter((l) => l.enabled).length;

              const localeMeta: Record<string, { label: string; flag: string }> = {
                es: { label: 'Español (es)', flag: '🇵🇪' },
                en: { label: 'Inglés (en)', flag: '🇺🇸' },
                pt: { label: 'Portugués (pt)', flag: '🇧🇷' },
                fr: { label: 'Francés (fr)', flag: '🇫🇷' },
                de: { label: 'Alemán (de)', flag: '🇩🇪' },
                it: { label: 'Italiano (it)', flag: '🇮🇹' },
              };

              if (activeLocales.length === 0) {
                return (
                  <div className="p-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] text-xs text-[#6b7280]">
                    No hay idiomas configurados en el catálogo.
                  </div>
                );
              }

              return (
                <>
                  {activeLocales.map((loc) => {
                    const meta = localeMeta[loc.locale] || { label: loc.locale.toUpperCase(), flag: '🌐' };
                    return (
                      <div key={loc.id || loc.locale} className="flex items-center justify-between p-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{meta.flag}</span>
                          <div>
                            <span className="text-xs font-semibold text-[#111111]">{meta.label}</span>
                            {loc.isDefault && (
                              <span className="ml-2 inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 uppercase">
                                Principal
                              </span>
                            )}
                            <p className="text-[11px] text-[#6b7280]">
                              {loc.isDefault
                                ? 'Idioma predeterminado para el contenido de tours y reservas.'
                                : 'Idioma secundario para traducción de contenido.'}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold ${loc.enabled ? 'text-[#111111]' : 'text-slate-400'}`}>
                          {loc.enabled ? 'Activo' : 'Deshabilitado'}
                        </span>
                      </div>
                    );
                  })}

                  <div className="p-3 rounded-lg border border-[#e5e7eb] bg-white flex items-center justify-between text-xs text-[#6b7280]">
                    <span>{enabledCount} de {maxLocales} {maxLocales === 1 ? 'idioma habilitado' : 'idiomas habilitados'}</span>
                    <span className="text-[11px] text-[#898989]">
                      Tu configuración actual permite {maxLocales} {maxLocales === 1 ? 'idioma' : 'idiomas'}
                    </span>
                  </div>
                </>
              );
            })()
          )}

          <p className="text-[11px] text-[#898989]">
            El contenido en idiomas adicionales vive de forma desacoplada por tour, manteniendo inalterables las tarifas, disponibilidad y condiciones comerciales.
          </p>
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
