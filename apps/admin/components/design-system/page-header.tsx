'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badges,
  actions,
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`mb-6 lg:mb-8 space-y-2.5 ${className}`}>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.125rem] font-semibold text-[#111111] truncate">
              {title}
            </h1>
            {badges}
          </div>
          {description && (
            <p className="text-sm text-[#6b7280] max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </header>
  );
}
