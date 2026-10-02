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
      className={`sticky bottom-0 left-0 right-0 -mx-4 -mb-5 sm:-mx-6 sm:-mb-6 md:-mx-8 md:-mb-8 px-4 sm:px-6 md:px-8 py-3 bg-white/95 backdrop-blur-xs border-t border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3 shadow-[0_-1px_3px_rgba(0,0,0,0.03)] z-30 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {error ? (
          <p role="alert" className="text-xs text-rose-600 font-medium truncate">
            {error}
          </p>
        ) : isSaved ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#166534] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cambios guardados con éxito</span>
          </span>
        ) : (
          <span className="text-xs text-[#6b7280]">
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
            className="product-button-secondary"
          >
            {cancelLabel}
          </button>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="product-button-primary"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isPending ? 'Guardando…' : saveLabel}</span>
        </button>
      </div>
    </div>
  );
}
