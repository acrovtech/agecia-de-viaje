'use client';

import React from 'react';
import { LayoutGrid, Compass } from 'lucide-react';

export type EditorMode = 'complete' | 'guided';

interface EditorModeSwitchProps {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
  className?: string;
}

export function EditorModeSwitch({
  mode,
  onChange,
  className = '',
}: EditorModeSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Modo de edición"
      className={`inline-flex items-center rounded-lg bg-[#f3f4f6] p-0.5 border border-[#e5e7eb] text-xs ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'complete'}
        onClick={() => onChange('complete')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
          mode === 'complete'
            ? 'bg-white text-[#111111] border border-[#e5e7eb] shadow-product-card font-medium'
            : 'text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]/50'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5 text-[#6b7280]" aria-hidden="true" />
        <span>Completo</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mode === 'guided'}
        onClick={() => onChange('guided')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
          mode === 'guided'
            ? 'bg-white text-[#111111] border border-[#e5e7eb] shadow-product-card font-medium'
            : 'text-[#6b7280] hover:text-[#111111] hover:bg-[#e5e7eb]/50'
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-[#6b7280]" aria-hidden="true" />
        <span>Configuración Guiada</span>
      </button>
    </div>
  );
}
