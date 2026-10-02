'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar, type NavIdentity } from './sidebar';
import { PRODUCT_SHORT_NAME } from '../../lib/brand';

interface AppShellProps {
  identity: NavIdentity;
  children: React.ReactNode;
  sidebar?: React.ReactNode | ((props: { onNavigate?: () => void }) => React.ReactNode);
}

export function AppShell({ identity, children, sidebar }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-svh md:h-svh bg-[#f8f9fa] text-[#111111] flex flex-col md:flex-row antialiased font-sans overflow-clip">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-[#e5e7eb] shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-[#374151] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-lg transition-colors"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {PRODUCT_SHORT_NAME[0]}
            </div>
            <span className="font-semibold text-xs text-[#111111] truncate max-w-[180px]">
              {identity.agencyName}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer / Slide-over */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Menú lateral móvil"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#111111]/30 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-[#f8f9fa] h-full shadow-xl border-r border-[#e5e7eb] flex flex-col z-10 animate-in slide-in-from-left duration-150">
            <div className="p-3 border-b border-[#e5e7eb] flex items-center justify-between bg-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                Navegación
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-[#6b7280] hover:text-[#111111] rounded-md transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {typeof sidebar === 'function'
                ? sidebar({ onNavigate: () => setMobileOpen(false) })
                : sidebar
                ? sidebar
                : <Sidebar identity={identity} onNavigate={() => setMobileOpen(false)} />}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Desktop Sidebar */}
      <div
        className={
          sidebar
            ? "hidden md:flex md:w-60 lg:w-64 2xl:w-72 shrink-0 flex-col md:h-svh sticky top-0 z-30"
            : "hidden md:flex md:w-16 lg:w-64 2xl:w-72 shrink-0 flex-col md:h-svh sticky top-0 z-30"
        }
      >
        {typeof sidebar === 'function'
          ? sidebar({})
          : (sidebar || <Sidebar identity={identity} />)}
      </div>

      {/* Elevated White MAIN SURFACE (top 8px, right 8px, bottom 8px, left 0px) */}
      <div className="flex-1 flex flex-col min-w-0 md:my-2 md:me-2 md:ms-0 md:h-[calc(100svh-1rem)] md:max-h-[calc(100svh-1rem)] md:overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 product-main-surface">
          <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
