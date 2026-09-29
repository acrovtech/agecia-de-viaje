'use client';

import React, { useState, useActionState } from 'react';
import { MediaUploader } from '../../../components/workspace/media-uploader';
import {
  updateAgencyProfileAction,
  updateLegalProfileAction,
  type SettingsActionState,
} from './actions';

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
  const [profileState, profileAction, isProfilePending] = useActionState<SettingsActionState | null, FormData>(
    updateAgencyProfileAction,
    null
  );
  const [legalState, legalAction, isLegalPending] = useActionState<SettingsActionState | null, FormData>(
    updateLegalProfileAction,
    null
  );

  const [logoUrl, setLogoUrl] = useState(initialProfile.logoUrl || '');
  const [iconUrl, setIconUrl] = useState(initialProfile.iconUrl || '');

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: PERFIL DE LA AGENCIA / BRANDING */}
      <section className="bg-white rounded-xl border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Perfil de la Agencia y Marca
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Información visible para los viajeros y personalización de identidad corporativa.
          </p>
        </div>

        {profileState?.error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {profileState.error}
          </div>
        )}
        {profileState?.success && (
          <div role="status" className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            Perfil de la agencia actualizado correctamente.
          </div>
        )}

        <form action={profileAction} className="space-y-5">
          <input
            type="hidden"
            name="expectedUpdatedAt"
            value={profileState?.updatedAt || initialProfile.updatedAt}
          />
          <input type="hidden" name="logoUrl" value={logoUrl} />
          <input type="hidden" name="iconUrl" value={iconUrl} />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre de la Empresa / Marca *
              </label>
              <input
                type="text"
                name="name"
                required
                disabled={!canEdit || isProfilePending}
                defaultValue={initialProfile.name}
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Identificador de Sistema (Slug)
              </label>
              <input
                type="text"
                disabled
                value={initialProfile.slug}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <span className="text-xs text-slate-400">
                El slug y los dominios son gestionados a nivel plataforma.
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="phone"
                disabled={!canEdit || isProfilePending}
                defaultValue={initialProfile.phone || ''}
                placeholder="+51 987 654 321"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                name="email"
                disabled={!canEdit || isProfilePending}
                defaultValue={initialProfile.email || ''}
                placeholder="contacto@tuagencia.com"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Dirección Física / Oficina
            </label>
            <input
              type="text"
              name="address"
              disabled={!canEdit || isProfilePending}
              defaultValue={initialProfile.address || ''}
              placeholder="Av. Sol 123, Cusco, Perú"
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
            />
          </div>

          <div className="border-t pt-5 space-y-4">
            <h3 className="text-md font-medium text-slate-800">
              Identidad Visual (Logotipo e Ícono)
            </h3>
            <p className="text-xs text-slate-500">
              Utiliza el cargador seguro para subir imágenes con aislamiento multinquilino a Cloudflare R2.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <MediaUploader
                  name="agencyLogoUploader"
                  label="Logotipo Principal de la Agencia"
                  kind="AGENCY_LOGO"
                  value={logoUrl}
                  onChange={(val) => setLogoUrl(val)}
                  required={false}
                  placeholder="https://..."
                  helpText="Recomendado: PNG o WebP con fondo transparente."
                />
              </div>

              <div>
                <MediaUploader
                  name="agencyIconUploader"
                  label="Ícono o Favicon de la Agencia"
                  kind="AGENCY_ICON"
                  value={iconUrl}
                  onChange={(val) => setIconUrl(val)}
                  required={false}
                  placeholder="https://..."
                  helpText="Recomendado: Imagen cuadrada de al menos 128x128 px."
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="pt-3">
              <button
                type="submit"
                disabled={isProfilePending}
                className="px-5 py-2.5 bg-[#062918] text-white text-sm font-medium rounded-lg hover:bg-[#0a3f25] disabled:opacity-50"
              >
                {isProfilePending ? 'Guardando cambios…' : 'Guardar Perfil de Agencia'}
              </button>
            </div>
          )}
        </form>
      </section>

      {/* SECCIÓN 2: PERFIL LEGAL (RUC / FISCAL) */}
      <section className="bg-white rounded-xl border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Perfil Legal y Tributario
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Datos fiscales para facturación, libro de reclamaciones y contratos de viaje.
          </p>
        </div>

        {legalState?.error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {legalState.error}
          </div>
        )}
        {legalState?.success && (
          <div role="status" className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            Perfil legal guardado exitosamente.
          </div>
        )}

        <form action={legalAction} className="space-y-5">
          <input
            type="hidden"
            name="expectedUpdatedAt"
            value={legalState?.updatedAt || initialLegal.updatedAt || ''}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                RUC (Registro Único de Contribuyentes) *
              </label>
              <input
                type="text"
                name="ruc"
                required
                maxLength={11}
                pattern="\d{11}"
                disabled={!canEdit || isLegalPending}
                defaultValue={initialLegal.ruc}
                placeholder="20123456789 (11 dígitos)"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
              <span className="text-xs text-slate-500">
                Validación estructural de 11 dígitos numéricos.
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Razón Social *
              </label>
              <input
                type="text"
                name="legalName"
                required
                disabled={!canEdit || isLegalPending}
                defaultValue={initialLegal.legalName}
                placeholder="VIAJES Y TURISMO S.A.C."
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre Comercial
              </label>
              <input
                type="text"
                name="tradeName"
                disabled={!canEdit || isLegalPending}
                defaultValue={initialLegal.tradeName}
                placeholder="Tu Agencia Tours"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Representante Legal
              </label>
              <input
                type="text"
                name="legalRepresentative"
                disabled={!canEdit || isLegalPending}
                defaultValue={initialLegal.legalRepresentative}
                placeholder="Juan Pérez"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Domicilio Fiscal *
            </label>
            <input
              type="text"
              name="fiscalAddress"
              required
              disabled={!canEdit || isLegalPending}
              defaultValue={initialLegal.fiscalAddress}
              placeholder="Av. Pardo 456, Miraflores, Lima, Perú"
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo Electrónico Legal / Fiscal
              </label>
              <input
                type="email"
                name="contactEmail"
                disabled={!canEdit || isLegalPending}
                defaultValue={initialLegal.contactEmail}
                placeholder="facturacion@tuagencia.com"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Teléfono Legal / Fiscal
              </label>
              <input
                type="tel"
                name="contactPhone"
                disabled={!canEdit || isLegalPending}
                defaultValue={initialLegal.contactPhone}
                placeholder="+51 1 234 5678"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
              />
            </div>
          </div>

          {canEdit && (
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLegalPending}
                className="px-5 py-2.5 bg-[#062918] text-white text-sm font-medium rounded-lg hover:bg-[#0a3f25] disabled:opacity-50"
              >
                {isLegalPending ? 'Guardando cambios…' : 'Guardar Perfil Legal'}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
