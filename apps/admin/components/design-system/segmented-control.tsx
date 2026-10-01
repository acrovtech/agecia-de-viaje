'use client';

import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/70 select-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const paddingClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm';

        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={isSelected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-md font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${paddingClass} ${
              isSelected
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
