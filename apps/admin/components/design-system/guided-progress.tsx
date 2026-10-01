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
      className={`border-b border-[#e5e7eb] pb-3 mb-6 overflow-x-auto no-scrollbar ${className}`}
    >
      <ol className="flex items-center gap-1.5 min-w-max">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <li key={step.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onStepClick(idx)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#111111] text-white shadow-none font-medium'
                    : isPassed
                      ? 'bg-[#f3f4f6] text-[#111111] hover:bg-[#e5e7eb]'
                      : 'text-[#6b7280] hover:text-[#111111] hover:bg-[#f8f9fa]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                    isCurrent
                      ? 'bg-white text-[#111111]'
                      : isPassed
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#e5e7eb] text-[#6b7280]'
                  }`}
                >
                  {isPassed ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : idx + 1}
                </span>
                <span>{step.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <div className="w-2.5 h-[1px] bg-[#e5e7eb]" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
