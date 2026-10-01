'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar, type NavIdentity } from './sidebar';
import { PRODUCT_SHORT_NAME } from '../../lib/brand';

interface AppShellProps {
  identity: NavIdentity;
  children: React.ReactNode;
}

export function AppShell({ identity, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col md:flex-row antialiased font-sans">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/90 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {PRODUCT_SHORT_NAME[0]}
            </div>
            <span className="font-semibold text-xs text-slate-900 truncate max-w-[180px]">
              {identity.agencyName}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer / Slide-over */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Menú lateral móvil"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Navegación
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar identity={identity} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Persistent Desktop Sidebar */}
      <div className="hidden md:flex w-60 lg:w-64 shrink-0 flex-col h-screen sticky top-0 z-30">
        <Sidebar identity={identity} />
      </div>

      {/* Elevated White MAIN SURFACE */}
      <div className="flex-1 flex flex-col min-w-0 md:p-3 lg:p-4 md:h-screen md:overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 bg-white md:border md:border-slate-200/90 md:rounded-2xl md:shadow-xs md:overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
