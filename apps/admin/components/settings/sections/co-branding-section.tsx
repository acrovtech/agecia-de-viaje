'use client';

import React, { useActionState } from 'react';
import Image from 'next/image';
import { Sparkles, Lock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { updateAgencyBrandingAction, claimBrandingRewardAction } from '@/lib/settings-actions';
import type { AgencyBrandingInfo } from '@/lib/settings-loader';

export interface CoBrandingSectionProps {
  brandingInfo: AgencyBrandingInfo;
  agency: {
    name: string;
    logoUrl?: string | null;
    iconUrl?: string | null;
  };
  canEdit: boolean;
}

export function CoBrandingSection({ brandingInfo, agency, canEdit }: CoBrandingSectionProps) {
  const [toggleState, toggleAction, isTogglePending] = useActionState(updateAgencyBrandingAction, null);
  const [rewardState, rewardAction, isRewardPending] = useActionState(claimBrandingRewardAction, null);

  const {
    platformBrandingEnabled,
    coBrandingGloballyEnabled = true,
    rewardLockedUntil,
    isLocked,
    isCurrentPeriodClaimed,
    rewardCredits,
    brandingRewardEnabledGlobally,
    productName,
    platformLogoUrl,
    platformIconUrl,
  } = brandingInfo;

  const isGloballyDisabled = !coBrandingGloballyEnabled;
  const isEffectiveBrandingVisible = !isGloballyDisabled && platformBrandingEnabled;

  const initial = agency.name ? agency.name[0]?.toUpperCase() : 'A';

  const formatLockDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="product-card-surface p-6 space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#111111]" />
            <span>Marca de la Plataforma (Co-Branding)</span>
          </h3>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isGloballyDisabled
                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                : platformBrandingEnabled
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {isGloballyDisabled
              ? 'Desactivado por plataforma'
              : platformBrandingEnabled
              ? '● Visible en login'
              : 'Desactivada'}
          </span>
        </div>
        <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
          Muestra el logotipo de la plataforma junto al de tu agencia en las pantallas públicas de inicio de sesión.
        </p>
      </div>

      {/* Global Disable Platform Notice */}
      {isGloballyDisabled && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
            <span>El co-branding está temporalmente desactivado por la plataforma.</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            La administración global de la plataforma ha desactivado temporalmente la visualización de la marca del SaaS. La preferencia individual de tu agencia sigue guardada y volverá a mostrarse cuando la plataforma lo reactive.
          </p>
        </div>
      )}

      {/* Live Preview */}
      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col items-center justify-center gap-3">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Vista previa del encabezado de login
        </span>
        <div className="flex items-center gap-4 bg-white px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm">
          {/* Agency brand */}
          <div className="flex items-center justify-center">
            {agency.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agency.logoUrl} alt={agency.name} className="h-7 w-auto object-contain max-w-[120px]" />
            ) : agency.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agency.iconUrl} alt={agency.name} className="h-7 w-7 object-contain rounded" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                {initial}
              </div>
            )}
          </div>

          {isEffectiveBrandingVisible && (
            <>
              <div className="h-5 w-[1px] bg-slate-300" />
              <div className="flex items-center gap-1.5">
                {platformLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={platformLogoUrl} alt={productName} className="h-6 w-auto object-contain max-w-[100px]" />
                ) : platformIconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={platformIconUrl} alt={productName} className="h-6 w-6 object-contain" />
                ) : (
                  <>
                    <Image src="/icon.svg" alt={productName} width={20} height={20} className="object-contain" />
                    <span className="text-xs font-semibold text-slate-700">{productName}</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {toggleState?.error && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{toggleState.error}</span>
        </p>
      )}

      {rewardState?.error && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{rewardState.error}</span>
        </p>
      )}

      {rewardState?.message && (
        <p role="alert" className="text-xs text-emerald-800 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{rewardState.message}</span>
        </p>
      )}

      {/* Co-Branding Lock Card */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Co-branding bloqueado temporalmente por recompensa activa</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            🔒 Esta opción permanecerá activa hasta el {formatLockDate(rewardLockedUntil)} porque tu agencia reclamó la recompensa de créditos IA del ciclo actual.
          </p>
        </div>
      )}

      {/* Monthly Reward Disabled by Platform Kill Switch Notice */}
      {isGloballyDisabled && !isCurrentPeriodClaimed && brandingRewardEnabledGlobally && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span>Programa de recompensa de co-branding no disponible temporalmente</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            No es posible reclamar recompensas de co-branding mientras la marca se encuentre desactivada globalmente por la plataforma.
          </p>
        </div>
      )}

      {/* Monthly Reward Banner */}
      {!isGloballyDisabled && brandingRewardEnabledGlobally && !isCurrentPeriodClaimed && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold tracking-wide text-white">
              Recompensa mensual disponible: +{rewardCredits} Créditos IA
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Obtén +{rewardCredits} créditos IA este mes manteniendo el co-branding activo hasta el próximo ciclo.
          </p>
          {canEdit && (
            <form action={rewardAction}>
              <button
                type="submit"
                disabled={isRewardPending}
                className="py-2 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRewardPending ? (
                  <span>Reclamando créditos...</span>
                ) : platformBrandingEnabled ? (
                  <span>Mantener marca y recibir +{rewardCredits} créditos</span>
                ) : (
                  <span>Activar y recibir +{rewardCredits} créditos</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Already Claimed Notice */}
      {isCurrentPeriodClaimed && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Recompensa de este mes reclamada (+{rewardCredits} créditos IA concedidos).</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700">Ciclo {brandingInfo.currentPeriod}</span>
        </div>
      )}

      {/* Manual Toggle (Only if not locked and canEdit) */}
      {canEdit && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-800">Mostrar marca de la plataforma</p>
            <p className="text-[11px] text-slate-400">
              {isLocked
                ? 'Opción bloqueada hasta el próximo ciclo de facturación/calendario.'
                : 'Permite ocultar la marca de la plataforma si no deseas participar del programa de créditos.'}
            </p>
          </div>

          <form action={toggleAction}>
            <input
              type="hidden"
              name="platformBrandingEnabled"
              value={platformBrandingEnabled ? 'false' : 'true'}
            />
            <button
              type="submit"
              disabled={isLocked || isTogglePending}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border ${
                platformBrandingEnabled
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-[#111111] text-white hover:bg-[#222222] border-transparent'
              }`}
            >
              {isTogglePending ? (
                'Guardando...'
              ) : platformBrandingEnabled ? (
                'Desactivar co-branding'
              ) : (
                'Activar co-branding'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
