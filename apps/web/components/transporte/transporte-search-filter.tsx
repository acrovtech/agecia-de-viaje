'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ArrowLeftRight, 
  MapPin, 
  Plane, 
  Building2, 
  Train, 
  Compass, 
  ChevronDown, 
  Check,
  RotateCcw
} from 'lucide-react';

interface SearchFilterProps {
  origins: string[];
  destinations: string[];
  selectedOrigin: string;
  selectedDestination: string;
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onSwap: () => void;
}

export function TransporteSearchFilter({
  origins,
  destinations,
  selectedOrigin,
  selectedDestination,
  onOriginChange,
  onDestinationChange,
  onSwap,
}: SearchFilterProps) {
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setIsOriginOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setIsDestOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const getIconForLocation = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('aeropuerto') || lower.includes('aerop')) {
      return <Plane className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    if (lower.includes('tren') || lower.includes('estación') || lower.includes('estacion') || lower.includes('poroy') || lower.includes('wanchaq')) {
      return <Train className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (lower.includes('hotel') || lower.includes('centro')) {
      return <Building2 className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (lower.includes('soraypampa') || lower.includes('ollantaytambo') || lower.includes('urubamba') || lower.includes('valle')) {
      return <Compass className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    return <MapPin className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  const hasFilters = Boolean(selectedOrigin || selectedDestination);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-gray-200/90 relative z-20">
      
      {/* Top Header Row with Reset Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 font-heading">
          <Search className="w-4 h-4 text-[#0d9488]" />
          <span>Busca tu traslado</span>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              onOriginChange('');
              onDestinationChange('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d9488] hover:text-[#062918] transition-colors py-1 px-2.5 rounded-lg hover:bg-emerald-50/60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Dropdown DESDE (5 cols) */}
        <div ref={originRef} className="md:col-span-5 relative">
          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Desde</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setIsOriginOpen(!isOriginOpen);
              setIsDestOpen(false);
            }}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white text-left text-sm font-medium text-gray-900 flex items-center justify-between transition-all hover:border-[#062918] focus:ring-2 focus:ring-[#062918] focus:bg-white"
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              {getIconForLocation(selectedOrigin)}
              <span className="truncate">{selectedOrigin || 'Cualquier punto'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOriginOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOriginOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => {
                  onOriginChange('');
                  setIsOriginOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  !selectedOrigin ? 'font-bold text-[#062918] bg-slate-50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Todos los puntos de partida</span>
                </div>
                {!selectedOrigin && <Check className="w-3.5 h-3.5 text-[#062918]" />}
              </button>

              {origins.map((origin) => {
                const isSelected = selectedOrigin === origin;
                return (
                  <button
                    key={origin}
                    type="button"
                    onClick={() => {
                      onOriginChange(origin);
                      setIsOriginOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isSelected ? 'font-bold text-[#062918] bg-emerald-50/50' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {getIconForLocation(origin)}
                      <span className="truncate">{origin}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#062918] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Botón SWAP (2 cols) */}
        <div className="md:col-span-2 flex items-center justify-center pt-2 md:pt-5">
          <button
            type="button"
            onClick={onSwap}
            title="Intercambiar origen y destino"
            className="w-10 h-10 rounded-full bg-[#062918] hover:bg-[#008060] text-white flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown HASTA (5 cols) */}
        <div ref={destRef} className="md:col-span-5 relative">
          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            <span>Hasta</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setIsDestOpen(!isDestOpen);
              setIsOriginOpen(false);
            }}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white text-left text-sm font-medium text-gray-900 flex items-center justify-between transition-all hover:border-[#062918] focus:ring-2 focus:ring-[#062918] focus:bg-white"
          >
            <div className="flex items-center gap-2.5 truncate pr-2">
              {getIconForLocation(selectedDestination)}
              <span className="truncate">{selectedDestination || 'Cualquier punto'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDestOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDestOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => {
                  onDestinationChange('');
                  setIsDestOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  !selectedDestination ? 'font-bold text-[#062918] bg-slate-50' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Todos los destinos</span>
                </div>
                {!selectedDestination && <Check className="w-3.5 h-3.5 text-[#062918]" />}
              </button>

              {destinations.map((dest) => {
                const isSelected = selectedDestination === dest;
                return (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => {
                      onDestinationChange(dest);
                      setIsDestOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isSelected ? 'font-bold text-[#062918] bg-rose-50/50' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {getIconForLocation(dest)}
                      <span className="truncate">{dest}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#062918] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
