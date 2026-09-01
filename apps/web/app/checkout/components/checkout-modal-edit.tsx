'use client';

import { X, Calendar, Users, DollarSign, Check } from 'lucide-react';
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
  onSave: () => void;
  tourTitle?: string;
  pricePerPax: number;
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
  pricePerPax,
}: CheckoutModalEditProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <h3 className="text-base font-bold text-gray-900 mb-1">Modificar Reserva</h3>
        <p className="text-xs text-gray-500 mb-4">{tourTitle}</p>

        <div className="space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-[#062918]" /> Fecha del Tour
            </label>
            <div className="border border-gray-200 rounded-xl p-2 flex justify-center bg-gray-50/50">
              <CalendarUI
                selectedDate={modalDate}
                onSelect={(d) => setModalDate(d)}
              />
            </div>
          </div>

          {/* Cantidad de Pasajeros */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-[#062918]" /> Pasajeros
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl bg-white h-[42px] px-2">
                <button
                  type="button"
                  onClick={() => setModalPax(Math.max(1, modalPax - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-xs">{modalPax}</span>
                <button
                  type="button"
                  onClick={() => setModalPax(modalPax + 1)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
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
                <SelectTrigger className="h-[42px] rounded-xl text-xs">
                  {modalServiceType === 'private' ? 'Privado' : 'Compartido'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">Compartido</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumen de Total */}
          <div className="bg-[#062918]/5 rounded-xl p-3.5 flex items-center justify-between border border-[#062918]/10">
            <span className="text-xs font-semibold text-gray-700">Nuevo Total Estimado:</span>
            <span className="text-base font-bold text-[#062918]">
              {formatCurrency(pricePerPax * modalPax)}
            </span>
          </div>

          {/* Botón Guardar */}
          <button
            type="button"
            onClick={onSave}
            className="w-full py-3 bg-[#062918] hover:bg-[#0c4028] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Check size={14} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
