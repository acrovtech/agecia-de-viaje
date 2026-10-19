import React from 'react';
import Link from 'next/link';
import { requirePlatformSession, fetchPlatformAgencies } from '../../../lib/platform-api';
import { Building2, Compass, Users, Sparkles, Sliders, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformOverviewPage() {
  const session = await requirePlatformSession();
  const agencies = await fetchPlatformAgencies(session.token);

  const totalAgencies = agencies.length;
  const activeAgencies = agencies.filter((a) => a.isActive).length;
  const totalTours = agencies.reduce((acc, a) => acc + (a.tourCount || 0), 0);
  const totalMembers = agencies.reduce((acc, a) => acc + (a.membershipCount || 0), 0);
  const totalCredits = agencies.reduce((acc, a) => acc + (a.aiCreditBalance || 0), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-card via-card/80 to-primary/5 border border-border shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary mb-3">
            SaaS Platform Administration
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Panel de Control de la Plataforma
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Supervisa el estado global de los tenants, consulta métricas autoritativas de uso y gestiona la configuración de marca y recompensas de co-branding.
          </p>
        </div>
      </div>

      {/* Authoritative Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agencias Registradas
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalAgencies}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeAgencies} activas</span> · {totalAgencies - activeAgencies} inactivas
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tours Publicados
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalTours}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              En catálogo comercial
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Usuarios / Miembros
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalMembers}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cuentas activas en tenants
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Créditos IA en Tenants
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalCredits}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Balance total en libros mayores
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/platform/agencies"
          className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              Directorio de Agencias (Tenants)
            </h2>
            <p className="text-sm text-muted-foreground">
              Explora las agencias registradas, verifica su estado de aislamiento, membresías, idiomas y recompensas de co-branding.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-2 shrink-0" />
        </Link>

        <Link
          href="/platform/settings"
          className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              Configuración Global de Plataforma
            </h2>
            <p className="text-sm text-muted-foreground">
              Configura el nombre del producto SaaS, los logotipos de la plataforma y el programa mensual de créditos por co-branding.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-2 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
