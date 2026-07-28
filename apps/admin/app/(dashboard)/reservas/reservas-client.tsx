'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour } from '@repo/db';
import { updateReservationStatus } from '../../actions/reservation';
import { 
  Search, Calendar, MapPin, 
  Mail, Phone, MessageSquare, X, CheckCircle2, 
  Clock, XCircle, User, Users, FileText, ExternalLink, ShieldCheck 
} from 'lucide-react';

type ReservationWithTour = Reservation & { tour: Tour | null };

export function ReservasClient({ initialReservas }: { initialReservas: ReservationWithTour[] }) {
  const [reservas, setReservas] = useState(initialReservas);
  const [selectedReserva, setSelectedReserva] = useState<ReservationWithTour | null>(null);
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

  // Extraer pasajeros de specialRequirements si existe
  const parsePassengerList = (requirements: string | null) => {
    if (!requirements) return [];
    const match = requirements.match(/\[Pasajeros:\s*(.*?)\]/);
    if (!match || !match[1]) return [];
    const paxParts = match[1].split('|').map(p => p.trim());
    return paxParts.map(part => {
      // Pax 1: Juan Perez (DNI: 72839401)
      const nameMatch = part.match(/Pax\s*\d+:\s*([^(]+)/);
      const docMatch = part.match(/\(([^:]+):\s*([^)]+)\)/);
      const nameVal = nameMatch && nameMatch[1] ? nameMatch[1].trim() : part;
      const docTypeVal = docMatch && docMatch[1] ? docMatch[1].trim() : 'Documento';
      const docNumVal = docMatch && docMatch[2] ? docMatch[2].trim() : 'N/A';
      return {
        name: nameVal,
        docType: docTypeVal,
        docNumber: docNumVal,
      };
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
        /* 3. VISTA TABLA COMPLETA SHOPIFY POLARIS */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-12" />
                <col className="w-56" />
                <col className="w-auto" />
                <col className="w-32" />
                <col className="w-20" />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-28" />
              </colgroup>
              <thead>
                {selectedIds.length > 0 ? (
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[#2f2f2f] text-xs font-medium animate-in fade-in duration-150">
                    <th colSpan={8} className="px-4 py-2.5">
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-900">{selectedIds.length} seleccionadas</span>
                      </div>
                    </th>
                  </tr>
                ) : (
                  <tr className="bg-[#F7F7F7] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3 text-center">
                      <input 
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">CLIENTE</th>
                    <th className="px-4 py-3">TOUR RESERVADO</th>
                    <th className="px-4 py-3">FECHA VIAJE</th>
                    <th className="px-4 py-3 text-center">PAX</th>
                    <th className="px-4 py-3 text-right">TOTAL</th>
                    <th className="px-4 py-3 text-center">ESTADO</th>
                    <th className="px-4 py-3 text-right">DETALLE</th>
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
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#2f2f2f] truncate">{reserva.customerFirstName} {reserva.customerLastName}</div>
                        <div className="text-[11px] text-slate-400 truncate">{reserva.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#2f2f2f] uppercase truncate">
                        {reserva.tour?.title || 'TOUR INCA BOUND'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {new Date(reserva.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {reserva.pax}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#2f2f2f]">
                        ${reserva.totalPrice.toFixed(2)} USD
                      </td>
                      <td className="px-4 py-3 text-center">
                        {reserva.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Pagado
                          </span>
                        )}
                        {reserva.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> Pendiente
                          </span>
                        )}
                        {reserva.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={12} /> Cancelado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedReserva(reserva)}
                          className="px-3 py-1 bg-[#EBEBEB] hover:bg-slate-200 text-[#2f2f2f] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL DETALLE DE RESERVA SHOPIFY POLARIS STYLE */}
      {selectedReserva && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detalle de Reserva</span>
                <h3 className="text-xl font-black text-[#2f2f2f]">{selectedReserva.tour?.title || 'Tour Inca Bound'}</h3>
              </div>
              <button 
                onClick={() => setSelectedReserva(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              
              {/* Tarjeta Titular */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <User className="w-4 h-4 text-[#062918]" />
                    <span>{selectedReserva.customerFirstName} {selectedReserva.customerLastName}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    Titular Principal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedReserva.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedReserva.customerPhone}</span>
                  </div>
                </div>

                {selectedReserva.pickupHotel && (
                  <div className="flex items-center gap-2 text-slate-600 pt-2 border-t border-slate-200/60">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Hotel de recojo en Cusco:</strong> {selectedReserva.pickupHotel}</span>
                  </div>
                )}
              </div>

              {/* Grid resumen de Viaje & Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Fecha de Viaje</span>
                  <span className="font-bold text-slate-900 text-sm capitalize">
                    {new Date(selectedReserva.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Pasajeros (Pax)</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedReserva.pax} {selectedReserva.pax === 1 ? 'Persona' : 'Personas'}</span>
                </div>

                <div className="bg-slate-900 text-white p-3.5 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monto Total</span>
                  <span className="text-xl font-black text-emerald-400">${selectedReserva.totalPrice.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Nominativos de Pasajeros si se ingresaron */}
              {parsePassengerList(selectedReserva.specialRequirements).length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Users size={14} className="text-[#062918]" />
                    Lista Nominativa de Pasajeros
                  </p>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Pasajero</th>
                          <th className="px-3 py-2">Tipo Doc</th>
                          <th className="px-3 py-2">N° Documento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsePassengerList(selectedReserva.specialRequirements).map((pax, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-semibold text-slate-900">{pax.name}</td>
                            <td className="px-3 py-2 text-slate-600">{pax.docType}</td>
                            <td className="px-3 py-2 font-mono text-slate-700">{pax.docNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actualizar Estado de Pago */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Cambiar Estado de Reserva</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStatusChange('PENDING')}
                    disabled={isPending}
                    className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                      selectedReserva.status === 'PENDING'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    Pendiente
                  </button>
                  <button
                    onClick={() => handleStatusChange('PAID')}
                    disabled={isPending}
                    className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                      selectedReserva.status === 'PAID'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    Pagado
                  </button>
                  <button
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={isPending}
                    className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                      selectedReserva.status === 'CANCELLED'
                        ? 'bg-red-600 text-white border-red-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    Cancelado
                  </button>
                </div>
              </div>

              {/* Botón WhatsApp */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/${formatPhoneForWhatsapp(selectedReserva.customerPhone)}?text=Hola%20${selectedReserva.customerFirstName},%20te%20escribimos%20de%20Inca%20Bound%20sobre%20tu%20reserva%20de%20${encodeURIComponent(selectedReserva.tour?.title || 'Tour')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs text-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contactar Titular por WhatsApp
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
