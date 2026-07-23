'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

export function Calendar({ selectedDate, onSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const days = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

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

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentMonth.getMonth() &&
           selectedDate.getFullYear() === currentMonth.getFullYear();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === currentMonth.getMonth() &&
           today.getFullYear() === currentMonth.getFullYear();
  };

  return (
    <div className="p-3 sm:p-4 bg-white border border-gray-200 rounded-xl w-full select-none">
      <div className="flex justify-between items-center mb-3">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-bold text-xs sm:text-sm text-gray-900 capitalize">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
          <ChevronRight size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 py-0.5">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(day);
          const today = isToday(day);
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
          
          return (
            <button
              key={day}
              disabled={isPast}
              onClick={(e) => handleDateClick(day, e)}
              className={`h-8 sm:h-9 w-full rounded-md flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                isPast
                  ? 'text-gray-300 cursor-not-allowed'
                  : selected 
                    ? 'bg-[#062918] text-white font-bold shadow-xs' 
                    : today
                      ? 'bg-gray-50 border border-gray-200 text-[#062918] font-bold hover:bg-gray-100'
                      : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
