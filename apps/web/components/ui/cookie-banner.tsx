'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const COOKIE_STORAGE_KEY = 'ib_cookie_consent';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore if localStorage is unavailable
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify({ essential: true, analytics: true, timestamp: Date.now() }));
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify({ essential: true, analytics: false, timestamp: Date.now() }));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Consentimiento de Cookies"
      className="fixed bottom-4 left-3 sm:left-4 right-auto w-[75%] max-w-[310px] sm:max-w-sm sm:w-auto z-40 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="bg-zinc-900/80 backdrop-blur-xl text-zinc-200 p-3 sm:p-4 rounded-2xl border border-white/10 shadow-xl shadow-black/40 text-[11px] sm:text-xs">
        <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
          <p className="text-zinc-300 leading-snug sm:leading-relaxed pr-1">
            Usamos cookies para optimizar tu experiencia.{' '}
            <Link
              href="/cookies"
              className="text-white underline underline-offset-2 hover:text-zinc-300 transition-colors font-medium whitespace-nowrap"
            >
              Más info
            </Link>
          </p>
          <button
            onClick={handleAcceptEssential}
            aria-label="Cerrar aviso"
            className="text-zinc-400 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-[11px] sm:text-xs rounded-lg transition-colors cursor-pointer text-center"
          >
            Aceptar
          </button>
          <button
            onClick={handleAcceptEssential}
            className="py-1.5 px-2 bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-medium text-[11px] sm:text-xs rounded-lg transition-colors border border-white/10 cursor-pointer text-center whitespace-nowrap"
          >
            Solo necesarias
          </button>
        </div>
      </div>
    </aside>
  );
}
