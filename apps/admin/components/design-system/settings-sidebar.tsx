'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  LayoutGrid,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Blocks,
} from 'lucide-react';
import type { NavIdentity } from './sidebar';

interface SettingsSidebarProps {
  identity: NavIdentity;
  onNavigate?: () => void;
  className?: string;
}

export function SettingsSidebar({
  identity,
  onNavigate,
  className = '',
}: SettingsSidebarProps) {
  const pathname = usePathname() || '/settings';

  const initialLetter = identity.agencyName ? identity.agencyName[0]?.toUpperCase() : 'A';

  const isActive = (targetHref: string) => {
    if (targetHref === '/settings') {
      return pathname === '/settings';
    }
    if (targetHref === '/settings/security/legal') {
      return pathname === '/settings/security' || pathname.startsWith('/settings/security/');
    }
    return pathname === targetHref || pathname.startsWith(`${targetHref}/`);
  };

  const linkClass = (targetHref: string) => {
    const selected = isActive(targetHref);
    return `block px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
      selected
        ? 'bg-[#e5e7eb]/80 text-[#111111] font-semibold'
        : 'text-[#4b5563] hover:text-[#111111] hover:bg-[#f3f4f6] font-medium'
    }`;
  };

  return (
    <aside
      className={`flex flex-col h-full bg-[#f8f9fa] text-[#111111] select-none p-3 space-y-4 overflow-y-auto no-scrollbar ${className}`}
      aria-label="Navegación de configuración"
    >
      {/* 1. Header: Back link to normal operational workspace (Dashboard) */}
      <div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#4b5563] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#4b5563]" />
          <span>Atrás</span>
        </Link>
      </div>

      {/* 2. Top-level item: Resumen */}
      <div>
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive('/settings')
              ? 'bg-[#e5e7eb]/80 text-[#111111] font-semibold'
              : 'text-[#4b5563] hover:text-[#111111] hover:bg-[#f3f4f6] font-medium'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-[#4b5563]" />
          <span>Resumen</span>
        </Link>
      </div>

      {/* 3. Section: Agency / User profile */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-[#111111]">
          <div className="w-5 h-5 rounded-full bg-[#78350f] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
            {initialLetter}
          </div>
          <span className="truncate">{identity.agencyName || 'Mi Agencia'}</span>
        </div>
        <div className="space-y-0.5 ps-7 pe-1">
          <Link
            href="/settings/profile"
            onClick={onNavigate}
            className={linkClass('/settings/profile')}
          >
            Perfil
          </Link>
          <Link
            href="/settings/general"
            onClick={onNavigate}
            className={linkClass('/settings/general')}
          >
            General
          </Link>
          <Link
            href="/settings/appearance"
            onClick={onNavigate}
            className={linkClass('/settings/appearance')}
          >
            Aspecto
          </Link>
          <Link
            href="/settings/referrals"
            onClick={onNavigate}
            className={linkClass('/settings/referrals')}
          >
            Gana 20% de referencia
          </Link>
        </div>
      </div>

      {/* 4. Section: Seguridad */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-[#111111]">
          <ShieldCheck className="w-4 h-4 text-[#4b5563]" />
          <span>Seguridad</span>
        </div>
        <div className="space-y-0.5 ps-7 pe-1">
          <Link
            href="/settings/security/legal"
            onClick={onNavigate}
            className={linkClass('/settings/security/legal')}
          >
            Perfil legal
          </Link>
        </div>
      </div>

      {/* 5. Section: Facturación */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-[#111111]">
          <CreditCard className="w-4 h-4 text-[#4b5563]" />
          <span>Facturación</span>
        </div>
        <div className="space-y-0.5 ps-7 pe-1">
          <Link
            href="/settings/billing"
            onClick={onNavigate}
            className={linkClass('/settings/billing')}
          >
            Gestione la facturación
          </Link>
          <Link
            href="/settings/plans"
            onClick={onNavigate}
            className={linkClass('/settings/plans')}
          >
            Planes
          </Link>
        </div>
      </div>

      {/* 6. Section: Página social */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-[#111111]">
          <Smartphone className="w-4 h-4 text-[#4b5563]" />
          <span>Página social</span>
        </div>
        <div className="space-y-0.5 ps-7 pe-1">
          <Link
            href="/settings/social"
            onClick={onNavigate}
            className={linkClass('/settings/social')}
          >
            Link in Bio
          </Link>
        </div>
      </div>

      {/* 7. Section: Integraciones */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-[#111111]">
          <Blocks className="w-4 h-4 text-[#4b5563]" />
          <span>Integraciones</span>
        </div>
        <div className="space-y-0.5 ps-7 pe-1">
          <Link
            href="/settings/integrations"
            onClick={onNavigate}
            className={linkClass('/settings/integrations')}
          >
            Pasarelas y APIs
          </Link>
        </div>
      </div>
    </aside>
  );
}
