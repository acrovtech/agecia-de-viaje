'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import type { TourTranslationItem } from '../../lib/catalog-content';

export const LOCALE_META: Record<string, { label: string; flag: string; code: string }> = {
  es: { label: 'Español', flag: '🇪🇸', code: 'ES' },
  en: { label: 'English', flag: '🇬🇧', code: 'EN' },
  pt: { label: 'Português', flag: '🇧🇷', code: 'PT' },
  fr: { label: 'Français', flag: '🇫🇷', code: 'FR' },
  de: { label: 'Deutsch', flag: '🇩🇪', code: 'DE' },
  it: { label: 'Italiano', flag: '🇮🇹', code: 'IT' },
};

interface TourLanguageNavProps {
  tourId?: string; // 'new' or tour ID
  defaultLocale: string;
  enabledLocales: Array<{ locale: string; isDefault: boolean; enabled: boolean }>;
  selectedLocale: string;
  translations?: TourTranslationItem[];
  currentSourceRevision?: string;
}

export function TourLanguageNav({
  tourId,
  defaultLocale,
  enabledLocales,
  selectedLocale,
  translations = [],
  currentSourceRevision,
}: TourLanguageNavProps) {
  const isNew = !tourId || tourId === 'new';

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/90 pb-3">
        {enabledLocales.map((loc) => {
          const meta = LOCALE_META[loc.locale] || {
            label: loc.locale.toUpperCase(),
            flag: '🌐',
            code: loc.locale.toUpperCase(),
          };
          const isDef = loc.locale === defaultLocale;
          const isSelected = selectedLocale === loc.locale;

          if (isDef) {
            // Default locale
            if (isNew) {
              return (
                <div
                  key={loc.locale}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow-2xs"
                >
                  <span className="text-sm">{meta.flag}</span>
                  <span>
                    {meta.code} {meta.label}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-300 ml-1">
                    Principal
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={loc.locale}
                href={`/catalog/tours?edit=${encodeURIComponent(tourId)}`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-1'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span className="text-sm">{meta.flag}</span>
                <span>
                  {meta.code} {meta.label}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold ml-1 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Principal
                </span>
              </Link>
            );
          }

          // Secondary locale in NEW tour: disabled tab
          if (isNew) {
            return (
              <div
                key={loc.locale}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/60 cursor-not-allowed select-none opacity-60"
                title="Guarda primero el tour en Español para crear versiones en otros idiomas."
              >
                <span className="text-sm">{meta.flag}</span>
                <span>
                  {meta.code} {meta.label}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">No disponible</span>
              </div>
            );
          }

          // Secondary locale in EXISTING tour
          const existingTrans = translations.find((t) => t.locale === loc.locale);
          const isStale = Boolean(
            existingTrans &&
              (existingTrans.isStale ||
                !existingTrans.sourceRevision ||
                (currentSourceRevision &&
                  existingTrans.sourceRevision !== currentSourceRevision))
          );

          let statusLabel = 'No creada';
          let statusBadgeClass = isSelected
            ? 'bg-slate-800 text-slate-200'
            : 'bg-slate-100 text-slate-600';

          if (existingTrans) {
            if (isStale) {
              statusLabel = 'Desactualizada';
              statusBadgeClass = isSelected
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-amber-100 text-amber-900 font-semibold border border-amber-300/80';
            } else {
              statusLabel = 'Borrador';
              statusBadgeClass = isSelected
                ? 'bg-slate-800 text-slate-200'
                : 'bg-slate-100 text-slate-700';
            }
          }

          return (
            <Link
              key={loc.locale}
              href={`/catalog/tours?edit=${encodeURIComponent(tourId)}&locale=${encodeURIComponent(loc.locale)}`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                isSelected
                  ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-1'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span className="text-sm">{meta.flag}</span>
              <span>
                {meta.code} {meta.label}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ml-1 ${statusBadgeClass}`}
              >
                {statusLabel}
              </span>
            </Link>
          );
        })}
      </div>

      {isNew && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            Guarda primero el tour en{' '}
            <strong>
              {LOCALE_META[defaultLocale]?.label || defaultLocale.toUpperCase()}
            </strong>{' '}
            para crear versiones en otros idiomas.
          </span>
        </div>
      )}
    </div>
  );
}
