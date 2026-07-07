'use client';

import { useState } from 'react';
import { TourItinerary } from './tour-itinerary';
import { TourFaq } from './tour-faq';
import { Check, X } from 'lucide-react';

export function TourTabs({ tour }: { tour: any }) {
  const [activeTab, setActiveTab] = useState('itinerario');

  const tabs = [
    { id: 'itinerario', label: 'Itinerario' },
    { id: 'inclusiones', label: 'Inclusiones' },
    { id: 'recomendaciones', label: 'Recomendaciones' },
    { id: 'faq', label: 'Preguntas Frecuentes' },
    { id: 'galeria', label: 'Galeria' },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation - Occupy full width */}
      <div className="flex gap-3 w-full overflow-x-auto hide-scrollbar mb-8 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-6 font-semibold text-[15px] whitespace-nowrap rounded-xl transition-all duration-200 text-center border ${
              activeTab === tab.id 
                ? 'border-[#062918] bg-[#062918] text-white' 
                : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'itinerario' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TourItinerary itinerary={tour.itinerary} />
          </div>
        )}

        {activeTab === 'inclusiones' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-lg text-green-600 mb-5 pb-4 border-b border-gray-100">Incluido</h3>
                <ul className="space-y-4">
                  {tour.inclusions.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-gray-600 leading-relaxed">
                      <Check size={20} className="text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-lg text-red-500 mb-5 pb-4 border-b border-gray-100">No Incluido</h3>
                <ul className="space-y-4">
                  {tour.exclusions.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-gray-600 leading-relaxed">
                      <X size={20} className="text-red-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recomendaciones' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-gray-500">
              Contenido de recomendaciones...
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TourFaq faqs={tour.faqs} />
          </div>
        )}

        {activeTab === 'galeria' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-gray-500">
              Contenido de galería...
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
