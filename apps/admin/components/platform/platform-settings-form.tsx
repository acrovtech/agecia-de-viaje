'use client';

import React, { useActionState, useState } from 'react';
import { updatePlatformSettingsAction } from '../../app/actions/platform-settings';
import { Shield, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PlatformSettingsData } from '../../lib/platform-api';

interface PlatformSettingsFormProps {
  initialSettings: PlatformSettingsData;
  canEdit: boolean;
}

export function PlatformSettingsForm({
  initialSettings,
  canEdit,
}: PlatformSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updatePlatformSettingsAction, null);

  const [productName, setProductName] = useState(initialSettings.productName);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || '');
  const [iconUrl, setIconUrl] = useState(initialSettings.iconUrl || '');
  const [coBrandingEnabled, setCoBrandingEnabled] = useState(initialSettings.coBrandingEnabled ?? true);
  const [rewardEnabled, setRewardEnabled] = useState(initialSettings.brandingRewardEnabled);
  const [rewardCredits, setRewardCredits] = useState(initialSettings.brandingRewardCredits.toString());

  return (
    <form action={formAction} className="space-y-8">
      {state?.success && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium">{state.message || 'Configuración guardada exitosamente.'}</p>
        </div>
      )}

      {state?.error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium">{state.error}</p>
        </div>
      )}

      {/* Brand Identity Section */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Identidad de la Plataforma
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Personaliza el nombre y los activos visuales del SaaS que se renderizan en el login co-brandeado y en la consola.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="productName"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Nombre del Producto SaaS *
              </label>
              <input
                id="productName"
                name="productName"
                type="text"
                value={productName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
                required
                disabled={!canEdit || isPending}
                placeholder="Acrov SaaS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Visible en el header de login co-brandeado junto a la agencia.
              </p>
            </div>

            <div>
              <label
                htmlFor="logoUrl"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                URL del Logotipo Principal (Horizontal)
              </label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogoUrl(e.target.value)}
                disabled={!canEdit || isPending}
                placeholder="https://storage.com/platform-logo.webp"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Recomendado en formato SVG o WebP transparente.
              </p>
            </div>

            <div>
              <label
                htmlFor="iconUrl"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                URL del Ícono / Glifo Cuadrado
              </label>
              <input
                id="iconUrl"
                name="iconUrl"
                type="url"
                value={iconUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIconUrl(e.target.value)}
                disabled={!canEdit || isPending}
                placeholder="https://storage.com/platform-icon.webp"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Utilizado como fallback en pantallas pequeñas o avatares compactos.
              </p>
            </div>
          </div>

          {/* Visual Brand Preview */}
          <div className="p-6 rounded-xl bg-muted/30 border border-border flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Vista previa de la Marca
              </p>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  {iconUrl ? (
                    <img src={iconUrl} alt="Platform Icon" className="w-full h-full object-contain" />
                  ) : logoUrl ? (
                    <img src={logoUrl} alt="Platform Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Shield className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{productName || 'Nombre de Plataforma'}</p>
                  <p className="text-xs text-muted-foreground">Plataforma SaaS</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
              Los cambios en la marca se reflejarán inmediatamente en las pantallas de inicio de sesión de los tenants que mantengan el co-branding activo.
            </p>
          </div>
        </div>
      </div>

      {/* Global Co-Branding Visibility Kill Switch */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Visibilidad Global de Co-Branding
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Interruptor maestro de plataforma para gobernar la visualización de la marca de plataforma en todas las agencias.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
          <input
            type="checkbox"
            id="coBrandingEnabled"
            name="coBrandingEnabled"
            value="true"
            checked={coBrandingEnabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoBrandingEnabled(e.target.checked)}
            disabled={!canEdit || isPending}
            className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <div>
            <label
              htmlFor="coBrandingEnabled"
              className="text-sm font-semibold text-foreground cursor-pointer"
            >
              Mostrar co-branding de la plataforma globalmente
            </label>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Si se desactiva, la marca de la plataforma desaparecerá de inmediato de todas las pantallas de inicio de sesión de los tenants, incluso si las agencias la tienen activada. No modifica ni sobrescribe las preferencias guardadas de las agencias ni cancela bloqueos de recompensas previas.
            </p>
          </div>
        </div>
      </div>

      {/* Co-Branding Reward Program Section */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Programa Mensual de Recompensa de Co-Branding
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Controla la política global de incentivos en créditos IA para agencias que mantienen la marca de plataforma visible.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
            <input
              type="checkbox"
              id="brandingRewardEnabled"
              name="brandingRewardEnabled"
              value="true"
              checked={rewardEnabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRewardEnabled(e.target.checked)}
              disabled={!canEdit || isPending}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <div>
              <label
                htmlFor="brandingRewardEnabled"
                className="text-sm font-semibold text-foreground cursor-pointer"
              >
                Habilitar recompensa mensual de co-branding
              </label>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Controla la concesión mensual de créditos IA. Desactivar este programa no oculta el co-branding de la plataforma, solo impide que los tenants reclamen nuevos créditos IA este mes.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="brandingRewardCredits"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Créditos IA de recompensa *
            </label>
            <div className="max-w-xs">
              <input
                id="brandingRewardCredits"
                name="brandingRewardCredits"
                type="number"
                min="0"
                max="100000"
                step="1"
                value={rewardCredits}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRewardCredits(e.target.value)}
                required
                disabled={!canEdit || isPending}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Valor por defecto: 10 créditos. Modificar este valor afectará únicamente a los reclamos futuros de nuevos ciclos.
            </p>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? 'Guardando configuración...' : 'Guardar configuración de plataforma'}
          </button>
        </div>
      )}
    </form>
  );
}
