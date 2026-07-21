'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour } from '@repo/db';
import { updateReservationStatus } from '../actions/reservation';
import { 
  Search, Filter, Calendar, Users, DollarSign, MapPin, 
  Mail, Phone, MessageSquare, CreditCard, X, CheckCircle2, 
  Clock, XCircle, ChevronRight, User, ExternalLink 
} from 'lucide-react';

type ReservationWithTour = Reservation & { tour: Tour | null };

export function ReservasClient({ initialReservas }: { initialReservas: ReservationWithTour[] }) {
  const [reservas, setReservas] = useState(initialReservas);
  const [selectedReserva, setSelectedReserva] = useState<ReservationWithTour | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleStatusChange = (status: 'PENDING' | 'PAID' | 'CANCELLED') => {
    if (!selectedReserva) return;
    
    startTransition(async () => {
      const res = await updateReservationStatus(selectedReserva.id, status);
      if (res.success) {
        const updated = reservas.map(r => r.id === selectedReserva.id ? { ...r, status } : r);
        setReservas(updated);
        setSelectedReserva({ ...selectedReserva, status });
      }
    });
  };

  const formatPhoneForWhatsapp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, correo o tour..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B4354] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'PENDING', label: 'Pendientes' },
            { id: 'PAID', label: 'Pagadas' },
            { id: 'CANCELLED', label: 'Canceladas' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterStatus(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === pill.id
                  ? 'bg-[#0B4354] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Tour Reservado</th>
                <th className="px-6 py-4">Fecha Viaje</th>
                <th className="px-6 py-4 text-center">Pax</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado (Izipay)</th>
                <th className="px-6 py-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No se encontraron reservas con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {filteredReservas.map((reserva) => (
                <tr 
                  key={reserva.id} 
                  onClick={() => setSelectedReserva(reserva)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0B4354]/10 text-[#0B4354] font-bold flex items-center justify-center text-xs shrink-0">
                        {reserva.customerFirstName[0]}{reserva.customerLastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 group-hover:text-[#0B4354] transition-colors">
                          {reserva.customerFirstName} {reserva.customerLastName}
                        </div>
                        <div className="text-xs text-slate-500">{reserva.customerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {reserva.tour?.title || 'Tour no disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                    {new Date(reserva.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {reserva.pax}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                    ${reserva.totalPrice} <span className="text-xs font-normal text-slate-500">USD</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      reserva.status === 'PAID' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : reserva.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {reserva.status === 'PAID' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {reserva.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {reserva.status === 'CANCELLED' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      {reserva.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-[#0B4354] hover:bg-[#0B4354]/10 rounded-xl transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#062918] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-snug">
                    Detalle de Reserva #{selectedReserva.id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-emerald-300/80">
                    Realizada el {new Date(selectedReserva.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedReserva(null)}
                className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">
              
              {/* Status Change Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Estado de la Reserva</span>
                  <span className="text-sm font-bold text-slate-900">Modificar estado en tiempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isPending}
                    onClick={() => handleStatusChange('PENDING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedReserva.status === 'PENDING'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    PENDIENTE
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleStatusChange('PAID')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedReserva.status === 'PAID'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    PAGADA
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleStatusChange('CANCELLED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedReserva.status === 'CANCELLED'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    CANCELADA
                  </button>
                </div>
              </div>

              {/* Customer Contact Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-[#0B4354] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B4354]" /> Datos del Cliente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Nombre Completo</span>
                    <span className="font-bold text-slate-900 text-base">
                      {selectedReserva.customerFirstName} {selectedReserva.customerLastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Correo Electrónico</span>
                    <a 
                      href={`mailto:${selectedReserva.customerEmail}`}
                      className="font-medium text-[#0B4354] hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedReserva.customerEmail}
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Teléfono / WhatsApp</span>
                    <a 
                      href={`https://wa.me/${formatPhoneForWhatsapp(selectedReserva.customerPhone)}?text=Hola%20${encodeURIComponent(selectedReserva.customerFirstName)},%20te%20contactamos%20de%20Inca%20Bound%20respecto%20a%20tu%20reserva.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl mt-1 transition-colors shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedReserva.customerPhone}
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Hotel de Recojo</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {selectedReserva.pickupHotel || 'No especificado'}
                    </span>
                  </div>
                </div>
                {selectedReserva.specialRequirements && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500 block">Solicitudes Especiales</span>
                    <p className="text-xs italic text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 mt-1">
                      "{selectedReserva.specialRequirements}"
                    </p>
                  </div>
                )}
              </div>

              {/* Tour & Booking Info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-[#0B4354] uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0B4354]" /> Información del Tour
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <span className="text-xs text-slate-500 block">Tour Solicitado</span>
                    <span className="font-bold text-slate-900 text-base">
                      {selectedReserva.tour?.title || 'Tour Eliminado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Fecha Programada</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(selectedReserva.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Pasajeros (Pax)</span>
                    <span className="font-semibold text-slate-800">
                      {selectedReserva.pax} {selectedReserva.pax === 1 ? 'Persona' : 'Personas'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Precio Total</span>
                    <span className="font-extrabold text-[#0B4354] text-lg">
                      ${selectedReserva.totalPrice} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Izipay Reference Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-700">Izipay Token / Ref:</span>
                </div>
                <code className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px]">
                  {selectedReserva.paymentReference || 'Sin token'}
                </code>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedReserva(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
