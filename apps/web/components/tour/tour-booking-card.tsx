'use client';

import { CalendarDays, Users, ChevronRight, ShieldCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Calendar } from '../ui/calendar';
import { useRouter } from 'next/navigation';

export function TourBookingCard({ tourTitle, slug, price, privatePrice }: { tourTitle: string, slug: string, price: number, privatePrice?: number }) {
  const [pax, setPax] = useState(2);
  const [serviceType, setServiceType] = useState<'shared' | 'private'>('shared');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const currentPrice = serviceType === 'private' && privatePrice ? privatePrice : price;

  const handleBooking = () => {
    if (!selectedDate) {
      setError('Por favor, selecciona una fecha de viaje.');
      return;
    }
    setError(null);
    const dateStr = selectedDate.toISOString();
    const query = new URLSearchParams({
      slug,
      tourTitle,
      date: dateStr,
      pax: pax.toString(),
      type: serviceType,
      price: currentPrice.toString(),
      total: (currentPrice * pax).toString()
    });
    router.push(`/checkout?${query.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 relative overflow-hidden">

      {privatePrice && (
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6 border border-gray-100">
          <button 
            onClick={() => setServiceType('shared')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors border ${
              serviceType === 'shared' ? 'bg-white text-gray-900 border-gray-200' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Compartido
          </button>
          <button 
            onClick={() => setServiceType('private')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors border ${
              serviceType === 'private' ? 'bg-white text-gray-900 border-gray-200' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Privado
          </button>
        </div>
      )}

      <div className="flex justify-around items-center gap-2 mb-6 flex-wrap">
        <span className="text-sm text-gray-500 font-medium mr-1">Precio</span>
        <span className="text-3xl font-bold font-heading text-gray-900">${currentPrice} USD</span>
        <span className="text-sm text-gray-500 ml-1">por persona</span>
      </div>

      <div className="space-y-4 mb-8">
        {/* Date Selector */}
        <div className="relative" ref={calendarRef}>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fecha de Viaje</label>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2.5 bg-white hover:border-[#062918] transition-colors"
          >
            <span className={`font-medium ${selectedDate ? 'text-gray-900' : 'text-gray-400'}`}>
              {selectedDate 
                ? selectedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Seleccionar Fecha'}
            </span>
            <CalendarDays size={18} className={selectedDate ? 'text-[#062918]' : 'text-gray-400'} />
          </button>
          
          {showCalendar && (
            <div className="absolute top-full left-0 mt-2 w-full z-50">
              <Calendar 
                selectedDate={selectedDate} 
                onSelect={(date) => {
                  setSelectedDate(date);
                  setShowCalendar(false);
                  setError(null);
                }} 
              />
            </div>
          )}
          {error && <p className="text-red-500 text-xs font-medium mt-2">{error}</p>}
        </div>

        {/* Pax Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Viajeros</label>
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-1 bg-white">
            <button 
              onClick={() => setPax(Math.max(1, pax - 1))}
              className="w-10 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 font-medium transition-colors"
            >
              -
            </button>
            <span className="text-gray-900 font-medium text-sm">{pax} {pax === 1 ? 'Persona' : 'Personas'}</span>
            <button 
              onClick={() => setPax(pax + 1)}
              className="w-10 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 font-medium transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resumen de reserva</label>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Tipo de servicio</span>
            <span className="font-medium text-gray-900">{serviceType === 'shared' ? 'Compartido' : 'Privado'}</span>
          </div>
        <div className="flex justify-between text-gray-600 text-sm">
          <span>Pasajeros</span>
          <span className="font-medium text-gray-900">{pax} {pax === 1 ? 'Persona' : 'Personas'}</span>
        </div>
        <div className="flex justify-between text-gray-600 text-sm">
          <span>Precio por pasajero</span>
          <span className="font-medium text-gray-900">${currentPrice} USD</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t border-gray-200 mt-1">
          <span>Total</span>
          <span className="text-[#062918]">${currentPrice * pax} USD</span>
        </div>
        </div>
      </div>

      <button 
        onClick={handleBooking}
        className="w-full bg-[#062918] hover:bg-brand-teal text-white font-semibold text-base py-3 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2"
      >
        RESERVAR AHORA
      </button>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
          <ShieldCheck size={16} className="text-green-500" />
          Pago 100% Seguro
        </div>
      </div>
    </div>
  );
}
