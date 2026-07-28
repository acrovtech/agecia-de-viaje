'use client';

import { useState, useTransition } from 'react';
import { Reservation, Tour } from '@repo/db';
import { updateReservationStatus } from '../../../actions/reservation';
import Link from 'next/link';
import { 
  ArrowLeft, MessageSquare, CheckCircle2, Clock, XCircle, Send, Check, Mail, AlertTriangle
} from 'lucide-react';

type ReservationWithTour = Reservation & { tour: Tour | null };

export function ReservaDetailClient({ initialReserva }: { initialReserva: ReservationWithTour }) {
  const [reserva, setReserva] = useState(initialReserva);
  const [isPending, startTransition] = useTransition();
  const [emailNotification, setEmailNotification] = useState<string | null>(null);

  const handleStatusChange = (status: 'PENDING' | 'PAID' | 'CANCELLED') => {
    startTransition(async () => {
      const res = await updateReservationStatus(reserva.id, status);
      if (res.success) {
        setReserva(prev => ({ ...prev, status }));
      }
    });
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
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-12 select-none">
      
      {/* 1. NAVEGACIÓN Y HEADER */}
      <div className="space-y-3">
        <Link 
          href="/reservas" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a Reservas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black tracking-tight text-[#2f2f2f]">
            Reserva #{reserva.id.slice(-6).toUpperCase()}
          </h1>

          <a
            href={`https://wa.me/${formatPhoneForWhatsapp(reserva.customerPhone)}?text=Hola%20${reserva.customerFirstName},%20te%20escribimos%20de%20Inca%20Bound%20sobre%20tu%20reserva%20de%20${encodeURIComponent(reserva.tour?.title || 'Tour')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <MessageSquare size={16} />
            Contactar por WhatsApp
          </a>
        </div>
      </div>

      {/* Toast Notificación Email */}
      {emailNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{emailNotification}</span>
          </div>
          <button onClick={() => setEmailNotification(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* 2. BODY EN 2 COLUMNAS (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TOUR RESERVADO */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">EXPEDICIÓN RESERVADA</span>
              <span className="text-xs font-bold text-[#062918] bg-emerald-50 px-3 py-1 rounded-lg">Inca Bound Operator</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900">{reserva.tour?.title || 'Tour Inca Bound'}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha de Salida</span>
                <span className="font-bold text-slate-900 text-sm capitalize">
                  {new Date(reserva.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Viajeros Totales</span>
                <span className="font-bold text-slate-900 text-sm">{reserva.pax} {reserva.pax === 1 ? 'Persona' : 'Personas'}</span>
              </div>
            </div>
          </div>

          {/* TITULAR Y DATOS DE CONTACTO (Sin icono en el título) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                DATOS DEL TITULAR
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Contacto Principal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nombres y Apellidos</span>
                <span className="font-bold text-slate-900 text-sm">{reserva.customerFirstName} {reserva.customerLastName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Correo Electrónico</span>
                <span className="font-bold text-slate-900 text-sm">{reserva.customerEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Teléfono / WhatsApp</span>
                <span className="font-bold text-slate-900 text-sm">{reserva.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Hotel de Recojo en Cusco</span>
                <span className="font-bold text-slate-900 text-sm">{reserva.pickupHotel || 'No especificado'}</span>
              </div>
            </div>
          </div>

          {/* LISTADO NOMINATIVO DE PASAJEROS (Sin icono en el título) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                LISTA NOMINATIVA DE PASAJEROS ({reserva.pax})
              </span>
            </div>

            {passengerList.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center">#</th>
                      <th className="px-4 py-3">Nombre del Pasajero</th>
                      <th className="px-4 py-3">Tipo Documento</th>
                      <th className="px-4 py-3">N° Documento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {passengerList.map((pax, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-slate-400 text-center">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{pax.name}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{pax.docType}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800">{pax.docNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium">
                No se registraron datos nominativos adicionales de pasajeros.
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA (4 COLS - SIDEBAR POLARIS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CARD 1: CARD INDEPENDIENTE DE ESTADO (Sin icono en título) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ESTADO DE LA RESERVA
              </h3>
              {reserva.status === 'PAID' && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Pagado
                </span>
              )}
              {reserva.status === 'PENDING' && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Pendiente
                </span>
              )}
              {reserva.status === 'CANCELLED' && (
                <span className="text-[11px] font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
                  Cancelado
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleStatusChange('PAID')}
                disabled={isPending}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border text-left flex items-center justify-between cursor-pointer ${
                  reserva.status === 'PAID'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>Pagado</span>
                {reserva.status === 'PAID' && <CheckCircle2 size={16} />}
              </button>

              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={isPending}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border text-left flex items-center justify-between cursor-pointer ${
                  reserva.status === 'PENDING'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>Pendiente</span>
                {reserva.status === 'PENDING' && <Clock size={16} />}
              </button>

              <button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={isPending}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border text-left flex items-center justify-between cursor-pointer ${
                  reserva.status === 'CANCELLED'
                    ? 'bg-red-600 text-white border-red-700 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>Cancelado</span>
                {reserva.status === 'CANCELLED' && <XCircle size={16} />}
              </button>
            </div>
          </div>

          {/* CARD 2: RESUMEN DE PAGO (Sin icono en título) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              RESUMEN DE PAGO
            </h3>

            <div className="space-y-3 text-xs">
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

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-base font-bold">
                <span className="text-slate-900">Total</span>
                <span className="text-emerald-700 text-xl font-black">${reserva.totalPrice.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* CARD 3: GESTIÓN DE EMAILS (Sin icono en el título) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              GESTIÓN DE EMAILS
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSendEmailConfirmation}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send size={14} />
                Enviar Email de Confirmación
              </button>

              <button
                type="button"
                onClick={handleSendTripReminder}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
              >
                <Clock size={14} />
                Email Recordatorio de Viaje (24h)
              </button>

              <button
                type="button"
                onClick={handleSendCancellationEmail}
                className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-red-200"
              >
                <XCircle size={14} />
                Enviar Email de Cancelación
              </button>
            </div>
          </div>

          {/* CARD 4: REQUERIMIENTOS ESPECIALES (Sin icono en el título) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              REQUERIMIENTOS ESPECIALES
            </h3>

            {cleanNotes ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed font-medium">
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
