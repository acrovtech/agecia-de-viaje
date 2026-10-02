'use client';

import React, { useActionState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Send, XCircle } from 'lucide-react';
import { retryNotificationAction, type NotificationActionState } from './notifications-actions';
import { StatusBadge } from '../../../components/design-system/status-badge';

export interface NotificationItem {
  id: string;
  agencyId: string;
  kind: string;
  audience: string;
  recipient: string;
  subject: string;
  state: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'DEAD_LETTER';
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  sentAt: string | null;
  failureCode: string | null;
  providerMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

function RetryButton({ notificationId }: { notificationId: string }) {
  const [state, formAction, isPending] = useActionState<NotificationActionState | null, FormData>(
    retryNotificationAction,
    null,
  );

  return (
    <form action={formAction} className="inline-flex items-center gap-1.5">
      <input type="hidden" name="notificationId" value={notificationId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#f3f4f6] text-[#111111] border border-[#e5e7eb] hover:bg-[#e5e7eb] transition-colors disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
        <span>{isPending ? 'Reintentando…' : 'Reintentar'}</span>
      </button>
      {state?.error && (
        <span className="text-[11px] text-[#dc2626] font-medium">{state.error}</span>
      )}
      {state?.success && (
        <span className="text-[11px] text-[#16a34a] font-medium">Encolado</span>
      )}
    </form>
  );
}

export function NotificationsTable({
  notifications,
  canRetry,
}: {
  notifications: NotificationItem[];
  canRetry: boolean;
}) {
  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center text-[#898989] text-xs">
        No hay notificaciones transaccionales registradas recientemente en tu agencia.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
            <th className="py-2.5 px-4 font-medium">Tipo / Asunto</th>
            <th className="py-2.5 px-4 font-medium">Destinatario</th>
            <th className="py-2.5 px-4 font-medium">Estado Outbox</th>
            <th className="py-2.5 px-4 font-medium">Intentos</th>
            <th className="py-2.5 px-4 font-medium">Último Evento</th>
            <th className="py-2.5 px-4 font-medium">Código Error</th>
            {canRetry && <th className="py-2.5 px-4 font-medium text-right">Acción</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {notifications.map((item) => {
            const isRetryable =
              canRetry && (item.state === 'FAILED' || item.state === 'DEAD_LETTER');

            return (
              <tr key={item.id} className="product-data-row">
                <td className="py-3.5 px-4">
                  <div className="font-medium text-[#111111] text-sm max-w-sm truncate">
                    {item.subject}
                  </div>
                  <div className="text-[11px] text-[#6b7280] font-mono mt-0.5">
                    {item.kind} · {item.audience}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-[#374151]">
                  {item.recipient}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={item.state} />
                </td>
                <td className="py-3.5 px-4 text-[#374151] font-mono font-medium">
                  {item.attempts} / {item.maxAttempts}
                </td>
                <td className="py-3.5 px-4 text-[#6b7280] text-[11px]">
                  {item.sentAt
                    ? `Enviado: ${new Date(item.sentAt).toLocaleString('es-PE', {
                        timeZone: 'America/Lima',
                      })}`
                    : item.lastAttemptAt
                      ? `Intento: ${new Date(item.lastAttemptAt).toLocaleString('es-PE', {
                          timeZone: 'America/Lima',
                        })}`
                      : `Creado: ${new Date(item.createdAt).toLocaleString('es-PE', {
                          timeZone: 'America/Lima',
                        })}`}
                </td>
                <td className="py-3.5 px-4 font-mono text-[#6b7280] text-[11px]">
                  {item.failureCode || '-'}
                </td>
                {canRetry && (
                  <td className="py-3.5 px-4 text-right">
                    {isRetryable ? (
                      <RetryButton notificationId={item.id} />
                    ) : (
                      <span className="text-[#898989] text-[11px]">-</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
