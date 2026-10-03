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
  ArrowRight,
} from 'lucide-react';
import {
  getSettingsOverviewCards,
  getSettingsConfigByPath,
  type SettingsRouteConfig,
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
      return <User className="w-4 h-4" />;
    case 'sliders':
      return <Sliders className="w-4 h-4" />;
    case 'palette':
      return <Palette className="w-4 h-4" />;
    case 'gift':
      return <Gift className="w-4 h-4" />;
    case 'credit-card':
      return <CreditCard className="w-4 h-4" />;
    case 'sparkles':
      return <Sparkles className="w-4 h-4" />;
    case 'shield-check':
      return <ShieldCheck className="w-4 h-4" />;
    case 'smartphone':
      return <Smartphone className="w-4 h-4" />;
    case 'blocks':
      return <Blocks className="w-4 h-4" />;
    default:
      return null;
  }
}

function getIconContainerClass(iconName: SettingsIconName) {
  switch (iconName) {
    case 'gift':
      return 'w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors';
    case 'sparkles':
      return 'w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors';
    case 'smartphone':
      return 'w-9 h-9 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors';
    default:
      return 'w-9 h-9 rounded-lg bg-[#f3f4f6] text-[#111111] flex items-center justify-center group-hover:bg-[#111111] group-hover:text-white transition-colors';
  }
}

function renderBadge(card: SettingsRouteConfig, identity: NavIdentity) {
  if (card.overviewBadgeVariant === 'role') {
    return (
      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#f3f4f6] text-[#374151]">
        {identity?.role || 'ACTIVO'}
      </span>
    );
  }
  if (!card.overviewBadge) return null;

  switch (card.overviewBadgeVariant) {
    case 'neutral':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f3f4f6] text-[#374151]">
          {card.overviewBadge}
        </span>
      );
    case 'emerald':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          {card.overviewBadge}
        </span>
      );
    case 'amber':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
          {card.overviewBadge}
        </span>
      );
    case 'amber-bordered':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          {card.overviewBadge}
        </span>
      );
    case 'blue':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          {card.overviewBadge}
        </span>
      );
    case 'indigo':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
          {card.overviewBadge}
        </span>
      );
    case 'pink':
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-pink-100 text-pink-800">
          {card.overviewBadge}
        </span>
      );
    default:
      return null;
  }
}

export function OverviewSection({ initialProfile, identity }: OverviewSectionProps) {
  const cards = getSettingsOverviewCards();
  const billingConfig = getSettingsConfigByPath('/settings/billing');
  const appearanceConfig = getSettingsConfigByPath('/settings/appearance');

  return (
    <div className="space-y-6">
      {/* Top Quick Tenant Banner */}
      <div className="product-card-surface p-5 bg-gradient-to-r from-white to-[#f8f9fa] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-base shadow-product-surface shrink-0">
            {initialProfile.name ? initialProfile.name[0]?.toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#111111]">
                {initialProfile.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#111111] text-white">
                PLAN PRO ACTIVO
              </span>
            </div>
            <p className="text-xs text-[#6b7280] mt-0.5 font-mono">
              Slug: {initialProfile.slug} · ID: {initialProfile.id.slice(0, 12)}…
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={billingConfig.href}
            className="product-button-secondary text-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gestionar plan</span>
          </Link>
          <Link
            href={appearanceConfig.href}
            className="product-button-primary text-xs"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Personalizar marca</span>
          </Link>
        </div>
      </div>

      {/* Grid of Section Cards (Derived from SETTINGS_NAV_ITEMS canonical config) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="product-card-surface p-5 hover:border-[#111111]/30 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className={getIconContainerClass(card.iconName)}>
                {renderOverviewIcon(card.iconName)}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#111111] flex items-center justify-between">
                  <span>{card.overviewTitle || card.title}</span>
                  {renderBadge(card, identity)}
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                  {card.overviewDescription || card.description}
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-medium text-[#111111] group-hover:translate-x-0.5 transition-transform">
              <span>{card.overviewActionLabel || 'Configurar'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
