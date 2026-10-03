'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Users, DollarSign, Check, Loader2, Sparkles, Minus, Plus } from 'lucide-react';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { formatCurrency } from '@repo/ui/lib/currency';
import { formatSpanishDate } from '@repo/ui/lib/date-utils';

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
      const timer = setTimeout(() => setMounted(false), 200);
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

  const formattedSelectedDate = modalDate
    ? formatSpanishDate(modalDate.toISOString(), 'long')
    : 'Selecciona una fecha';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-200 ease-out ${
        isAnimating
          ? 'bg-black/60 backdrop-blur-sm opacity-100'
          : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 relative max-h-[92vh] flex flex-col overflow-hidden transition-all duration-200 ease-out ${
          isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-3'
        }`}
      >
        {/* Header con gradiente sutil y badges */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-gray-50/70 to-white">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#062918] bg-[#062918]/10 px-2 py-0.5 rounded-full">
              <Sparkles size={11} className="text-[#062918]" />
              Modificar Reserva
            </span>
            <h3 id="modal-edit-title" className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
              {tourTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Selector de Fecha */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-gray-800 flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-[#062918]" />
                Fecha del Tour
              </label>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {formattedSelectedDate}
              </span>
            </div>

            <div className="border border-gray-200/90 rounded-xl p-3 bg-gray-50/40 shadow-2xs">
              <CalendarUI
                selectedDate={modalDate}
                onSelect={(d) => setModalDate(d)}
              />
            </div>
          </div>

          {/* 2. Cantidad de Pasajeros y Tipo de Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pasajeros Stepper */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Users size={14} className="text-[#062918]" />
                Pasajeros
              </label>
              <div className="flex items-center justify-between border border-gray-200 rounded-xl bg-white h-[44px] px-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setModalPax(Math.max(1, modalPax - 1))}
                  disabled={modalPax <= 1}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  aria-label="Disminuir pasajeros"
                >
                  <Minus size={14} />
                </button>
                <div className="text-center">
                  <span className="font-extrabold text-sm text-gray-900">{modalPax}</span>
                  <span className="text-[10px] text-gray-500 block -mt-0.5">{modalPax === 1 ? 'viajero' : 'viajeros'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalPax(modalPax + 1)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95"
                  aria-label="Aumentar pasajeros"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Tipo de Servicio Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <DollarSign size={14} className="text-[#062918]" />
                Modalidad de Servicio
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl h-[44px] items-center">
                <button
                  type="button"
                  onClick={() => setModalServiceType('shared')}
                  className={`h-[36px] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    modalServiceType === 'shared'
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {modalServiceType === 'shared' && <Check size={12} className="text-[#062918]" />}
                  Compartido
                </button>
                <button
                  type="button"
                  onClick={() => setModalServiceType('private')}
                  className={`h-[36px] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    modalServiceType === 'private'
                      ? 'bg-white text-gray-900 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {modalServiceType === 'private' && <Check size={12} className="text-[#062918]" />}
                  Privado
                </button>
              </div>
            </div>
          </div>

          {/* 3. Resumen de Tarifas con estética Premium */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-[#062918] to-[#0c3e27] text-white shadow-md space-y-2.5">
            <div className="flex items-center justify-between text-xs text-emerald-100/90">
              <span>Tarifa por pasajero ({modalServiceType === 'private' ? 'Privado' : 'Compartido'}):</span>
              <span className="font-bold text-white text-sm">
                {isLoadingTour ? (
                  <Loader2 size={13} className="animate-spin inline" />
                ) : (
                  formatCurrency(calculatedPricePerPax)
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-400/20 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-200 block">Total Estimado ({modalPax} {modalPax === 1 ? 'pax' : 'pax'}):</span>
                <span className="text-[10px] text-emerald-300/80">Impuestos y tarifas incluidos</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isLoadingTour ? (
                  <Loader2 size={18} className="animate-spin inline" />
                ) : (
                  formatCurrency(calculatedTotal)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#062918] hover:bg-[#0c4028] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} />
            Actualizar Reserva
          </button>
        </div>
      </div>
    </div>
  );
}
