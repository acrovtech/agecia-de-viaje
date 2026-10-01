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
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
        <span>{isPending ? 'Reintentando…' : 'Reintentar'}</span>
      </button>
      {state?.error && (
        <span className="text-[11px] text-rose-600 font-medium">{state.error}</span>
      )}
      {state?.success && (
        <span className="text-[11px] text-emerald-600 font-medium">Encolado</span>
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
      <div className="py-12 text-center text-slate-400 text-xs">
        No hay notificaciones transaccionales registradas recientemente en tu agencia.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
            <th className="py-3 px-4 font-semibold">Tipo / Asunto</th>
            <th className="py-3 px-4 font-semibold">Destinatario</th>
            <th className="py-3 px-4 font-semibold">Estado Outbox</th>
            <th className="py-3 px-4 font-semibold">Intentos</th>
            <th className="py-3 px-4 font-semibold">Último Evento</th>
            <th className="py-3 px-4 font-semibold">Código Error</th>
            {canRetry && <th className="py-3 px-4 font-semibold text-right">Acción</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {notifications.map((item) => {
            const isRetryable =
              canRetry && (item.state === 'FAILED' || item.state === 'DEAD_LETTER');

            return (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 text-sm max-w-sm truncate">
                    {item.subject}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {item.kind} · {item.audience}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                  {item.recipient}
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={item.state} />
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-mono font-medium">
                  {item.attempts} / {item.maxAttempts}
                </td>
                <td className="py-3.5 px-4 text-slate-500 text-[11px]">
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
                <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                  {item.failureCode || '-'}
                </td>
                {canRetry && (
                  <td className="py-3.5 px-4 text-right">
                    {isRetryable ? (
                      <RetryButton notificationId={item.id} />
                    ) : (
                      <span className="text-slate-300 text-[11px]">-</span>
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
