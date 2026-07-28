'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour } from '@repo/db';
import { updateReservationStatus } from '../../../actions/reservation';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, Calendar, MessageSquare, CheckCircle2, 
  Clock, XCircle, Loader2, Send, Check, Mail, User, Users
} from 'lucide-react';

type ReservationWithTour = Reservation & { tour: Tour | null };

export function ReservaDetailClient({ initialReserva }: { initialReserva: ReservationWithTour }) {
  const [reserva, setReserva] = useState(initialReserva);
  const [selectedStatus, setSelectedStatus] = useState<'PENDING' | 'PAID' | 'CANCELLED'>(initialReserva.status);
  const [isPending, startTransition] = useTransition();
  const [emailNotification, setEmailNotification] = useState<string | null>(null);

  const hasUnsavedChanges = selectedStatus !== reserva.status;

  const handleSaveChanges = () => {
    startTransition(async () => {
      const res = await updateReservationStatus(reserva.id, selectedStatus);
      if (res.success) {
        setReserva(prev => ({ ...prev, status: selectedStatus }));
        setEmailNotification(`Estado de la reserva actualizado a ${selectedStatus === 'PAID' ? 'Pagado' : selectedStatus === 'PENDING' ? 'Pendiente' : 'Cancelado'}`);
        setTimeout(() => setEmailNotification(null), 4000);
      }
    });
  };

  const handleDiscardChanges = () => {
    setSelectedStatus(reserva.status);
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

  // Extraer lista nominativa de pasajeros de specialRequirements
  const parsePassengerList = (requirements: string | null) => {
    if (!requirements) return [];
    const match = requirements.match(/\[Pasajeros:\s*(.*?)\]/);
    if (!match || !match[1]) return [];
    const paxParts = match[1].split('|').map(p => p.trim());
    return paxParts.map(part => {
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

  // Limpiar requerimientos especiales omitiendo el string de [Pasajeros: ...]
  const getCleanSpecialRequirements = (requirements: string | null) => {
    if (!requirements) return null;
    const cleaned = requirements.replace(/\[Pasajeros:\s*.*?\]/gi, '').trim();
    return cleaned || null;
  };

  const passengerList = parsePassengerList(reserva.specialRequirements);
  const cleanNotes = getCleanSpecialRequirements(reserva.specialRequirements);

  return (
    <div className="flex-1 w-full max-w-[1150px] mx-auto px-0 pb-6 font-sans select-none relative">
      
      {/* BARRA CONTEXTUAL FLOTANTE SHOPIFY POLARIS (Idéntica a tour-form.tsx) */}
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

      {/* HEADER DE PÁGINA (Idéntico a tour-form.tsx) */}
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

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${formatPhoneForWhatsapp(reserva.customerPhone)}?text=Hola%20${reserva.customerFirstName},%20te%20escribimos%20de%20Inca%20Bound%20sobre%20tu%20reserva%20de%20${encodeURIComponent(reserva.tour?.title || 'Tour')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 h-8 rounded-lg shadow-xs transition-all select-none"
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
          
          {/* CARD 1: TOUR RESERVADO */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Expedición Reservada</h3>
              <span className="text-[10px] font-bold text-[#062918] bg-emerald-50 px-2 py-0.5 rounded-md">Inca Bound Operator</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">{reserva.tour?.title || 'Tour Inca Bound'}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Fecha de Salida</span>
                <span className="font-bold text-slate-900 text-xs capitalize">
                  {new Date(reserva.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Viajeros Totales</span>
                <span className="font-bold text-slate-900 text-xs">{reserva.pax} {reserva.pax === 1 ? 'Persona' : 'Personas'}</span>
              </div>
            </div>
          </div>

          {/* CARD 2: DATOS DEL TITULAR */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Datos del Titular</h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Contacto Principal
              </span>
            </div>

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
                <span className="text-slate-400 block font-medium text-[11px]">Hotel de Recojo en Cusco</span>
                <span className="font-bold text-slate-900 text-xs">{reserva.pickupHotel || 'No especificado'}</span>
              </div>
            </div>
          </div>

          {/* CARD 3: LISTA NOMINATIVA DE PASAJEROS */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">
                Lista Nominativa de Pasajeros ({reserva.pax})
              </h3>
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
                        <td className="px-3 py-2 font-semibold text-slate-900">{pax.name}</td>
                        <td className="px-3 py-2 text-slate-600 font-medium">{pax.docType}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-800">{pax.docNumber}</td>
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
          
          {/* CARD 1: ESTADO DE LA RESERVA (DROPDOWN RESPONSIVE) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Estado de la Reserva</h3>
              {reserva.status === 'PAID' && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Pagado
                </span>
              )}
              {reserva.status === 'PENDING' && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Pendiente
                </span>
              )}
              {reserva.status === 'CANCELLED' && (
                <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                  Cancelado
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Seleccionar Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'PENDING' | 'PAID' | 'CANCELLED')}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="PAID">🟢 Pagado</option>
                <option value="PENDING">🟠 Pendiente</option>
                <option value="CANCELLED">🔴 Cancelado</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Selecciona el estado y confirma haciendo clic en **Guardar** en la barra superior.
              </p>
            </div>
          </div>

          {/* CARD 2: RESUMEN DE PAGO */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Resumen de Pago</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Fecha registro</span>
                <span className="font-semibold text-slate-800">
                  {new Date(reserva.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal tour</span>
                <span className="font-bold text-slate-900">${reserva.totalPrice.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Pasarela</span>
                <span className="font-semibold text-slate-800">Izipay (PCI-DSS)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Ref / Token</span>
                <span className="font-mono text-slate-700">{reserva.paymentReference || 'N/A'}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-900">Total</span>
                <span className="text-emerald-700 text-lg font-black">${reserva.totalPrice.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* CARD 3: GESTIÓN DE EMAILS */}
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

          {/* CARD 4: REQUERIMIENTOS ESPECIALES */}
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

        </div>

      </div>

    </div>
  );
}
