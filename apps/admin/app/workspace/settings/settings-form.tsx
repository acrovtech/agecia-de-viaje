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
    'mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500';
  const labelClass = 'block text-xs font-semibold text-slate-700 tracking-tight';

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>General y Contacto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Marca e Identidad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'domains'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Dominios y Vitrina</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('legal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'legal'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Perfil Legal y Fiscal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pagos (Frozen)</span>
        </button>
      </div>

      {/* TAB 1: GENERAL Y CONTACTO */}
      {activeTab === 'general' && (
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-xs max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Perfil Comercial y Contacto</h3>
            <p className="text-xs text-slate-500">
              Datos públicos principales mostrados a los clientes en la vitrina web.
            </p>
          </div>

          {profileState?.error && (
            <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
              {profileState.error}
            </p>
          )}
          {profileState?.success && (
            <p role="status" className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-xs sm:text-sm bg-slate-50 text-slate-500 font-mono"
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-xs max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Marca e Identidad Visual</h3>
            <p className="text-xs text-slate-500">
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-xs max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Dominios y Presencia Web</h3>
            <p className="text-xs text-slate-500">
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
                    className="flex-1 rounded-lg border border-slate-200 p-2.5 text-xs sm:text-sm font-mono"
                  />
                  <span className="text-xs text-slate-400 font-mono">.plataforma.com</span>
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
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Apunta tu registro CNAME hacia el proxy central para activar la vitrina.
                </span>
              </label>
            </div>

            {canEdit && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProfilePending}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-xs max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Perfil Legal y Tributario</h3>
            <p className="text-xs text-slate-500">
              Información fiscal requerida para comprobantes y cumplimiento normativo.
            </p>
          </div>

          {legalState?.error && (
            <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
              {legalState.error}
            </p>
          )}
          {legalState?.success && (
            <p role="status" className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs max-w-3xl">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pasarelas de Pago</h3>
              <p className="text-xs text-slate-500">
                Estado de integración con proveedores de cobro en línea.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              FROZEN / PROVIDER DEFERRED
            </span>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Integración de Pasarelas Diferida</span>
            </div>
            <p className="leading-relaxed">
              La conexión activa con proveedores de pago (Izipay, Culqi, Mercado Pago) se encuentra actualmente en estado congelado/diferido. Todas las reservas emitidas registran importes pactados en estado pendiente sin realizar cobros automáticos en tarjeta.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900 block">Izipay Perú</span>
                <span className="text-slate-400">Tarjetas de crédito/débito y PagoEfectivo</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Diferido</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900 block">Culqi</span>
                <span className="text-slate-400">Tarjetas, Yape y transferencias</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Diferido</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
