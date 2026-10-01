'use client';

import React from 'react';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f8f9fa]/50 ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-white shadow-cal-ring flex items-center justify-center text-[#6b7280] mb-3">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-[#111111]">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-[#6b7280] max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Ocurrió un problema',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`p-4 sm:p-5 rounded-xl border border-rose-200 bg-rose-50/60 text-left flex items-start gap-3.5 ${className}`}
    >
      <div className="p-1 rounded-lg bg-rose-100 text-rose-600 shrink-0 mt-0.5">
        <AlertCircle className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-xs sm:text-sm font-semibold text-rose-900">
          {title}
        </h4>
        <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 mt-2 underline underline-offset-2 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Volver a intentar</span>
          </button>
        )}
      </div>
    </div>
  );
}
