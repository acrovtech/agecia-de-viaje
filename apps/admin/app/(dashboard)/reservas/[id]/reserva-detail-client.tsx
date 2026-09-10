'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour, Transfer, VehicleType } from '@repo/db';
import { updateReservationStatus, updateReservationDetails, updateReservationPassengersAction } from '../../../actions/reservation';
import Link from 'next/link';
import { 
  ChevronRight, Calendar, MessageSquare, CheckCircle2, 
  Clock, XCircle, Loader2, Send, Check, Pencil
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

type ReservationPassenger = { id?: string; firstName: string; lastName: string; docType: string; docNumber: string };
type ReservationWithTour = Reservation & { 
  tour: Tour | null; 
  transfer?: Transfer | null;
  vehicleType?: VehicleType | null;
  passengers?: ReservationPassenger[];
};

type Passenger = {
  firstName: string;
  lastName: string;
  name: string;
  docType: string;
  docNumber: string;
};

import { formatSpanishDate } from '@repo/ui/lib/date-utils';

function formatSpanishDateNoDay(dateInput: Date | string): string {
  return formatSpanishDate(dateInput, 'long');
}

function formatSpanishDateShort(dateInput: Date | string): string {
  return formatSpanishDate(dateInput, 'short');
}

function calculateEndDateNoDay(dateInput: Date | string, durationStr?: string | null): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Fecha por confirmar';

  let addDays = 0;
  if (durationStr) {
    const match = durationStr.match(/(\d+)\s*d[íi]as?/i);
    if (match && match[1]) {
      const parsedDays = parseInt(match[1], 10);
      if (!isNaN(parsedDays) && parsedDays > 1) {
        addDays = parsedDays - 1;
      }
    }
  }

  const endDate = new Date(d.getTime() + addDays * 24 * 60 * 60 * 1000);
  return formatSpanishDateNoDay(endDate);
}

