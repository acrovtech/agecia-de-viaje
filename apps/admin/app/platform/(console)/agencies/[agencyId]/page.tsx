import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePlatformSession, fetchPlatformAgencyDetail } from '../../../../../lib/platform-api';
import { Building2, ArrowLeft, Sparkles, Lock, ShieldCheck, Globe, Users, Compass, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PlatformAgencyDetailPageProps {
  params: Promise<{ agencyId: string }>;
}

export default async function PlatformAgencyDetailPage({
  params,
}: PlatformAgencyDetailPageProps) {
  const { agencyId } = await params;
  const session = await requirePlatformSession();
  const detail = await fetchPlatformAgencyDetail(agencyId, session.token);

  if (!detail) {
    notFound();
  }

  const { agency, counts, locales, entitlements, aiCredits, coBranding } = detail;
  const logo = agency.logoUrl || agency.iconUrl;
  const initial = (agency.name || 'A').charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link
          href="/platform/agencies"
          className="hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a Agencias
        </Link>
        <span>/</span>
        <span className="text-foreground">{agency.name}</span>
      </div>

      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border border-border bg-muted flex items-center justify-center font-bold text-xl text-foreground overflow-hidden shadow-inner shrink-0">
            {logo ? (
              <img
                src={logo}
                alt={agency.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {agency.name}
              </h1>
              {agency.isActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Activa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                  Inactiva
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Slug: {agency.slug} · ID: {agency.id}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registrada el {new Date(agency.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
            </p>
          </div>
        </div>

        {/* Note: NO IMPERSONATION controls */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground max-w-xs text-right">
          <p className="font-semibold text-foreground">Aislamiento de Tenant</p>
          <p className="mt-0.5 text-[11px]">
            La sesión de plataforma no puede interactuar directamente con datos operativos de este tenant.
          </p>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Summary */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Métricas del Tenant
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Miembros del equipo
              </span>
              <span className="font-bold text-foreground">{counts.membershipCount}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                Tours registrados
              </span>
              <span className="font-bold text-foreground">{counts.tourCount}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                Idiomas habilitados
              </span>
              <span className="font-bold text-foreground">
                {counts.enabledCatalogLocaleCount} de {counts.localeCount}
              </span>
            </div>
          </div>
        </div>

        {/* Entitlements */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Límites y Entitlements
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Máx. idiomas en catálogo</span>
              <span className="font-bold text-foreground">{entitlements.maxCatalogLocales}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Funcionalidades IA</span>
              <span className="font-semibold text-foreground">
                {entitlements.aiEnabled ? 'Habilitadas' : 'Deshabilitadas'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">Cuota mensual base IA</span>
              <span className="font-bold text-foreground">+{entitlements.aiMonthlyCredits}</span>
            </div>
          </div>
        </div>

        {/* AI Credits */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Saldo de Créditos IA
          </h2>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-3xl font-extrabold text-foreground">
              {aiCredits.balance}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1">
              Créditos IA disponibles en libro mayor
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            El ajuste manual arbitrario de saldo está deshabilitado en AUTH1 para preservar la trazabilidad del libro mayor.
          </p>
        </div>
      </div>

      {/* Co-Branding & Monthly Reward Section */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Estado de Co-Branding y Recompensas
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Supervisa la visibilidad de la marca de plataforma y el estado de la recompensa mensual de créditos IA.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Co-branding
            </p>
            <p className="text-base font-bold text-foreground mt-1">
              {coBranding.platformBrandingEnabled ? 'Visible' : 'Oculto'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {coBranding.platformBrandingEnabled
                ? 'El logo de la plataforma se muestra junto al de la agencia'
                : 'La agencia utiliza su propia marca sin co-branding'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bloqueo Activo
            </p>
            <p className="text-base font-bold text-foreground mt-1 flex items-center gap-1.5">
              {coBranding.isLocked && <Lock className="w-4 h-4 text-amber-500" />}
              {coBranding.isLocked && coBranding.rewardLockedUntil
                ? `Hasta ${new Date(coBranding.rewardLockedUntil).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`
                : 'Ninguno'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {coBranding.isLocked
                ? 'La agencia no puede desactivar el co-branding hasta el próximo ciclo'
                : 'La preferencia puede modificarse libremente'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recompensa Ciclo Actual
            </p>
            <p className="text-base font-bold text-foreground mt-1">
              {coBranding.currentPeriodReward === 'CLAIMED' ? (
                <span className="text-emerald-600 dark:text-emerald-400">Reclamada</span>
              ) : coBranding.currentPeriodReward === 'AVAILABLE' ? (
                <span className="text-blue-600 dark:text-blue-400">Disponible</span>
              ) : (
                <span className="text-muted-foreground">Deshabilitada</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {coBranding.currentPeriodReward === 'CLAIMED'
                ? `+${coBranding.rewardAmount} créditos ya otorgados este mes`
                : `Premio potencial: +${coBranding.rewardAmount} créditos`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Último Período Premiado
            </p>
            <p className="text-base font-mono font-bold text-foreground mt-1">
              {coBranding.lastRewardedPeriod || 'Ninguno'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Identificador canónico YYYY-MM
            </p>
          </div>
        </div>
      </div>

      {/* Catalog Locales List */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <h2 className="text-base font-bold text-foreground">
          Idiomas del Catálogo Comercial
        </h2>
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {locales.map((loc) => (
            <div
              key={loc.id}
              className="px-4 py-3 bg-card flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold uppercase">{loc.locale}</span>
                {loc.isDefault && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                    Principal
                  </span>
                )}
              </div>
              <div>
                {loc.enabled ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Habilitado
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    Deshabilitado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
