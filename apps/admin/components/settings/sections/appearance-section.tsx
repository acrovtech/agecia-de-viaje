'use client';

import React, { useState, useActionState } from 'react';
import { Palette, Check, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { MediaUploader } from '../../workspace/media-uploader';
import { updateAgencyProfileAction } from '../../../lib/settings-actions';
import type { AgencyProfileData, SettingsActionState } from '../types';

export interface AppearanceSectionProps {
  initialProfile: AgencyProfileData;
  canEdit: boolean;
}

export function AppearanceSection({ initialProfile, canEdit }: AppearanceSectionProps) {
  const [profileState, profileAction, isProfilePending] = useActionState<
    SettingsActionState | null,
    FormData
  >(updateAgencyProfileAction, null);

  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [primaryColor, setPrimaryColor] = useState('#111111');
  const [secondaryColor, setSecondaryColor] = useState('#2563EB');
  const [logoUrl, setLogoUrl] = useState(initialProfile.logoUrl || '');
  const [iconUrl, setIconUrl] = useState(initialProfile.iconUrl || '');

  const inputClass =
    'h-[34px] mt-1 block w-full rounded-lg border border-[#e5e7eb] px-3 text-sm text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:bg-[#f8f9fa] disabled:text-[#898989] transition-all';
  const labelClass = 'block text-xs sm:text-[13px] font-medium text-[#374151]';

  return (
    <form action={profileAction} className="space-y-6 max-w-3xl">
      <input type="hidden" name="expectedUpdatedAt" value={initialProfile.updatedAt} />
      <input type="hidden" name="name" value={initialProfile.name} />
      <input type="hidden" name="phone" value={initialProfile.phone || ''} />
      <input type="hidden" name="email" value={initialProfile.email || ''} />
      <input type="hidden" name="address" value={initialProfile.address || ''} />
      <input type="hidden" name="logoUrl" value={logoUrl} />
      <input type="hidden" name="iconUrl" value={iconUrl} />

      {profileState?.success && (
        <p role="alert" className="text-xs text-[#166534] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
          <span>Aspecto e identidad visual guardados con éxito.</span>
        </p>
      )}

      {profileState?.error && (
        <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
          <span>{profileState.error}</span>
        </p>
      )}

      {/* Selector de Tema */}
      <div className="product-card-surface p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#6b7280]" />
            <span>Tema de la Interfaz</span>
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Selecciona la apariencia preferida para el panel de administración.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setThemeMode('system')}
            className={`p-3.5 rounded-[10px] border text-left cursor-pointer transition-all flex flex-col justify-between ${
              themeMode === 'system'
                ? 'border-[#111111] bg-[#f8f9fa] shadow-product-card ring-1 ring-[#111111]'
                : 'border-[#e5e7eb] bg-white hover:bg-[#f8f9fa]'
            }`}
          >
            <div>
              <div className="h-10 rounded-lg bg-gradient-to-r from-white to-gray-200 border border-[#e5e7eb] mb-2.5 flex items-center justify-center">
                <span className="text-[10px] font-mono text-gray-500 font-semibold">AUTO</span>
              </div>
              <h4 className="text-xs font-semibold text-[#111111]">Predeterminado</h4>
              <p className="text-[11px] text-[#6b7280] mt-0.5">
                Modo actual según configuración de tu navegador.
              </p>
            </div>
            {themeMode === 'system' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#111111] font-semibold mt-2">
                <Check className="w-3 h-3" /> Activo
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`p-3.5 rounded-[10px] border text-left cursor-pointer transition-all flex flex-col justify-between ${
              themeMode === 'light'
                ? 'border-[#111111] bg-[#f8f9fa] shadow-product-card ring-1 ring-[#111111]'
                : 'border-[#e5e7eb] bg-white hover:bg-[#f8f9fa]'
            }`}
          >
            <div>
              <div className="h-10 rounded-lg bg-white border border-[#e5e7eb] mb-2.5 flex items-center justify-center shadow-xs">
                <span className="text-[10px] font-mono text-gray-800 font-semibold">LIGHT</span>
              </div>
              <h4 className="text-xs font-semibold text-[#111111]">Claro (Light)</h4>
              <p className="text-[11px] text-[#6b7280] mt-0.5">
                Superficie blanca limpia con contraste neutral.
              </p>
            </div>
            {themeMode === 'light' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#111111] font-semibold mt-2">
                <Check className="w-3 h-3" /> Activo
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`p-3.5 rounded-[10px] border text-left cursor-pointer transition-all flex flex-col justify-between ${
              themeMode === 'dark'
                ? 'border-[#111111] bg-[#f8f9fa] shadow-product-card ring-1 ring-[#111111]'
                : 'border-[#e5e7eb] bg-white hover:bg-[#f8f9fa]'
            }`}
          >
            <div>
              <div className="h-10 rounded-lg bg-[#161616] border border-[#262626] mb-2.5 flex items-center justify-center">
                <span className="text-[10px] font-mono text-gray-200 font-semibold">DARK</span>
              </div>
              <h4 className="text-xs font-semibold text-[#111111]">Oscuro (Dark)</h4>
              <p className="text-[11px] text-[#6b7280] mt-0.5">
                Modo oscuro para ambientes de baja luminosidad.
              </p>
            </div>
            {themeMode === 'dark' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#111111] font-semibold mt-2">
                <Check className="w-3 h-3" /> Activo
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Identidad de Marca: 2 Colores */}
      <div className="product-card-surface p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#111111]">
            Identidad de Marca (2 Colores Principales)
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Por el momento permitimos definir 2 colores canónicos que personalizarán tus vouchers y vitrina pública.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-[#e5e7eb]">
          <div className="space-y-2">
            <label className={labelClass}>Color Primario (Botones y Enlaces)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#e5e7eb] cursor-pointer p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className={`${inputClass} font-mono uppercase`}
                maxLength={7}
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#6b7280]">Presets:</span>
              {['#111111', '#0B4354', '#1E3A8A', '#065F46', '#831843'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPrimaryColor(c)}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Color Secundario (Acentos y Badges)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#e5e7eb] cursor-pointer p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className={`${inputClass} font-mono uppercase`}
                maxLength={7}
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#6b7280]">Presets:</span>
              {['#2563EB', '#D97706', '#059669', '#7C3AED', '#DC2626'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSecondaryColor(c)}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition-transform"
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logotipo y Favicon */}
      <div className="product-card-surface p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#111111]">
            Logotipo y Favicon de la Agencia
          </h3>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Formatos recomendados: SVG, PNG o WebP con fondo transparente.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-[#e5e7eb]">
          <div className="space-y-2">
            <label className={labelClass}>Logotipo Principal (Cabecera y Vouchers)</label>
            <MediaUploader
              name="logoUrl"
              kind="AGENCY_LOGO"
              value={logoUrl}
              onChange={setLogoUrl}
              label="Subir logotipo"
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Favicon / Icono Cuadrado (32x32 px)</label>
            <MediaUploader
              name="iconUrl"
              kind="AGENCY_ICON"
              value={iconUrl}
              onChange={setIconUrl}
              label="Subir favicon"
            />
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isProfilePending}
            className="product-button-primary"
          >
            {isProfilePending ? 'Guardando apariencia…' : 'Guardar identidad visual'}
          </button>
        </div>
      )}
    </form>
  );
}
