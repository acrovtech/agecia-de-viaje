'use client';

import { useState, useTransition } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  UserCheck, 
  Key, 
  Terminal,
  Globe,
  Clock
} from 'lucide-react';
import { getAuditLogsAction } from '@/app/actions/audit';
import { getRoleMetadata } from '@/lib/roles';

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

interface LogsClientProps {
  initialData: {
    success: boolean;
    logs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    actionCounts: { action: string; count: number }[];
  };
}

export function LogsClient({ initialData }: LogsClientProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialData.logs || []);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [actionCounts, setActionCounts] = useState(initialData.actionCounts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [isPending, startTransition] = useTransition();
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

  const fetchLogs = (page = 1) => {
    startTransition(async () => {
      const res = await getAuditLogsAction({
        page,
        limit: pagination.limit,
        search: searchQuery,
        action: actionFilter,
        entity: entityFilter,
      });

      if (res.success) {
        setLogs(res.logs as any);
        setPagination(res.pagination);
        if (res.actionCounts.length > 0) {
          setActionCounts(res.actionCounts);
        }
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('LOCKED') || action.includes('BLOCKED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
          <Lock className="w-3 h-3 text-red-600" />
          {action}
        </span>
      );
    }
    if (action.includes('FAILED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {action}
        </span>
      );
    }
    if (action.includes('SUCCESS') || action.includes('ACTIVATED') || action.includes('UNLOCKED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {action}
        </span>
      );
    }
    if (action.includes('REVOKE') || action.includes('DELETED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Key className="w-3 h-3 text-purple-600" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
        <Activity className="w-3 h-3 text-slate-600" />
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-200 border border-rose-800">
              SUPERADMIN ROOT
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-700" />
              Logs de Auditoría Forense
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico inmutable de seguridad, intentos de acceso, modificaciones de privilegios e incidentes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLogs(pagination.page)}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
          <span>Actualizar Logs</span>
        </button>
      </div>

      {/* METRICAS RAPIDAS DE EVENTOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Total Eventos Registrados</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{pagination.total}</p>
        </div>

        {actionCounts.slice(0, 3).map((item, idx) => (
          <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 truncate" title={item.action}>
              {item.action}
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{item.count}</p>
          </div>
        ))}
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por usuario, IP, acción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="ALL">Todas las Acciones</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="ACCOUNT_LOCKED_BRUTE_FORCE">ACCOUNT_LOCKED_BRUTE_FORCE</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_UPDATED">USER_UPDATED</option>
              <option value="USER_ACTIVATED">USER_ACTIVATED</option>
              <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
              <option value="REVOKE_ALL_SESSIONS">REVOKE_ALL_SESSIONS</option>
              <option value="USER_DELETED">USER_DELETED</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="ALL">Todas las Entidades</option>
              <option value="User">User</option>
              <option value="Reservation">Reservation</option>
              <option value="Tour">Tour</option>
              <option value="Transfer">Transfer</option>
            </select>

            <button
              type="submit"
              disabled={isPending}
              className="px-3.5 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE AUDITORÍA */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Acción</th>
                <th className="p-3.5">Actor / Usuario</th>
                <th className="p-3.5">Entidad Afectada</th>
                <th className="p-3.5">Red / IP</th>
                <th className="p-3.5 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
                    No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const roleMeta = log.user ? getRoleMetadata(log.user.role) : null;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Timestamp */}
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-sans">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* 2. Acción */}
                      <td className="p-3.5 font-sans whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* 3. Usuario */}
                      <td className="p-3.5 font-sans">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                                {log.user.name || log.user.email}
                              </p>
                              <span
                                className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  roleMeta?.badgeClass || 'bg-slate-200'
                                }`}
                              >
                                {log.user.role}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Sistema / Anónimo</span>
                        )}
                      </td>

                      {/* 4. Entidad */}
                      <td className="p-3.5 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{log.entity}</span>
                          {log.entityId && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{log.entityId.slice(-6)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. IP & Telemetría */}
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                      </td>

                      {/* 6. Ver Detalles */}
                      <td className="p-3.5 text-right font-sans">
                        {log.details ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPayload(log.details)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            <Code className="w-3 h-3" />
                            <span>Payload</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-sans">
            <div>
              Página <span className="font-bold">{pagination.page}</span> de{' '}
              <span className="font-bold">{pagination.totalPages}</span> ({pagination.total} eventos)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || isPending}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || isPending}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL INSPECTOR DE PAYLOAD JSON */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 w-full max-w-lg overflow-hidden text-xs">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="font-bold font-mono text-xs text-slate-200">
                  Inspección de Payload Forense
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto font-mono text-[11px] bg-slate-900/90 leading-relaxed text-emerald-300">
              <pre>{JSON.stringify(selectedPayload, null, 2)}</pre>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
