'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface DomainSubtabsProps {
  domain: 'tours' | 'transfers';
}

const TOURS_SUBTABS = [
  { label: 'Categorías', href: '/resources/categories' },
  { label: 'Personal operativo (guías y conductores)', href: '/resources/personnel' },
];

const TRANSFERS_SUBTABS = [
  { label: 'Flota operativa', href: '/resources/fleet' },
  { label: 'Vehículos comerciales', href: '/resources/vehicles' },
];

export function DomainSubtabs({ domain }: DomainSubtabsProps) {
  const pathname = usePathname();
  const tabs = domain === 'tours' ? TOURS_SUBTABS : TRANSFERS_SUBTABS;

  return (
    <div className="flex gap-1.5 border-b border-[#e5e7eb] pb-3 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-[#111111] text-white shadow-2xs font-semibold'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
