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
      className={`inline-flex items-center rounded-lg bg-[#f3f4f6] p-0.5 border border-[#e5e7eb] select-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const paddingClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm';

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
                ? 'bg-white text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-semibold'
                : 'text-[#6b7280] hover:text-[#111111] hover:bg-black/[0.03]'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-[#f3f4f6] text-[#111111]'
                    : 'bg-[#e5e7eb]/80 text-[#6b7280]'
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
