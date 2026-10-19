import React from 'react';
import Link from 'next/link';
import { requirePlatformSession } from '../../../lib/platform-api';
import { platformLogoutAction } from '../../actions/platform-auth';
import { Shield, Home, Building2, Sliders, LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { identity } = await requirePlatformSession();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Platform Control Plane Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/platform" className="flex items-center gap-2.5 font-bold text-base tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Shield className="w-4 h-4" />
              </div>
              <span>Control Plane</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-md">
                Platform
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/platform"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Inicio
              </Link>
              <Link
                href="/platform/agencies"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Agencias
              </Link>
              <Link
                href="/platform/settings"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                Configuración de plataforma
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {identity.displayName || identity.email}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                  {identity.role}
                </span>
              </div>
            </div>

            <form action={platformLogoutAction}>
              <button
                type="submit"
                title="Cerrar sesión de plataforma"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border hover:border-destructive/20 transition-all text-xs font-medium flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
