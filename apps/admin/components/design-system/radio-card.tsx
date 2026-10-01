'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface RadioCardOption {
  value: string;
  title: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

interface RadioCardGroupProps {
  name: string;
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  disabled?: boolean;
}

export function RadioCardGroup({
  name,
  options,
  value,
  onChange,
  label,
  description,
  columns = 2,
  disabled = false,
}: RadioCardGroupProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <fieldset className="space-y-2 border-0 p-0 m-0" disabled={disabled}>
      {label && (
        <legend className="text-sm font-semibold text-slate-800 tracking-tight">
          {label}
        </legend>
      )}
      {description && (
        <p className="text-xs text-slate-500 mb-2">{description}</p>
      )}

      <div
        role="radiogroup"
        aria-label={label || name}
        className={`grid gap-3 ${colClass}`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <div
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : isSelected ? 0 : -1}
              onClick={() => {
                if (!isDisabled) onChange(option.value);
              }}
              onKeyDown={(e) => {
                if (isDisabled) return;
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onChange(option.value);
                }
              }}
              className={`relative flex flex-col justify-between p-4 rounded-lg text-left cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 ${
                isSelected
                  ? 'bg-[#f8f9fa] shadow-[0_0_0_1.5px_#111111]'
                  : 'bg-white shadow-cal-ring hover:bg-[#f8f9fa]/50'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#111111]">
                      {option.title}
                    </span>
                    {option.badge && (
                      <span className="text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-xs text-[#6b7280] leading-normal">
                      {option.description}
                    </p>
                  )}
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#e5e7eb] bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
