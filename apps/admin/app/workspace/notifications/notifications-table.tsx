'use client';

import { useActionState } from 'react';
import { retryNotificationAction, type NotificationActionState } from './notifications-actions';

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
    <form action={formAction} className="inline-block">
      <input type="hidden" name="notificationId" value={notificationId} />
      <button
        type="submit"
        disabled={isPending}
        className="px-2.5 py-1 text-xs font-medium rounded bg-amber-100 text-amber-900 hover:bg-amber-200 disabled:opacity-50"
      >
        {isPending ? 'Reintentando...' : 'Reintentar'}
      </button>
      {state?.error && <span className="text-xs text-red-600 ml-2">{state.error}</span>}
      {state?.success && <span className="text-xs text-green-600 ml-2">Encolado</span>}
    </form>
  );
}

const stateStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-800 border-blue-200',
  SENT: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-800 border-rose-200',
  DEAD_LETTER: 'bg-slate-100 text-slate-800 border-slate-300',
};

export function NotificationsTable({
  notifications,
  canRetry,
}: {
  notifications: NotificationItem[];
  canRetry: boolean;
}) {
  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        No hay notificaciones transaccionales registradas recientemente.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b bg-slate-50 text-slate-600 text-xs uppercase font-medium">
            <th className="py-3 px-3">Tipo / Asunto</th>
            <th className="py-3 px-3">Destinatario</th>
            <th className="py-3 px-3">Estado</th>
            <th className="py-3 px-3">Intentos</th>
            <th className="py-3 px-3">Último intento / Envío</th>
            <th className="py-3 px-3">Error</th>
            {canRetry && <th className="py-3 px-3 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {notifications.map((item) => {
            const isRetryable =
              canRetry && (item.state === 'FAILED' || item.state === 'DEAD_LETTER');

            return (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-3">
                  <div className="font-medium text-slate-900">{item.subject}</div>
                  <div className="text-xs text-slate-500 font-mono">{item.kind}</div>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-700">
                  {item.recipient}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      stateStyles[item.state] || 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.state}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-slate-600">
                  {item.attempts} / {item.maxAttempts}
                </td>
                <td className="py-3 px-3 text-xs text-slate-500">
                  {item.sentAt
                    ? `Enviado: ${new Date(item.sentAt).toLocaleString()}`
                    : item.lastAttemptAt
                      ? `Intento: ${new Date(item.lastAttemptAt).toLocaleString()}`
                      : `Creado: ${new Date(item.createdAt).toLocaleString()}`}
                </td>
                <td className="py-3 px-3 text-xs text-rose-700 font-mono">
                  {item.failureCode || '-'}
                </td>
                {canRetry && (
                  <td className="py-3 px-3 text-right">
                    {isRetryable ? <RetryButton notificationId={item.id} /> : <span className="text-xs text-slate-400">-</span>}
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
