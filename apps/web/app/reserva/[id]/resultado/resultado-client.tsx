'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Home, 
  ShieldCheck, 
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

type ReservationData = {
  id: string;
  tourId?: string | null;
  transferId?: string | null;
  tourTitle: string;
  tourSlug?: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  pax: number;
  totalPrice: number;
  pickupHotel?: string | null;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentReference?: string | null;
  passengers: Array<{
    firstName: string;
    lastName: string;
    docType: string;
    docNumber: string;
  }>;
};

export function ResultadoClient({ initialReservation }: { initialReservation: ReservationData }) {
  const reservation = initialReservation;
  const [pollCount, setPollCount] = useState<number>(0);
  const router = useRouter();

  // Polling ligero para cuando el usuario llega antes de que el IPN de Izipay termine de procesar
  useEffect(() => {
    if (reservation.status !== 'PENDING' || pollCount >= 6) return;

    const timer = setTimeout(() => {
      setPollCount(prev => prev + 1);
      router.refresh();
    }, 3000);

    return () => clearTimeout(timer);
  }, [reservation.status, pollCount, router]);

  const formattedDate = new Date(reservation.date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const reservationCode = reservation.id.slice(-8).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          
          {/* TARJETA PRINCIPAL DE ESTADO */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            
            {/* CABECERA SEGÚN ESTADO */}
            {reservation.status === 'PAID' && (
              <div className="bg-emerald-900 text-white p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b border-emerald-950/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-400/30">
                    <CheckCircle2 size={32} className="text-emerald-300" />
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-1">
                      Pago Confirmado
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">¡Reserva Exitosa!</h1>
                    <p className="text-sm text-emerald-100 mt-0.5">Hemos recibido tu pago de forma 100% segura con Izipay.</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 text-center sm:text-right">
                  <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold block">Código</span>
                  <span className="text-xl font-mono font-bold text-white">#{reservationCode}</span>
                </div>
              </div>
            )}

            {reservation.status === 'PENDING' && (
              <div className="bg-amber-900 text-white p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b border-amber-950/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-400/30">
                    <Clock size={32} className="text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30 mb-1">
                      Procesando Confirmación
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Confirmando Pago...</h1>
                    <p className="text-sm text-amber-100 mt-0.5">Estamos verificando la transacción bancaria con Izipay.</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 text-center sm:text-right">
                  <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold block">Código</span>
                  <span className="text-xl font-mono font-bold text-white">#{reservationCode}</span>
                </div>
              </div>
            )}

            {reservation.status === 'CANCELLED' && (
              <div className="bg-rose-900 text-white p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b border-rose-950/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-400/30">
                    <XCircle size={32} className="text-rose-300" />
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-400/30 mb-1">
                      Reserva Cancelada
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Pago No Completado</h1>
                    <p className="text-sm text-rose-100 mt-0.5">La transacción no pudo ser procesada o fue cancelada.</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 text-center sm:text-right">
                  <span className="text-xs uppercase tracking-wider text-rose-300 font-semibold block">Código</span>
                  <span className="text-xl font-mono font-bold text-white">#{reservationCode}</span>
                </div>
              </div>
            )}

            {/* CUERPO CON DETALLES DE LA RESERVA */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Notificación explicativa */}
              {reservation.status === 'PAID' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-sm flex items-start gap-3">
                  <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">¡Comprobante enviado a {reservation.customerEmail}!</p>
                    <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                      Nuestro equipo de operaciones en Cusco se pondrá en contacto contigo 24 horas antes del tour para confirmar el punto exacto y horario de recojo.
                    </p>
                  </div>
                </div>
              )}

              {reservation.status === 'PENDING' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3">
                  <RefreshCw size={20} className="text-amber-700 shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-semibold">Esperando notificación bancaria oficial</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Si acabas de completar el pago en la pasarela, tu confirmación llegará a tu correo <strong>{reservation.customerEmail}</strong> en unos instantes.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid de Datos del Tour */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-200/80 pb-2">
                  Detalles de la Expedición
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Tour</span>
                    <span className="font-bold text-gray-900">{reservation.tourTitle}</span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Fecha del Tour</span>
                    <span className="font-bold text-gray-900 capitalize">{formattedDate}</span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Titular de Reserva</span>
                    <span className="font-bold text-gray-900">{reservation.customerFirstName} {reservation.customerLastName}</span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Cantidad de Pasajeros</span>
                    <span className="font-bold text-gray-900">{reservation.pax} {reservation.pax === 1 ? 'Viajero' : 'Viajeros'}</span>
                  </div>

                  {reservation.pickupHotel && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-gray-500 font-medium block">Hotel de Recojo</span>
                      <span className="font-semibold text-gray-900">{reservation.pickupHotel}</span>
                    </div>
                  )}
                </div>

                {/* Pasajeros registrados */}
                {reservation.passengers && reservation.passengers.length > 0 && (
                  <div className="pt-3 border-t border-gray-200/80">
                    <span className="text-xs text-gray-500 font-medium block mb-2">Lista de Pasajeros Registrados:</span>
                    <div className="space-y-1.5">
                      {reservation.passengers.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-gray-200">
                          <span className="font-medium text-gray-800">{idx + 1}. {p.firstName} {p.lastName}</span>
                          <span className="text-gray-500">{p.docType}: {p.docNumber || 'S/N'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Importe Total */}
                <div className="pt-3 border-t border-gray-200/80 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Monto Total</span>
                  <span className="text-xl font-bold text-[#062918]">${reservation.totalPrice.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/"
                  className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm rounded-xl transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Home size={16} />
                  <span>Volver al Inicio</span>
                </Link>

                <a
                  href={`https://wa.me/51987654321?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20reserva%20%23${reservationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 px-4 bg-[#062918] hover:bg-[#0a4026] text-white font-bold text-xs sm:text-sm rounded-xl transition-colors text-center flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageCircle size={16} />
                  <span>Soporte por WhatsApp</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
