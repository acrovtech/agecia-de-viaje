'use client';

import * as React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfDay,
  subDays,
  addDays,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onApply: (start: string, end: string) => void;
  onClear: () => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onApply,
  onClear,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse initial dates
  const initialStart = startDate ? parseISO(startDate) : null;
  const initialEnd = endDate ? parseISO(endDate) : null;

  const [tempStart, setTempStart] = React.useState<Date | null>(initialStart);
  const [tempEnd, setTempEnd] = React.useState<Date | null>(initialEnd);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  // Base month for dual calendar
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    if (initialStart) return startOfMonth(initialStart);
    return startOfMonth(new Date());
  });

  // Sync temp dates when props change or popover opens
  React.useEffect(() => {
    setTempStart(startDate ? parseISO(startDate) : null);
    setTempEnd(endDate ? parseISO(endDate) : null);
    if (startDate) {
      setCurrentMonth(startOfMonth(parseISO(startDate)));
    }
  }, [startDate, endDate, isOpen]);

  const nextMonth = React.useMemo(() => addMonths(currentMonth, 1), [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const handleDayClick = (day: Date) => {
    const cleanDay = startOfDay(day);

    if (!tempStart || (tempStart && tempEnd)) {
      // Start fresh range
      setTempStart(cleanDay);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (isBefore(cleanDay, tempStart)) {
        setTempEnd(tempStart);
        setTempStart(cleanDay);
      } else {
        setTempEnd(cleanDay);
      }
    }
  };

  const applyPreset = (preset: string) => {
    const today = startOfDay(new Date());
    let start: Date = today;
    let end: Date = today;

    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'next3':
        start = today;
        end = addDays(today, 3);
        break;
      case 'next7':
        start = today;
        end = addDays(today, 7);
        break;
      case 'next30':
        start = today;
        end = addDays(today, 30);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'last7':
        start = subDays(today, 7);
        end = today;
        break;
      case 'last30':
        start = subDays(today, 30);
        end = today;
        break;
      case 'last3Months':
        start = subMonths(today, 3);
        end = today;
        break;
      case 'last6Months':
        start = subMonths(today, 6);
        end = today;
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }

    setTempStart(start);
    setTempEnd(end);
    setCurrentMonth(startOfMonth(start));
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onApply(format(tempStart, 'yyyy-MM-dd'), format(tempEnd, 'yyyy-MM-dd'));
    } else if (tempStart && !tempEnd) {
      onApply(format(tempStart, 'yyyy-MM-dd'), format(tempStart, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onClear();
    setIsOpen(false);
  };

  // Render a calendar month grid
  const renderCalendar = (monthDate: Date, isLeft: boolean) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Sunday = 0, Monday = 1, ...
    const startDayOfWeek = monthStart.getDay();
    const emptyPrefix = Array.from({ length: startDayOfWeek });

    const weekHeaders = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
      <div className="flex flex-col w-64 select-none">
        {/* Month Header Navigation */}
        <div className="flex items-center justify-between h-9 px-1 mb-2">
          {isLeft ? (
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="font-semibold text-xs text-slate-800 capitalize">
            {format(monthDate, 'MMMM yyyy', { locale: es })}
          </div>

          {!isLeft ? (
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {weekHeaders.map((header, idx) => (
            <div key={idx} className="text-[10px] font-semibold text-slate-400 h-6 flex items-center justify-center">
              {header}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
          {emptyPrefix.map((_, i) => (
            <div key={`empty-${i}`} className="h-8 w-8" />
          ))}

          {days.map((day) => {
            const cleanDay = startOfDay(day);
            const isStart = tempStart && isSameDay(cleanDay, tempStart);
            const isEnd = tempEnd && isSameDay(cleanDay, tempEnd);
            const isSingle = isStart && !tempEnd;

            // Check if within selected or preview interval
            let inRange = false;
            if (tempStart && tempEnd) {
              inRange = isWithinInterval(cleanDay, { start: tempStart, end: tempEnd });
            } else if (tempStart && !tempEnd && hoverDate) {
              const rangeStart = isBefore(hoverDate, tempStart) ? hoverDate : tempStart;
              const rangeEnd = isBefore(hoverDate, tempStart) ? tempStart : hoverDate;
              inRange = isWithinInterval(cleanDay, { start: rangeStart, end: rangeEnd });
            }

            const isToday = isSameDay(cleanDay, new Date());

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoverDate(cleanDay)}
                className={cn(
                  'h-8 w-8 text-xs font-medium flex items-center justify-center transition-all cursor-pointer relative',
                  // In range styling (Shopify Polaris neutral slate-100)
                  inRange && !isStart && !isEnd && 'bg-slate-100 text-slate-900 rounded-none font-medium',
                  // Range start (Shopify Polaris solid slate-900)
                  isStart && 'bg-slate-900 text-white font-bold rounded-l-lg',
                  // Range end (Shopify Polaris solid slate-900)
                  isEnd && 'bg-slate-900 text-white font-bold rounded-r-lg',
                  // Single selected
                  isSingle && 'rounded-lg bg-slate-900 text-white font-bold',
                  // Unselected hover
                  !inRange && !isStart && !isEnd && 'rounded-lg hover:bg-slate-100 text-slate-700',
                  // Today outline if not selected
                  isToday && !isStart && !isEnd && !inRange && 'ring-1 ring-slate-400 font-bold text-slate-900'
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Formatted trigger label
  const formattedTriggerLabel = React.useMemo(() => {
    if (startDate && endDate) {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      if (isSameDay(s, e)) {
        return format(s, "d 'de' MMM, yyyy", { locale: es });
      }
      return `${format(s, "d MMM", { locale: es })} – ${format(e, "d MMM, yyyy", { locale: es })}`;
    }
    return 'Filtrar por fecha de viaje';
  }, [startDate, endDate]);

  const formattedDisplayRange = React.useMemo(() => {
    if (tempStart && tempEnd) {
      return `${format(tempStart, "d MMMM yyyy", { locale: es })}  –  ${format(tempEnd, "d MMMM yyyy", { locale: es })}`;
    }
    if (tempStart) {
      return `${format(tempStart, "d MMMM yyyy", { locale: es })}  –  Selecciona fin`;
    }
    return 'Selecciona un rango de fechas';
  }, [tempStart, tempEnd]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center justify-between gap-2.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs select-none',
          startDate || endDate
            ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className={cn('w-3.5 h-3.5 shrink-0', startDate || endDate ? 'text-slate-300' : 'text-slate-500')} />
          <span className="truncate">{formattedTriggerLabel}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(startDate || endDate) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          )}
          <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-auto p-0 bg-white border border-slate-200/90 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex flex-col md:flex-row">
          
          {/* 1. Left Sidebar: Presets */}
          <div className="w-full md:w-44 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-100 p-3 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
              Personalizado »
            </div>

            <div className="flex flex-col gap-0.5 text-xs">
              {[
                { id: 'today', label: 'Hoy' },
                { id: 'next3', label: 'Próximos 3 días' },
                { id: 'next7', label: 'Próximos 7 días' },
                { id: 'next30', label: 'Próximos 30 días' },
                { id: 'thisMonth', label: 'Este mes' },
                { id: 'last7', label: 'Últimos 7 días' },
                { id: 'last30', label: 'Últimos 30 días' },
                { id: 'last3Months', label: 'Últimos 3 meses' },
                { id: 'thisYear', label: 'Todo el año' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Right Main Panel: Top Bar & Dual Calendar */}
          <div className="flex flex-col p-4">
            {/* Top Bar matching Image 2 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 select-all">
                {formattedDisplayRange}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  Aplicar
                </button>
              </div>
            </div>

            {/* Dual Calendar View */}
            <div className="flex flex-col md:flex-row items-start gap-6">
              {renderCalendar(currentMonth, true)}
              <div className="hidden md:block w-px bg-slate-100 self-stretch" />
              {renderCalendar(nextMonth, false)}
            </div>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}
