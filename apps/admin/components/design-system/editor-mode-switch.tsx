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
      className={`inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'complete'}
        onClick={() => onChange('complete')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
          mode === 'complete'
            ? 'bg-white text-slate-900 shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        <span>Completo</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mode === 'guided'}
        onClick={() => onChange('guided')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
          mode === 'guided'
            ? 'bg-white text-slate-900 shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        <span>Configuración Guiada</span>
      </button>
    </div>
  );
}
