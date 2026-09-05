'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Users, DollarSign, Check, Loader2 } from 'lucide-react';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { formatCurrency } from '@repo/ui/lib/currency';

interface CheckoutModalEditProps {
  isOpen: boolean;
  onClose: () => void;
  modalDate: Date | null;
  setModalDate: (d: Date | null) => void;
  modalPax: number;
  setModalPax: (p: number) => void;
  modalServiceType: 'shared' | 'private';
  setModalServiceType: (t: 'shared' | 'private') => void;
  onSave: (updatedPricePerPax: number) => void;
  tourTitle?: string;
  tourSlug?: string;
  initialPrice?: number;
}

export function CheckoutModalEdit({
  isOpen,
  onClose,
  modalDate,
  setModalDate,
  modalPax,
  setModalPax,
  modalServiceType,
  setModalServiceType,
  onSave,
  tourTitle = 'Tour',
  tourSlug,
  initialPrice = 0,
}: CheckoutModalEditProps) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tourData, setTourData] = useState<any>(null);
  const [isLoadingTour, setIsLoadingTour] = useState(false);

  // Animación fluida de entrada y salida
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = setTimeout(() => setIsAnimating(true), 15);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Recuperar información y tarifas en tiempo real de la base de datos
  useEffect(() => {
    if (isOpen && tourSlug) {
      setIsLoadingTour(true);
      fetch(`/api/tours?slug=${tourSlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.tour) {
            setTourData(data.tour);
          }
          setIsLoadingTour(false);
        })
        .catch((err) => {
          console.error('Error cargando datos del tour:', err);
          setIsLoadingTour(false);
        });
    }
  }, [isOpen, tourSlug]);

  // Calcular precio reactivo según Pax y Tipo de Servicio
  const calculatePrice = (): number => {
    if (!tourData) {
      return initialPrice || 0;
    }

    if (modalServiceType === 'shared') {
      return tourData.sharedPrice ?? initialPrice ?? 0;
    }

    // Servicio privado
    const tiers = tourData.privatePricing || [];
    if (tiers.length === 0) {
      return tourData.sharedPrice ?? initialPrice ?? 0;
    }

    const exactMatch = tiers.find((t: any) => t.pax === modalPax);
    if (exactMatch && exactMatch.price > 0) {
      return exactMatch.price;
    }

    const sorted = [...tiers].sort((a: any, b: any) => a.pax - b.pax);
    const highest = sorted[sorted.length - 1];
    if (highest && modalPax >= highest.pax) {
      return highest.price;
    }

    return sorted[0]?.price || tourData.sharedPrice || initialPrice || 0;
  };

  const calculatedPricePerPax = calculatePrice();
  const calculatedTotal = calculatedPricePerPax * modalPax;

  const handleSave = () => {
    onSave(calculatedPricePerPax);
  };

  if (!mounted && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-250 ease-out ${
        isAnimating
          ? 'bg-black/60 backdrop-blur-xs opacity-100'
          : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto transition-all duration-250 ease-out ${
          isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-3'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X size={16} />
        </button>

        <h3 className="text-base font-bold text-gray-900 mb-4">Modificar Reserva</h3>

        <div className="space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-[#062918]" /> Fecha del Tour
            </label>
            <CalendarUI
              selectedDate={modalDate}
              onSelect={(d) => setModalDate(d)}
            />
          </div>

          {/* Cantidad de Pasajeros y Tipo de Servicio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-[#062918]" /> Pasajeros
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl bg-white h-[42px] px-2">
                <button
                  type="button"
                  onClick={() => setModalPax(Math.max(1, modalPax - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-xs">{modalPax}</span>
                <button
                  type="button"
                  onClick={() => setModalPax(modalPax + 1)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tipo de Servicio */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign size={14} className="text-[#062918]" /> Tipo Servicio
              </label>
              <Select
                value={modalServiceType}
                onValueChange={(val) => setModalServiceType((val as 'shared' | 'private') || 'shared')}
              >
                <SelectTrigger className="h-[42px] rounded-xl text-xs font-medium">
                  {modalServiceType === 'private' ? 'Privado' : 'Compartido'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">Compartido</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumen de Tarifas y Total */}
          <div className="bg-[#062918]/5 rounded-xl p-3.5 space-y-1.5 border border-[#062918]/10">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Precio por pasajero ({modalServiceType === 'private' ? 'Privado' : 'Compartido'}):</span>
              <span className="font-semibold text-gray-900">
                {isLoadingTour ? (
                  <Loader2 size={12} className="animate-spin inline" />
                ) : (
                  formatCurrency(calculatedPricePerPax)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-[#062918]/10">
              <span className="text-xs font-bold text-gray-800">Nuevo Total Estimado ({modalPax} pax):</span>
              <span className="text-base font-bold text-[#062918]">
                {isLoadingTour ? (
                  <Loader2 size={14} className="animate-spin inline" />
                ) : (
                  formatCurrency(calculatedTotal)
                )}
              </span>
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-[#062918] hover:bg-[#0c4028] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
          >
            <Check size={14} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
