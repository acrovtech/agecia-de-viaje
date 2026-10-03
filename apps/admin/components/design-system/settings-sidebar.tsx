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
import {
  SETTINGS_NAV_ITEMS,
  getSettingsNavSections,
} from '@/lib/settings-navigation';
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
  const overviewItem = SETTINGS_NAV_ITEMS.find((item) => item.id === 'overview') || SETTINGS_NAV_ITEMS[0]!;
  const navSections = getSettingsNavSections();

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
          href={overviewItem.href}
          onClick={onNavigate}
          className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive(overviewItem.href)
              ? 'bg-[#e5e7eb]/80 text-[#111111] font-semibold'
              : 'text-[#4b5563] hover:text-[#111111] hover:bg-[#f3f4f6] font-medium'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-[#4b5563]" />
          <span>{overviewItem.label}</span>
        </Link>
      </div>

      {/* 3. Dynamic Sections derived from canonical SETTINGS_NAV_ITEMS */}
      {navSections.map((section) => (
        <div key={section.id} className="space-y-1">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-[#111111]">
            {section.iconName === 'agency' ? (
              <div className="w-5 h-5 rounded-full bg-[#78350f] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {initialLetter}
              </div>
            ) : section.iconName === 'shield-check' ? (
              <ShieldCheck className="w-4 h-4 text-[#4b5563]" />
            ) : section.iconName === 'credit-card' ? (
              <CreditCard className="w-4 h-4 text-[#4b5563]" />
            ) : section.iconName === 'smartphone' ? (
              <Smartphone className="w-4 h-4 text-[#4b5563]" />
            ) : section.iconName === 'blocks' ? (
              <Blocks className="w-4 h-4 text-[#4b5563]" />
            ) : null}
            <span className="truncate">
              {section.iconName === 'agency' ? identity.agencyName || 'Mi Agencia' : section.label}
            </span>
          </div>
          <div className="space-y-0.5 ps-7 pe-1">
            {section.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className={linkClass(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
