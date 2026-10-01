'use client';

import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface StickySaveBarProps {
  isPending: boolean;
  isSaved?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  error?: string | null;
  className?: string;
}

export function StickySaveBar({
  isPending,
  isSaved = false,
  saveLabel = 'Guardar cambios',
  cancelLabel = 'Cancelar',
  onCancel,
  error,
  className = '',
}: StickySaveBarProps) {
  return (
    <div
      className={`sticky bottom-0 left-0 right-0 -mx-4 -mb-5 sm:-mx-6 sm:-mb-6 md:-mx-8 md:-mb-8 px-4 sm:px-6 md:px-8 py-3.5 bg-white/95 backdrop-blur-xs border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-md z-30 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {error ? (
          <p role="alert" className="text-xs text-rose-600 font-medium truncate">
            {error}
          </p>
        ) : isSaved ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cambios guardados con éxito</span>
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {isPending ? 'Guardando información…' : 'Cambios sin guardar'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {onCancel && (
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{isPending ? 'Guardando…' : saveLabel}</span>
        </button>
      </div>
    </div>
  );
}
