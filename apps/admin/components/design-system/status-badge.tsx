'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileEdit,
  Send,
  HelpCircle,
} from 'lucide-react';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
}

const statusMap: Record<
  string,
  { label: string; variant: StatusVariant; icon: React.ComponentType<{ className?: string }> }
> = {
  // Reservations / Operations
  PENDING: { label: 'Pendiente', variant: 'warning', icon: Clock },
  CONFIRMED: { label: 'Confirmada', variant: 'success', icon: CheckCircle2 },
  IN_PROGRESS: { label: 'En curso', variant: 'info', icon: Clock },
  COMPLETED: { label: 'Completada', variant: 'success', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelada', variant: 'danger', icon: XCircle },

  // Payments (FROZEN / PROVIDER DEFERRED)
  PAID: { label: 'Pagada', variant: 'success', icon: CheckCircle2 },
  PARTIALLY_PAID: { label: 'Pago parcial', variant: 'warning', icon: Clock },
  REFUNDED: { label: 'Reembolsada', variant: 'neutral', icon: AlertCircle },
  FAILED: { label: 'Fallido', variant: 'danger', icon: XCircle },

  // Notifications
  PROCESSING: { label: 'En proceso', variant: 'info', icon: Clock },
  SENT: { label: 'Enviado', variant: 'success', icon: Send },
  DEAD_LETTER: { label: 'Agotado (Dead Letter)', variant: 'danger', icon: XCircle },

  // Publication
  PUBLISHED: { label: 'Publicado', variant: 'success', icon: CheckCircle2 },
  DRAFT: { label: 'Borrador', variant: 'neutral', icon: FileEdit },

  // Active / Inactive
  ACTIVE: { label: 'Activo', variant: 'success', icon: CheckCircle2 },
  INACTIVE: { label: 'Inactivo', variant: 'neutral', icon: XCircle },
};

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function StatusBadge({ status, label, variant, size = 'sm' }: StatusBadgeProps) {
  const meta = statusMap[status.toUpperCase()] || {
    label: status,
    variant: variant || 'neutral',
    icon: HelpCircle,
  };

  const resolvedVariant = variant || meta.variant;
  const resolvedLabel = label || meta.label;
  const Icon = meta.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs font-medium gap-1'
      : 'px-2.5 py-1 text-xs font-semibold gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantClasses[resolvedVariant]} ${sizeClasses}`}
      role="status"
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} aria-hidden="true" />
      <span>{resolvedLabel}</span>
    </span>
  );
}
