'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  durationDays?: number; // p. ej. 2 para tour de 2 días
}

export function Calendar({ selectedDate, onSelect, durationDays = 1 }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const days = ["L", "M", "X", "J", "V", "S", "D"]; // Lunes a Domingo

  // Ajustar primer día para lunes como día 0 (L=0, M=1, X=2, J=3, V=4, S=5, D=6)
  const adjustedFirstDay = (firstDayOfMonth + 6) % 7;

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number, e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const isSelectedStart = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentMonth.getMonth() &&
           selectedDate.getFullYear() === currentMonth.getFullYear();
  };

  const isInRangeDay = (day: number) => {
    if (!selectedDate || durationDays <= 1) return false;
    const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + (durationDays - 1));

    return current > start && current <= end;
  };

  return (
    <div className="p-3 sm:p-4 bg-white border border-gray-200/90 rounded-2xl w-full select-none shadow-2xs">
      {/* Header Mes */}
      <div className="flex justify-between items-center mb-3 bg-[#062918] text-white p-2.5 rounded-xl">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-white/20 rounded-md transition-colors text-white cursor-pointer">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-bold text-xs sm:text-sm capitalize">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={handleNextMonth} className="p-1 hover:bg-white/20 rounded-md transition-colors text-white cursor-pointer">
          <ChevronRight size={18} />
        </button>
      </div>
      
      {/* Cabecera Días */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {days.map(day => (
          <div key={day} className="text-[11px] font-bold text-gray-400 py-0.5">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grilla Días del Mes */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: adjustedFirstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isStart = isSelectedStart(day);
          const inRange = isInRangeDay(day);
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
          
          return (
            <button
              key={day}
              disabled={isPast}
              onClick={(e) => handleDateClick(day, e)}
              className={`h-9 sm:h-10 w-full rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isPast
                  ? 'text-gray-300 bg-gray-50/50 cursor-not-allowed'
                  : isStart 
                    ? 'bg-[#062918] text-white shadow-sm scale-105 z-10' 
                    : inRange
                      ? 'bg-[#062918]/15 text-[#062918] border border-[#062918]/30 font-extrabold'
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Leyenda en la parte inferior */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-3 mt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-200"></span>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-200"></span>
          <span>No disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#062918]"></span>
          <span>Seleccionado</span>
        </div>
      </div>
    </div>
  );
}
