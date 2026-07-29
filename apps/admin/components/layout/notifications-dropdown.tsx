'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, Clock, XCircle, ArrowRight, CheckCheck, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRecentNotificationsAction } from '@/app/actions/reservation';

export type NotificationItem = {
  id: string;
  customerName: string;
  customerEmail: string;
  tourTitle: string;
  pax: number;
  totalPrice: number;
  status: string;
  createdAt: string;
};

export function NotificationsDropdown({ initialNotifications = [] }: { initialNotifications?: NotificationItem[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cargar IDs leídos desde localStorage al montar y habilitar renderizado cliente
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('incabound_read_notifications');
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading notification read status:", e);
    }
  }, []);

  // Función para refrescar las notificaciones recientes desde la Server Action
  const refreshNotifications = useCallback(async () => {
    const res = await getRecentNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
    }
  }, []);

  // Polling automático cada 20 segundos para recibir nuevas reservas en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Refrescar inmediatamente al abrir el dropdown
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      refreshNotifications();
    }
  };

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('incabound_read_notifications', JSON.stringify(allIds));
    } catch (e) {
      console.error("Error saving read status:", e);
    }
  };

  // Marcar una como leída y navegar a la reserva
  const handleItemClick = (id: string) => {
    if (!readIds.includes(id)) {
      const nextRead = [...readIds, id];
      setReadIds(nextRead);
      try {
        localStorage.setItem('incabound_read_notifications', JSON.stringify(nextRead));
      } catch (e) {
        console.error("Error saving read status:", e);
      }
    }
    setIsOpen(false);
    router.push(`/reservas/${id}`);
  };

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Botón Campana con Badge de Contador */}
      <button 
        type="button" 
        onClick={handleToggle}
        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative cursor-pointer focus:outline-none" 
        title="Notificaciones de Reservas"
      >
        <Bell className="w-4 h-4" />
        
        {isMounted && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Panel de Notificaciones (Responsive Full Width en Mobile) */}
      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-auto sm:mt-3.5 w-auto sm:w-96 rounded-xl bg-white border border-slate-200/90 shadow-2xl text-slate-800 p-0 z-50 animate-in fade-in-50 zoom-in-95 duration-100 font-sans text-xs overflow-hidden">
          
          {/* Encabezado del Popover */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs tracking-tight text-white">Notificaciones de Reservas</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] text-slate-400 hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={12} />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* Lista de Notificaciones Recientes con Scroll Estilizado Fino */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="font-semibold text-slate-600">No hay reservas recientes.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n.id)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                      isUnread ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Indicador lateral no leído */}
                    {isUnread && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}

                    {/* Icono de Estado */}
                    <div className="mt-0.5 shrink-0">
                      {n.status === 'PAID' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 size={13} />
                        </div>
                      ) : n.status === 'PENDING' ? (
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Clock size={13} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                          <XCircle size={13} />
                        </div>
                      )}
                    </div>

                    {/* Detalles */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-slate-900 truncate text-xs">{n.customerName}</span>
                        <span className="font-extrabold text-[#062918] shrink-0 text-xs">${n.totalPrice.toFixed(2)} USD</span>
                      </div>
                      
                      <p className="text-[11px] text-slate-600 font-medium truncate mb-1">
                        {n.tourTitle} ({n.pax} {n.pax === 1 ? 'pax' : 'pax'})
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>
                          {new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`font-semibold px-1.5 py-0.5 rounded-xs ${
                          n.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {n.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Pie de Popover */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              href="/reservas"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span>Ver todas las reservas</span>
              <ArrowRight size={13} />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
