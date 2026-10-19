import React from 'react';
import Link from 'next/link';
import { requirePlatformSession, fetchPlatformAgencies } from '../../../../lib/platform-api';
import { Building2, ArrowUpRight, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformAgenciesPage() {
  const session = await requirePlatformSession();
  const agencies = await fetchPlatformAgencies(session.token);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Directorio de Agencias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Supervisión y métricas autoritativas de tenants registrados en el sistema multi-tenant.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted border border-border self-start text-muted-foreground">
          {agencies.length} {agencies.length === 1 ? 'tenant registrado' : 'tenants registrados'}
        </div>
      </div>

      {agencies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No hay agencias registradas</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Actualmente no hay ninguna agencia creada en la base de datos de la plataforma.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Agencia</th>
                  <th className="px-4 py-4">Slug</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-4 py-4 text-center">Miembros</th>
                  <th className="px-4 py-4 text-center">Tours</th>
                  <th className="px-4 py-4 text-center">Idiomas</th>
                  <th className="px-4 py-4 text-right">Créditos IA</th>
                  <th className="px-4 py-4">Registro</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agencies.map((agency) => {
                  const logo = agency.logoUrl || agency.iconUrl;
                  const initial = (agency.name || 'A').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={agency.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-foreground">
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
                          <span className="font-semibold text-foreground">
                            {agency.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {agency.slug}
                      </td>

                      <td className="px-4 py-4">
                        {agency.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                            Inactiva
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center font-medium">
                        {agency.membershipCount}
                      </td>

                      <td className="px-4 py-4 text-center font-medium">
                        {agency.tourCount}
                      </td>

                      <td className="px-4 py-4 text-center font-medium">
                        {agency.enabledCatalogLocaleCount}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{agency.aiCreditBalance}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {new Date(agency.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/platform/agencies/${agency.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Ver detalle
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
