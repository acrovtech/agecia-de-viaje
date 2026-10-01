'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

interface GuidedProgressProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
  className?: string;
}

export function GuidedProgress({
  steps,
  currentStepIndex,
  onStepClick,
  className = '',
}: GuidedProgressProps) {
  return (
    <nav
      aria-label="Progreso guiado"
      className={`border-b border-slate-200/80 pb-3 mb-6 overflow-x-auto no-scrollbar ${className}`}
    >
      <ol className="flex items-center gap-2 min-w-max">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStepClick(idx)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : isPassed
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200/80'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-slate-900'
                      : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                </span>
                <span>{step.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <div className="w-3 h-[1px] bg-slate-200" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
