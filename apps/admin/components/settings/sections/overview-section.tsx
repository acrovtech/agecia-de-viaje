'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User,
  Sliders,
  Palette,
  Gift,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Blocks,
  Search,
} from 'lucide-react';
import {
  getSettingsNavSections,
  type SettingsIconName,
} from '@/lib/settings-navigation';
import type { AgencyProfileData, NavIdentity } from '../types';

export interface OverviewSectionProps {
  initialProfile: AgencyProfileData;
  identity: NavIdentity;
}

function renderOverviewIcon(iconName: SettingsIconName) {
  switch (iconName) {
    case 'user':
      return <User className="w-4 h-4 text-[#374151]" />;
    case 'sliders':
      return <Sliders className="w-4 h-4 text-[#374151]" />;
    case 'palette':
      return <Palette className="w-4 h-4 text-[#374151]" />;
    case 'gift':
      return <Gift className="w-4 h-4 text-[#374151]" />;
    case 'credit-card':
      return <CreditCard className="w-4 h-4 text-[#374151]" />;
    case 'sparkles':
      return <Sparkles className="w-4 h-4 text-[#374151]" />;
    case 'shield-check':
      return <ShieldCheck className="w-4 h-4 text-[#374151]" />;
    case 'smartphone':
      return <Smartphone className="w-4 h-4 text-[#374151]" />;
    case 'blocks':
      return <Blocks className="w-4 h-4 text-[#374151]" />;
    default:
      return null;
  }
}

export function OverviewSection({ initialProfile, identity }: OverviewSectionProps) {
  const [query, setQuery] = useState('');
  const sections = getSettingsNavSections();

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            (item.overviewTitle && item.overviewTitle.toLowerCase().includes(q)) ||
            (item.overviewDescription && item.overviewDescription.toLowerCase().includes(q))
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, query]);

  return (
    <div className="space-y-6">
      {/* Top Header: Title + Search (Cal.com layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 pt-1 border-b border-[#f3f4f6]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
          Ajustes
        </h1>
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-[#898989] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar"
            className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#e5e7eb] rounded-lg text-[#111111] placeholder:text-[#898989] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
          />
        </div>
      </div>

      {/* Sections & Cards (Cal.com aesthetic) */}
      <div className="space-y-7">
        {filteredSections.map((section) => (
          <section key={section.id} className="space-y-2.5">
            <h2 className="text-sm font-semibold text-[#111111] tracking-tight">
              {section.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {section.items.map((card) => (
                <Link
                  key={card.id}
                  href={card.href}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#f3f4f6] transition-colors cursor-pointer group text-left"
                >
                  <div className="w-9 h-9 rounded-lg border border-[#e5e7eb] bg-white flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#d1d5db] transition-colors">
                    {renderOverviewIcon(card.iconName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-[13px] font-medium text-[#111111] leading-snug">
                        {card.label}
                      </h3>
                      {card.id === 'integrations' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Diferido
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#6b7280] leading-tight line-clamp-2 mt-0.5">
                      {card.overviewDescription || card.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-12 text-xs text-[#6b7280]">
            No se encontraron opciones para &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
