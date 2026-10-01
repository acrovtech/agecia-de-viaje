'use client';

import React, { useState, useActionState } from 'react';
import { MediaUploader } from '../../../components/workspace/media-uploader';
import {
  updateAgencyProfileAction,
  updateLegalProfileAction,
  type SettingsActionState,
} from './actions';
import {
  Building2,
  Palette,
  Globe,
  FileText,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface AgencyProfileData {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  updatedAt: string;
}

interface LegalProfileData {
  ruc: string;
  legalName: string;
  tradeName: string;
  fiscalAddress: string;
  legalRepresentative: string;
  contactEmail: string;
  contactPhone: string;
  updatedAt: string | null;
}

interface SettingsFormProps {
  initialProfile: AgencyProfileData;
  initialLegal: LegalProfileData;
  canEdit: boolean;
}

export function SettingsForm({
  initialProfile,
  initialLegal,
  canEdit,
}: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'domains' | 'legal' | 'payments'>(
    'general',
  );

  const [profileState, profileAction, isProfilePending] = useActionState<
    SettingsActionState | null,
    FormData
  >(updateAgencyProfileAction, null);

  const [legalState, legalAction, isLegalPending] = useActionState<
    SettingsActionState | null,
    FormData
  >(updateLegalProfileAction, null);

  const [logoUrl, setLogoUrl] = useState(initialProfile.logoUrl || '');
  const [iconUrl, setIconUrl] = useState(initialProfile.iconUrl || '');

  const inputClass =
    'h-10 mt-1 block w-full rounded-lg border border-[#e5e7eb] px-3 text-xs sm:text-sm text-[#111111] bg-white focus:outline-none focus:ring-1 focus:ring-[#111111] disabled:bg-[#f8f9fa] disabled:text-[#898989] transition-all';
  const labelClass = 'block text-xs font-medium text-[#374151] tracking-tight';

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#e5e7eb] pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>General y Contacto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Marca e Identidad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'domains'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Dominios y Vitrina</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('legal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'legal'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Perfil Legal y Fiscal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-[#111111] text-white'
              : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pagos (Frozen)</span>
        </button>
      </div>

      {/* TAB 1: GENERAL Y CONTACTO */}
      {activeTab === 'general' && (
        <section className="max-w-3xl space-y-5">
          <div className="border-b border-[#e5e7eb] pb-3">
            <h3 className="text-base font-semibold tracking-tight text-[#111111]">Perfil Comercial y Contacto</h3>
            <p className="text-xs text-[#6b7280]">
              Datos públicos principales mostrados a los clientes en la vitrina web.
            </p>
          </div>

          {profileState?.error && (
            <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca]">
              {profileState.error}
            </p>
          )}
          {profileState?.success && (
            <p role="status" className="text-xs text-[#15803d] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              <span>{profileState.success}</span>
            </p>
          )}

          <form action={profileAction} className="space-y-4">
            <input type="hidden" name="expectedUpdatedAt" value={initialProfile.updatedAt} />
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <input type="hidden" name="iconUrl" value={iconUrl} />

            <div className="grid sm:grid-cols-2 gap-4">
              <label className={labelClass}>
                Nombre de la Agencia *
                <input
                  type="text"
                  name="name"
                  required
                  disabled={!canEdit || isProfilePending}
                  defaultValue={initialProfile.name}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Identificador único (slug)
                <input
                  type="text"
                  disabled
                  value={initialProfile.slug}
                  className="h-10 mt-1 block w-full rounded-lg border border-[#e5e7eb] px-3 text-xs sm:text-sm bg-[#f8f9fa] text-[#6b7280] font-mono"
                />
              </label>

              <label className={labelClass}>
                Correo electrónico público
                <input
                  type="email"
                  name="email"
                  disabled={!canEdit || isProfilePending}
                  defaultValue={initialProfile.email || ''}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Teléfono de atención
                <input
                  type="tel"
                  name="phone"
                  disabled={!canEdit || isProfilePending}
                  defaultValue={initialProfile.phone || ''}
                  className={inputClass}
                />
              </label>
            </div>

            <label className={labelClass}>
              Dirección comercial / Oficina
              <input
                type="text"
                name="address"
                disabled={!canEdit || isProfilePending}
                defaultValue={initialProfile.address || ''}
                className={inputClass}
              />
            </label>

            {canEdit && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProfilePending}
                  className="h-8 px-3 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none disabled:opacity-50 cursor-pointer"
                >
                  {isProfilePending ? 'Guardando…' : 'Guardar información general'}
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      {/* TAB 2: MARCA E IDENTIDAD */}
      {activeTab === 'branding' && (
        <section className="max-w-3xl space-y-5">
          <div className="border-b border-[#e5e7eb] pb-3">
            <h3 className="text-base font-semibold tracking-tight text-[#111111]">Marca e Identidad Visual</h3>
            <p className="text-xs text-[#6b7280]">
              Logotipo, isotipo y recursos gráficos de tu agencia.
            </p>
          </div>

          <form action={profileAction} className="space-y-5">
            <input type="hidden" name="expectedUpdatedAt" value={initialProfile.updatedAt} />
            <input type="hidden" name="name" value={initialProfile.name} />
            <input type="hidden" name="email" value={initialProfile.email || ''} />
            <input type="hidden" name="phone" value={initialProfile.phone || ''} />
            <input type="hidden" name="address" value={initialProfile.address || ''} />
            <input type="hidden" name="subdomain" value={initialProfile.subdomain || ''} />
            <input type="hidden" name="customDomain" value={initialProfile.customDomain || ''} />

            <div className="grid sm:grid-cols-2 gap-4">
              <MediaUploader
                name="logoUrl"
                label="Logotipo principal"
                kind="AGENCY_LOGO"
                value={logoUrl}
                onChange={setLogoUrl}
                placeholder="https://..."
                helpText="Recomendado en formato PNG o SVG con fondo transparente."
              />

              <MediaUploader
                name="iconUrl"
                label="Isotipo / Favicon"
                kind="AGENCY_ICON"
                value={iconUrl}
                onChange={setIconUrl}
                placeholder="https://..."
                helpText="Ícono cuadrado para la pestaña del navegador."
              />
            </div>

            {canEdit && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProfilePending}
                  className="h-8 px-3 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none disabled:opacity-50 cursor-pointer"
                >
                  {isProfilePending ? 'Guardando…' : 'Guardar identidad visual'}
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      {/* TAB 3: DOMINIOS Y VITRINA */}
      {activeTab === 'domains' && (
        <section className="max-w-3xl space-y-5">
          <div className="border-b border-[#e5e7eb] pb-3">
            <h3 className="text-base font-semibold tracking-tight text-[#111111]">Dominios y Presencia Web</h3>
            <p className="text-xs text-[#6b7280]">
              Enlace de catálogo y configuración de dominio personalizado.
            </p>
          </div>

          <form action={profileAction} className="space-y-4">
            <input type="hidden" name="expectedUpdatedAt" value={initialProfile.updatedAt} />
            <input type="hidden" name="name" value={initialProfile.name} />
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <input type="hidden" name="iconUrl" value={iconUrl} />

            <div className="space-y-4">
              <label className={labelClass}>
                Subdominio de la plataforma
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    name="subdomain"
                    disabled={!canEdit || isProfilePending}
                    defaultValue={initialProfile.subdomain || ''}
                    placeholder="mi-agencia"
                    className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs sm:text-sm font-mono text-[#111111] bg-white focus:outline-none focus:ring-1 focus:ring-[#111111]"
                  />
                  <span className="text-xs text-[#6b7280] font-mono">.plataforma.com</span>
                </div>
              </label>

              <label className={labelClass}>
                Dominio personalizado (CNAME)
                <input
                  type="text"
                  name="customDomain"
                  disabled={!canEdit || isProfilePending}
                  defaultValue={initialProfile.customDomain || ''}
                  placeholder="tours.miagencia.com"
                  className={inputClass}
                />
                <span className="text-[11px] text-[#6b7280] mt-1 block">
                  Apunta tu registro CNAME hacia el proxy central para activar la vitrina.
                </span>
              </label>
            </div>

            {canEdit && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProfilePending}
                  className="h-8 px-3 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none disabled:opacity-50 cursor-pointer"
                >
                  {isProfilePending ? 'Guardando…' : 'Guardar dominios'}
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      {/* TAB 4: PERFIL LEGAL Y FISCAL */}
      {activeTab === 'legal' && (
        <section className="max-w-3xl space-y-5">
          <div className="border-b border-[#e5e7eb] pb-3">
            <h3 className="text-base font-semibold tracking-tight text-[#111111]">Perfil Legal y Tributario</h3>
            <p className="text-xs text-[#6b7280]">
              Información fiscal requerida para comprobantes y cumplimiento normativo.
            </p>
          </div>

          {legalState?.error && (
            <p role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca]">
              {legalState.error}
            </p>
          )}
          {legalState?.success && (
            <p role="status" className="text-xs text-[#15803d] bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              <span>{legalState.success}</span>
            </p>
          )}

          <form action={legalAction} className="space-y-4">
            <input type="hidden" name="expectedUpdatedAt" value={initialLegal.updatedAt || ''} />

            <div className="grid sm:grid-cols-2 gap-4">
              <label className={labelClass}>
                RUC / Identificación Fiscal *
                <input
                  type="text"
                  name="ruc"
                  required
                  disabled={!canEdit || isLegalPending}
                  defaultValue={initialLegal.ruc}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Razón Social *
                <input
                  type="text"
                  name="legalName"
                  required
                  disabled={!canEdit || isLegalPending}
                  defaultValue={initialLegal.legalName}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Nombre Comercial
                <input
                  type="text"
                  name="tradeName"
                  disabled={!canEdit || isLegalPending}
                  defaultValue={initialLegal.tradeName}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Representante Legal
                <input
                  type="text"
                  name="legalRepresentative"
                  disabled={!canEdit || isLegalPending}
                  defaultValue={initialLegal.legalRepresentative}
                  className={inputClass}
                />
              </label>
            </div>

            <label className={labelClass}>
              Domicilio Fiscal *
              <input
                type="text"
                name="fiscalAddress"
                required
                disabled={!canEdit || isLegalPending}
                defaultValue={initialLegal.fiscalAddress}
                className={inputClass}
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className={labelClass}>
                Correo Fiscal
                <input
                  type="email"
                  name="contactEmail"
                  disabled={!canEdit || isLegalPending}
                  defaultValue={initialLegal.contactEmail}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Teléfono Fiscal
                <input
                  type="tel"
                  name="contactPhone"
                  disabled={!canEdit || isLegalPending}
                  defaultValue={initialLegal.contactPhone}
                  className={inputClass}
                />
              </label>
            </div>

            {canEdit && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLegalPending}
                  className="h-8 px-3 bg-[#111111] hover:bg-[#242424] text-white rounded-md text-xs font-semibold shadow-none disabled:opacity-50 cursor-pointer"
                >
                  {isLegalPending ? 'Guardando…' : 'Guardar perfil legal'}
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      {/* TAB 5: PAGOS (FROZEN / PROVIDER DEFERRED) */}
      {activeTab === 'payments' && (
        <section className="max-w-3xl space-y-4">
          <div className="border-b border-[#e5e7eb] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[#111111]">Pasarelas de Pago</h3>
              <p className="text-xs text-[#6b7280]">
                Estado de integración con proveedores de cobro en línea.
              </p>
            </div>
            <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-[#f3f4f6] text-[#111111] border border-[#e5e7eb]">
              FROZEN / PROVIDER DEFERRED
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#f8f9fa] text-xs text-[#374151] space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-[#111111]">
              <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />
              <span>Integración de Pasarelas Diferida</span>
            </div>
            <p className="leading-relaxed text-[#6b7280]">
              La conexión activa con proveedores de pago (Izipay, Culqi, Mercado Pago) se encuentra actualmente en estado congelado/diferido. Todas las reservas emitidas registran importes pactados en estado pendiente sin realizar cobros automáticos en tarjeta.
            </p>
          </div>

          <div className="rounded-xl bg-white shadow-cal-surface divide-y divide-[#e5e7eb] overflow-hidden">
            <div className="p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-[#111111] block">Izipay Perú</span>
                <span className="text-[#6b7280]">Tarjetas de crédito/débito y PagoEfectivo</span>
              </div>
              <span className="text-[#898989] font-mono text-[11px]">Diferido</span>
            </div>

            <div className="p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-[#111111] block">Culqi</span>
                <span className="text-[#6b7280]">Tarjetas, Yape y transferencias</span>
              </div>
              <span className="text-[#898989] font-mono text-[11px]">Diferido</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
