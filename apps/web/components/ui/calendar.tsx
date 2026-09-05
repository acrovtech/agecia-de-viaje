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
  
  const days = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  const now = new Date();
  const isCurrentMonth = currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() === now.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev.getFullYear() < now.getFullYear() || (prev.getFullYear() === now.getFullYear() && prev.getMonth() < now.getMonth())) {
      return;
    }
    setCurrentMonth(prev);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number, e: React.MouseEvent) => {
    e.preventDefault();
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) return;
    onSelect(dateObj);
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
    <div className="p-3 bg-white border border-gray-200/80 rounded-xl w-full select-none shadow-2xs">
      {/* Header Mes */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
        <button 
          onClick={handlePrevMonth} 
          disabled={isCurrentMonth}
          className={`p-1 rounded-md transition-colors ${
            isCurrentMonth 
              ? 'opacity-30 cursor-not-allowed text-gray-300' 
              : 'hover:bg-gray-100 text-gray-500 cursor-pointer'
          }`}
          title={isCurrentMonth ? 'No se pueden consultar meses pasados' : 'Mes anterior'}
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-bold text-xs text-gray-800 capitalize tracking-tight">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-500 cursor-pointer" title="Mes siguiente">
          <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Cabecera Días */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {days.map(day => (
          <div key={day} className="text-[10px] font-bold text-gray-400 py-0.5 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grilla Días del Mes */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square w-full" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isStart = isSelectedStart(day);
          const inRange = isInRangeDay(day);
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPast = dateObj < today;
          
          return (
            <button
              key={day}
              disabled={isPast}
              onClick={(e) => handleDateClick(day, e)}
              className={`aspect-square w-full rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                isPast
                  ? 'text-gray-300 cursor-not-allowed opacity-40 select-none'
                  : isStart 
                    ? 'bg-[#062918] text-white font-bold shadow-2xs cursor-pointer' 
                    : inRange
                      ? 'bg-[#062918]/12 text-[#062918] border border-[#062918]/25 font-bold cursor-pointer'
                      : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Leyenda en la parte inferior */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 mt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
          <span>Disponible</span>
        </div>
        {durationDays > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#062918]/20 border border-[#062918]/40"></span>
            <span>Día 2 (Multidía)</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#062918]"></span>
          <span>Seleccionado</span>
        </div>
      </div>
    </div>
  );
}
