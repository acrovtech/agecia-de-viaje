'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour } from '@repo/db';
import Link from 'next/link';
import { Search, Calendar, CheckCircle2, Clock, XCircle, ArrowRight, Trash2 } from 'lucide-react';
import { deleteReservationsAction } from '@/app/actions/reservation';

type ReservationWithTour = Reservation & { tour: Tour | null };

export function ReservasClient({ initialReservas }: { initialReservas: ReservationWithTour[] }) {
  const [reservas, setReservas] = useState(initialReservas);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const filteredReservas = reservas.filter((reserva) => {
    const matchesStatus = filterStatus === 'ALL' || reserva.status === filterStatus;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      reserva.customerFirstName.toLowerCase().includes(searchLower) ||
      reserva.customerLastName.toLowerCase().includes(searchLower) ||
      reserva.customerEmail.toLowerCase().includes(searchLower) ||
      (reserva.tour?.title && reserva.tour.title.toLowerCase().includes(searchLower));
    
    return matchesStatus && matchesSearch;
  });

  const isAllSelected = filteredReservas.length > 0 && filteredReservas.every(r => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReservas.map(r => r.id));
    }
  };

  const toggleSelectReserva = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar las ${selectedIds.length} reservas seleccionadas?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteReservationsAction(selectedIds);
      if (res.success) {
        setReservas(prev => prev.filter(r => !selectedIds.includes(r.id)));
        setSelectedIds([]);
      } else {
        alert(res.error || 'Ocurrió un error al eliminar las reservas.');
      }
    });
  };

  return (
    <div className="space-y-4 font-sans select-none">
      
      {/* 1. Header Estilo Shopify Admin */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f]">Reservas</h1>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-xs text-slate-500 font-medium">
            {reservas.length} {reservas.length === 1 ? 'Reserva recibida' : 'Reservas recibidas'}
          </span>
        </div>
      </div>

      {/* 2. Tabs y Búsqueda Estilo Shopify Polaris */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        
        {/* Tabs de estado */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'Todas', count: reservas.length },
            { id: 'PAID', label: 'Pagadas', count: reservas.filter(r => r.status === 'PAID').length },
            { id: 'PENDING', label: 'Pendientes', count: reservas.filter(r => r.status === 'PENDING').length },
            { id: 'CANCELLED', label: 'Canceladas', count: reservas.filter(r => r.status === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label} <span className="opacity-75 font-normal ml-1">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Input de Búsqueda */}
        <div className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, correo o tour..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>

      </div>

      {filteredReservas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <p className="font-semibold text-slate-600">No se encontraron reservas con los filtros aplicados.</p>
        </div>
      ) : (
        /* 3. VISTA TABLA COMPLETA SHOPIFY POLARIS (CABECERAS CENTRADAS + SELECCIÓN MÚLTIPLE Y BORRAR TODOS) */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <colgroup>
                <col className="w-12" />
                <col className="w-56" />
                <col className="w-auto" />
                <col className="w-32" />
                <col className="w-16" />
                <col className="w-32" />
                <col className="w-32" />
                <col className="w-32" />
              </colgroup>
              <thead>
                {selectedIds.length > 0 ? (
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 text-xs font-medium animate-in fade-in duration-150">
                    <th colSpan={8} className="px-4 py-2.5 text-left">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 pr-2 border-r border-slate-300/80">
                          <input 
                            type="checkbox" 
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                          />
                          <span className="font-semibold text-slate-900 text-xs">
                            {selectedIds.length} {selectedIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>{isPending ? 'Borrando...' : 'Borrar todos'}</span>
                          </button>
                        </div>
                      </div>
                    </th>
                  </tr>
                ) : (
                  <tr className="bg-[#F7F7F7] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3 text-center w-12">
                      <input 
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-center">CLIENTE</th>
                    <th className="px-4 py-3 text-center">TOUR RESERVADO</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">FECHA VIAJE</th>
                    <th className="px-4 py-3 text-center">PAX</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">TOTAL</th>
                    <th className="px-4 py-3 text-center">ESTADO</th>
                    <th className="px-4 py-3 text-center">DETALLE</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservas.map((reserva) => {
                  const isSelected = selectedIds.includes(reserva.id);
                  return (
                    <tr 
                      key={reserva.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectReserva(reserva.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-[#2f2f2f] truncate">{reserva.customerFirstName} {reserva.customerLastName}</div>
                        <div className="text-[11px] text-slate-400 truncate">{reserva.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-[#2f2f2f] uppercase truncate">
                        {reserva.tour?.title || 'TOUR INCA BOUND'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 font-medium whitespace-nowrap">
                        {new Date(reserva.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {reserva.pax}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-[#2f2f2f] whitespace-nowrap">
                        ${reserva.totalPrice.toFixed(2)} USD
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {reserva.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Pagado
                          </span>
                        )}
                        {reserva.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> Pendiente
                          </span>
                        )}
                        {reserva.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={12} /> Cancelado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link
                          href={`/reservas/${reserva.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBEBEB] hover:bg-slate-900 hover:text-white text-[#2f2f2f] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>Ver Detalle</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