export function ReservaDetailClient({ initialReserva }: { initialReserva: ReservationWithTour }) {
  const [reserva, setReserva] = useState(initialReserva);
  const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'PAID' | 'CANCELLED'>(initialReserva.status);
  
  // Estado editable para titular
  const [isEditingTitular, setIsEditingTitular] = useState(false);
  const [titularData, setTitularData] = useState({
    firstName: initialReserva.customerFirstName,
    lastName: initialReserva.customerLastName,
    email: initialReserva.customerEmail,
    phone: initialReserva.customerPhone,
    hotel: initialReserva.pickupHotel || '',
  });

  // Estado editable para pasajeros
  const [isEditingPax, setIsEditingPax] = useState(false);

  // Extraer lista nominativa de pasajeros (de la relación BD o fallback)
  const parsePassengerList = (res: ReservationWithTour): Passenger[] => {
    if (res.passengers && res.passengers.length > 0) {
      return res.passengers.map(p => ({
        firstName: p.firstName || 'Pasajero',
        lastName: p.lastName || '',
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        docType: p.docType || 'DNI',
        docNumber: p.docNumber || ''
      }));
    }
    const requirements = res.specialRequirements;
    if (!requirements) return [];
    const match = requirements.match(/\[Pasajeros:\s*(.*?)\]/);
    if (!match || !match[1]) return [];
    const paxParts = match[1].split('|').map(p => p.trim());
    return paxParts.map(part => {
      const nameMatch = part.match(/Pax\s*\d+:\s*([^(]+)/);
      const docMatch = part.match(/\(([^:]+):\s*([^)]+)\)/);
      const fullName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : part;
      const parts = fullName.split(' ');
      const fName = parts[0] || 'Pasajero';
      const lName = parts.slice(1).join(' ') || '';
      const docTypeVal = docMatch && docMatch[1] ? docMatch[1].trim() : 'DNI';
      const docNumVal = docMatch && docMatch[2] ? docMatch[2].trim() : '';
      return {
        firstName: fName,
        lastName: lName,
        name: fullName,
        docType: docTypeVal,
        docNumber: docNumVal,
      };
    });
  };

  const [passengerList, setPassengerList] = useState<Passenger[]>(() => parsePassengerList(initialReserva));
  
  const [isPending, startTransition] = useTransition();
  const [emailNotification, setEmailNotification] = useState<string | null>(null);

  // Comprobar si hay cambios sin guardar
  const isStatusChanged = selectedStatus !== reserva.status;
  const isTitularChanged = 
    titularData.firstName !== reserva.customerFirstName ||
    titularData.lastName !== reserva.customerLastName ||
    titularData.email !== reserva.customerEmail ||
    titularData.phone !== reserva.customerPhone ||
    titularData.hotel !== (reserva.pickupHotel || '');

  const isPaxChanged = JSON.stringify(passengerList) !== JSON.stringify(parsePassengerList(reserva));

  const hasUnsavedChanges = isStatusChanged || isTitularChanged || isPaxChanged;

  const handleSaveChanges = () => {
    startTransition(async () => {
      let cleanNotes = getCleanSpecialRequirements(reserva.specialRequirements) || '';

      // Guardar estado y datos en BD
      if (isStatusChanged) {
        await updateReservationStatus(reserva.id, selectedStatus);
      }

      if (isPaxChanged) {
        await updateReservationPassengersAction(reserva.id, passengerList);
      }

      const resDetails = await updateReservationDetails(reserva.id, {
        customerFirstName: titularData.firstName,
        customerLastName: titularData.lastName,
        customerEmail: titularData.email,
        customerPhone: titularData.phone,
        pickupHotel: titularData.hotel,
        specialRequirements: cleanNotes,
      });

      if (resDetails.success) {
        setReserva(prev => ({
          ...prev,
          status: selectedStatus,
          customerFirstName: titularData.firstName,
          customerLastName: titularData.lastName,
          customerEmail: titularData.email,
          customerPhone: titularData.phone,
          pickupHotel: titularData.hotel,
          specialRequirements: cleanNotes,
          passengers: passengerList.map(p => ({
            firstName: p.firstName || (p.name.split(' ')[0] || 'Pasajero'),
            lastName: p.lastName || (p.name.split(' ').slice(1).join(' ') || ''),
            docType: p.docType,
            docNumber: p.docNumber
          })),
        }));
        setIsEditingTitular(false);
        setIsEditingPax(false);
        setEmailNotification('Reserva y pasajeros actualizados correctamente.');
        setTimeout(() => setEmailNotification(null), 4000);
      }
    });
  };

  const handleDiscardChanges = () => {
    setSelectedStatus(reserva.status);
    setTitularData({
      firstName: reserva.customerFirstName,
      lastName: reserva.customerLastName,
      email: reserva.customerEmail,
      phone: reserva.customerPhone,
      hotel: reserva.pickupHotel || '',
    });
    setPassengerList(parsePassengerList(reserva));
    setIsEditingTitular(false);
    setIsEditingPax(false);
  };

  const formatPhoneForWhatsapp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  const handleSendEmailConfirmation = () => {
    setEmailNotification(`Email de confirmación enviado exitosamente a ${reserva.customerEmail}`);
    setTimeout(() => setEmailNotification(null), 4000);
  };

  const handleSendTripReminder = () => {
    setEmailNotification(`Email de recordatorio de viaje (24h antes) enviado exitosamente a ${reserva.customerEmail}`);
    setTimeout(() => setEmailNotification(null), 4000);
  };

  const handleSendCancellationEmail = () => {
    setEmailNotification(`Email de cancelación enviado a ${reserva.customerEmail}`);
    setTimeout(() => setEmailNotification(null), 4000);
  };

  // Limpiar requerimientos especiales omitiendo el string de [Pasajeros: ...]
  const getCleanSpecialRequirements = (requirements: string | null) => {
    if (!requirements) return null;
    const cleaned = requirements.replace(/\[Pasajeros:\s*.*?\]/gi, '').trim();
    return cleaned || null;
  };

  const getServiceType = () => {
    if (reserva.specialRequirements?.toLowerCase().includes('privado')) {
      return 'Servicio Privado';
    }
    return 'Servicio Compartido';
  };

  const getHotelLabel = () => {
    if (reserva.transfer) {
      const origin = (reserva.transfer.origin || '').toLowerCase();
      const destination = (reserva.transfer.destination || '').toLowerCase();
      if (origin.includes('aeropuerto') || origin.includes('estación') || origin.includes('estacion')) {
        return 'Hotel de Llegada / Destino';
      }
      if (destination.includes('aeropuerto') || destination.includes('estación') || destination.includes('estacion')) {
        return 'Hotel de Recojo / Partida';
      }
      return 'Hotel o Dirección de Destino';
    }
    return 'Hotel de Recojo en Cusco';
  };

  const cleanNotes = getCleanSpecialRequirements(reserva.specialRequirements);
  const pricePerPax = reserva.totalPrice / Math.max(reserva.pax, 1);

  return (
    <div className="flex-1 w-full max-w-[1150px] mx-auto px-0 pb-6 font-sans select-none relative">
      
      {/* BARRA CONTEXTUAL FLOTANTE SHOPIFY POLARIS */}
      {hasUnsavedChanges && (
        <div className="fixed top-2 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[60] flex items-center justify-between gap-2 md:gap-8 md:min-w-[620px] bg-[#222222] text-white py-1.5 px-3 md:py-1 md:pr-1 md:pb-1 md:pl-3.5 rounded-xl shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 fill-[#EEEEEE] shrink-0">
              <path d="M8 4a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75"></path>
              <path d="M8 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
              <path fillRule="evenodd" d="M1.5 6.25a4.75 4.75 0 0 1 4.75-4.75h3.5a4.75 4.75 0 0 1 4.75 4.75v2.5a4.75 4.75 0 0 1-4.573 4.747l-1.335 1.714a.75.75 0 0 1-1.189-.007l-1.3-1.706a4.75 4.75 0 0 1-4.603-4.748zm4.75-3.25a3.25 3.25 0 0 0-3.25 3.25v2.5a3.25 3.25 0 0 0 3.25 3.25h.226c.234 0 .455.11.597.296l.934 1.225.96-1.232a.75.75 0 0 1 .591-.289h.192a3.25 3.25 0 0 0 3.25-3.25v-2.5a3.25 3.25 0 0 0-3.25-3.25z"></path>
            </svg>
            <h2 className="text-[11px] md:text-[12px] leading-[16px] font-[450] text-[#EEEEEE] tracking-tight truncate">
              Cambios no guardados
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              type="button"
              onClick={handleDiscardChanges}
              disabled={isPending}
              className="px-2.5 md:px-3 py-1 rounded-lg bg-[#383838] hover:bg-[#444444] text-[#EEEEEE] font-[550] text-[11px] md:text-[12px] leading-[16px] transition-colors cursor-pointer"
            >
              Descartar
            </button>
            <button 
              type="button"
              onClick={handleSaveChanges}
              disabled={isPending}
              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-[550] text-[11px] md:text-[12px] leading-[16px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin text-white" />}
              <span>Guardar</span>
            </button>
          </div>
        </div>
      )}

      {/* HEADER DE PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link href="/reservas" className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors shrink-0" title="Volver a Reservas">
            <Calendar className="w-4 h-4 text-slate-700 shrink-0" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <h1 className="text-[1rem] font-semibold text-[#303030] tracking-tight truncate">
            Reserva #{reserva.id.slice(-6).toUpperCase()}
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={`https://wa.me/${formatPhoneForWhatsapp(reserva.customerPhone)}?text=Hola%20${reserva.customerFirstName},%20te%20escribimos%20de%20Inca%20Bound%20sobre%20tu%20reserva%20de%20${encodeURIComponent(reserva.tour?.title || 'Tour')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 h-9 sm:h-8 rounded-lg shadow-xs transition-all select-none cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contactar por WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Toast Notificación Email / Estado */}
      {emailNotification && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailNotification}</span>
          </div>
          <button onClick={() => setEmailNotification(null)} className="text-emerald-600 hover:text-emerald-900 font-bold cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* 2. BODY EN 2 COLUMNAS (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMNA IZQUIERDA (8 COLS) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* CARD 1: SERVICIO RESERVADO (EXPEDICIÓN O TRASLADO) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">
                {reserva.transfer ? 'Traslado / Transfer Reservado' : 'Expedición Reservada'}
              </h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                reserva.transfer 
                  ? 'text-indigo-800 bg-indigo-50 border-indigo-200/60' 
                  : 'text-[#062918] bg-emerald-50 border-emerald-200/60'
              }`}>
                {reserva.transfer 
                  ? (reserva.vehicleType?.name || 'Servicio Privado') 
                  : getServiceType()}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              {reserva.tour?.title || reserva.transfer?.title || 'Reserva Inca Bound'}
            </h2>

            {reserva.transfer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Ruta del Traslado</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {reserva.transfer.origin} ➔ {reserva.transfer.destination}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Vehículo Asignado</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {reserva.vehicleType?.name || 'Vehículo Privado'} ({reserva.vehicleType?.subtitle || 'Capacidad completa'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Fecha del Servicio</span>
                  <span className="font-bold text-slate-900 text-xs capitalize">{formatSpanishDateNoDay(reserva.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Hora de Recojo / Vuelo</span>
                  <span className="font-bold text-slate-900 text-xs">{reserva.pickupTime || 'Por coordinar con el pasajero'}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Duración Estimada</span>
                  <span className="font-bold text-slate-900 text-xs">{reserva.tour?.duration || '1 Día'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Idioma del Servicio</span>
                  <span className="font-bold text-slate-900 text-xs">Español / Inglés (Bilingüe)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Fecha de Inicio</span>
                  <span className="font-bold text-slate-900 text-xs capitalize">{formatSpanishDateNoDay(reserva.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Fecha de Fin</span>
                  <span className="font-bold text-slate-900 text-xs capitalize">{calculateEndDateNoDay(reserva.date, reserva.tour?.duration)}</span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: DATOS DEL TITULAR (Con Botón Editar) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Datos del Titular</h3>
              
              <button
                type="button"
                onClick={() => setIsEditingTitular(!isEditingTitular)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3 text-slate-500" />
                <span>{isEditingTitular ? 'Cancelar' : 'Editar'}</span>
              </button>
            </div>

            {isEditingTitular ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombres</label>
                  <input
                    type="text"
                    value={titularData.firstName}
                    onChange={(e) => setTitularData({ ...titularData, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={titularData.lastName}
                    onChange={(e) => setTitularData({ ...titularData, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={titularData.email}
                    onChange={(e) => setTitularData({ ...titularData, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={titularData.phone}
                    onChange={(e) => setTitularData({ ...titularData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{getHotelLabel()}</label>
                  <input
                    type="text"
                    value={titularData.hotel}
                    onChange={(e) => setTitularData({ ...titularData, hotel: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Nombres y Apellidos</span>
                  <span className="font-bold text-slate-900 text-xs">{reserva.customerFirstName} {reserva.customerLastName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Correo Electrónico</span>
                  <span className="font-bold text-slate-900 text-xs">{reserva.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">Teléfono / WhatsApp</span>
                  <span className="font-bold text-slate-900 text-xs">{reserva.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium text-[11px]">{getHotelLabel()}</span>
                  <span className="font-bold text-slate-900 text-xs">{reserva.pickupHotel || 'No especificado'}</span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: LISTA NOMINATIVA DE PASAJEROS (Con Botón Editar) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">
                Lista Nominativa de Pasajeros ({reserva.pax})
              </h3>

              <button
                type="button"
                onClick={() => setIsEditingPax(!isEditingPax)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3 text-slate-500" />
                <span>{isEditingPax ? 'Cancelar' : 'Editar'}</span>
              </button>
            </div>

            {passengerList.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-center">#</th>
                      <th className="px-3 py-2">Nombre del Pasajero</th>
                      <th className="px-3 py-2">Tipo Documento</th>
                      <th className="px-3 py-2">N° Documento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {passengerList.map((pax, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-bold text-slate-400 text-center">{idx + 1}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          {isEditingPax ? (
                            <input
                              type="text"
                              value={pax.name}
                              onChange={(e) => {
                                const next = [...passengerList];
                                if (next[idx]) next[idx].name = e.target.value;
                                setPassengerList(next);
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-medium"
                            />
                          ) : (
                            pax.name
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600 font-medium">
                          {isEditingPax ? (
                            <select
                              value={pax.docType}
                              onChange={(e) => {
                                const next = [...passengerList];
                                if (next[idx]) next[idx].docType = e.target.value;
                                setPassengerList(next);
                              }}
                              className="px-2 py-1 rounded border border-slate-300 text-xs font-medium bg-white"
                            >
                              <option value="DNI">DNI</option>
                              <option value="Pasaporte">Pasaporte</option>
                              <option value="Carnet Extranjería">Carnet Extranjería</option>
                            </select>
                          ) : (
                            pax.docType
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                          {isEditingPax ? (
                            <input
                              type="text"
                              value={pax.docNumber}
                              onChange={(e) => {
                                const next = [...passengerList];
                                if (next[idx]) next[idx].docNumber = e.target.value;
                                setPassengerList(next);
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-mono"
                            />
                          ) : (
                            pax.docNumber
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 font-medium">
                No se registraron datos nominativos adicionales de pasajeros.
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA (4 COLS - SIDEBAR POLARIS) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* CARD 1: ESTADO DE LA RESERVA */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Estado de la Reserva</h3>
              {reserva.status === 'PAID' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  Pagado
                </span>
              )}
              {reserva.status === 'PENDING' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                  Pendiente
                </span>
              )}
              {reserva.status === 'CANCELLED' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                  Cancelado
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Seleccionar Estado</label>
              
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val as 'PENDING' | 'PAID' | 'CANCELLED')}
              >
                <SelectTrigger className="w-full bg-white text-xs font-semibold text-slate-900 border-slate-300 h-9 rounded-lg px-3">
                  <div className="flex items-center gap-2 truncate">
                    {selectedStatus === 'PAID' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    {selectedStatus === 'PENDING' && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    {selectedStatus === 'CANCELLED' && <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                    <span>
                      {selectedStatus === 'PAID' ? 'Pagado' : selectedStatus === 'PENDING' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent 
                  alignItemWithTrigger={false} 
                  align="start" 
                  side="bottom" 
                  sideOffset={6}
                  className="w-[var(--anchor-width)] min-w-[var(--anchor-width)] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
                >
                  <SelectItem value="PAID" className="text-xs font-semibold cursor-pointer py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Pagado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PENDING" className="text-xs font-semibold cursor-pointer py-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Pendiente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs font-semibold cursor-pointer py-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Cancelado</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <p className="text-[11px] text-slate-400">
                Selecciona el estado y confirma haciendo clic en **Guardar** en la barra superior.
              </p>
            </div>
          </div>

          {/* CARD 2: INFORMACIÓN DE PAGO (Ordenado: Registro -> Pasarela -> Token -> Pax -> Precio por persona -> Total) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Información de Pago</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Fecha registro</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {formatSpanishDateShort(reserva.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Pasarela</span>
                <span className="font-semibold text-slate-800">Izipay (PCI-DSS)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Ref / Token</span>
                <span className="font-mono text-slate-700">{reserva.paymentReference || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Cantidad de pasajeros</span>
                <span className="font-semibold text-slate-800">{reserva.pax} {reserva.pax === 1 ? 'Pasajero' : 'Pasajeros'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Precio por persona</span>
                <span className="font-bold text-slate-900">${pricePerPax.toFixed(2)} USD</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-900">Total</span>
                <span className="text-emerald-700 text-lg font-black">${reserva.totalPrice.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* CARD 3: REQUERIMIENTOS ESPECIALES */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Requerimientos Especiales</h3>
            </div>

            {cleanNotes ? (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 leading-relaxed font-medium">
                {cleanNotes}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                El cliente no ingresó requerimientos o dietas especiales al momento de reservar.
              </p>
            )}
          </div>

          {/* CARD 4: GESTIÓN DE EMAILS */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Gestión de Emails</h3>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSendEmailConfirmation}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Email de Confirmación</span>
              </button>

              <button
                type="button"
                onClick={handleSendTripReminder}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300/80"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Email Recordatorio de Viaje (24h)</span>
              </button>

              <button
                type="button"
                onClick={handleSendCancellationEmail}
                className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Enviar Email de Cancelación</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
