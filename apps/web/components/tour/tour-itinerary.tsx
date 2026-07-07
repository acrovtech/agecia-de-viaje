'use client';

import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

export function TourItinerary({ itinerary }: { itinerary: any[] }) {
  // Mantener abierto el Día 1 por defecto
  const [openDay, setOpenDay] = useState<number | null>(1);

  const toggleDay = (dayIndex: number) => {
    if (openDay === dayIndex) {
      setOpenDay(null);
    } else {
      setOpenDay(dayIndex);
    }
  };

  return (
    <div className="flex flex-col border-t border-gray-200 bg-white">
      {itinerary.map((dayData, index) => {
        const isOpen = openDay === dayData.day;
        
        return (
          <div key={index} className="flex flex-col border-b border-gray-200">
            {/* Cabecera del Acordeón */}
            <button 
              onClick={() => toggleDay(dayData.day)}
              className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50/50 ${
                isOpen ? 'text-[#062918]' : 'text-gray-800'
              }`}
            >
              <h3 className="font-semibold text-base">
                <span className={`font-bold mr-2 ${isOpen ? 'text-[#062918]' : 'text-gray-900'}`}>Día {dayData.day}:</span>
                {dayData.title}
              </h3>
              <div className={`shrink-0 transition-transform duration-300 ml-4 ${isOpen ? 'rotate-180 text-[#062918]' : 'text-gray-400'}`}>
                <ChevronDown size={24} />
              </div>
            </button>

            {/* Contenido Desplegable */}
            <div 
              className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${
                isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
              }`}
            >
              <div className="px-6 pb-6">
                <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                  {dayData.description}
                </p>
                
                {/* Detalles técnicos del día (grid) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-5 mt-2">
                  {dayData.details.map((detail: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">{detail.label}</span>
                      <span className="font-medium text-gray-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
