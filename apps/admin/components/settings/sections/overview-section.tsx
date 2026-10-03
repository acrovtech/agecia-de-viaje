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
  const iconClass = "w-4 h-4 text-foreground";
  switch (iconName) {
    case 'user':
      return <User className={iconClass} />;
    case 'sliders':
      return <Sliders className={iconClass} />;
    case 'palette':
      return <Palette className={iconClass} />;
    case 'gift':
      return <Gift className={iconClass} />;
    case 'credit-card':
      return <CreditCard className={iconClass} />;
    case 'sparkles':
      return <Sparkles className={iconClass} />;
    case 'shield-check':
      return <ShieldCheck className={iconClass} />;
    case 'smartphone':
      return <Smartphone className={iconClass} />;
    case 'blocks':
      return <Blocks className={iconClass} />;
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

      {/* Sections & Cards (Cal.com aesthetic with exact stacked icon cards) */}
      <div className="space-y-8">
        {filteredSections.map((section) => (
          <section key={section.id} className="space-y-2">
            <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight px-1">
              {section.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {section.items.map((card) => (
                <div
                  key={card.id}
                  className="relative flex w-full items-start gap-4 py-3 ps-4 pe-2 rounded-[10px] hover:bg-muted transition-colors cursor-pointer group"
                >
                  {/* Cal.com stacked icon deck */}
                  <div
                    className="relative pointer-events-none shrink-0 m-0"
                    data-slot="empty-media"
                    data-variant="icon"
                    aria-hidden="true"
                  >
                    {/* Rotated background card left */}
                    <div
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground m-0 pointer-events-none absolute bottom-px origin-bottom-left -translate-x-0.5 -rotate-[10deg] scale-[0.84] shadow-none"
                    />
                    {/* Rotated background card right */}
                    <div
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground m-0 pointer-events-none absolute bottom-px origin-bottom-right translate-x-0.5 rotate-[10deg] scale-[0.84] shadow-none"
                    />
                    {/* Front card with icon */}
                    <div
                      className="relative flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-xs pointer-events-none m-0"
                      aria-hidden="true"
                    >
                      {renderOverviewIcon(card.iconName)}
                    </div>
                  </div>

                  {/* Title and description with stretched link hit area */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={card.href}
                        className="font-medium text-sm leading-tight text-foreground before:absolute before:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-[10px]"
                      >
                        {card.label}
                      </Link>
                    </div>
                    <p className="text-muted-foreground text-xs leading-normal line-clamp-2 pointer-events-none">
                      {card.overviewDescription || card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No se encontraron opciones para &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
