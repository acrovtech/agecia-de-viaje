'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TourItinerary } from './tour-itinerary';
import { TourFaq } from './tour-faq';
import { Check, X, Compass } from 'lucide-react';

export function TourTabs({ tour }: { tour: any }) {
  const [activeTab, setActiveTab] = useState('itinerario');

  const tabs = [
    { id: 'itinerario', label: 'Itinerario' },
    { id: 'inclusiones', label: 'Inclusiones' },
    { id: 'recomendaciones', label: 'Recomendaciones' },
    { id: 'faq', label: 'Preguntas Frecuentes' },
    { id: 'galeria', label: 'Galería' },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
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
            <TourItinerary itinerary={tour.itinerary || []} />
          </div>
        )}

        {activeTab === 'inclusiones' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-green-600 mb-5 pb-4 border-b border-gray-100 flex items-center gap-2">
                  <Check className="text-green-500" size={22} /> Qué incluye
                </h3>
                <ul className="space-y-4">
                  {tour.inclusions && tour.inclusions.length > 0 ? (
                    tour.inclusions.map((item: string, idx: number) => (
                      <li key={idx} className="flex gap-3 text-gray-600 leading-relaxed text-sm">
                        <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-sm italic">Sin incluir especificado</li>
                  )}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-red-500 mb-5 pb-4 border-b border-gray-100 flex items-center gap-2">
                  <X className="text-red-500" size={22} /> No incluye
                </h3>
                <ul className="space-y-4">
                  {tour.exclusions && tour.exclusions.length > 0 ? (
                    tour.exclusions.map((item: string, idx: number) => (
                      <li key={idx} className="flex gap-3 text-gray-600 leading-relaxed text-sm">
                        <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-sm italic">Sin exclusiones especificadas</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recomendaciones' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                <Compass className="text-[#062918]" size={22} /> Recomendaciones para tu viaje
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tour.recommendations && tour.recommendations.length > 0 ? (
                  tour.recommendations.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-gray-700 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 text-sm">
                      <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-sm italic col-span-2">Sin recomendaciones registradas</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TourFaq faqs={tour.faqs || []} />
          </div>
        )}

        {activeTab === 'galeria' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-6 pb-4 border-b border-gray-100">Galería del Tour</h3>
              {tour.images && tour.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tour.images.map((url: string, idx: number) => (
                    <div key={idx} className="relative h-64 rounded-xl overflow-hidden shadow-md">
                      <Image src={url} alt={`Foto ${idx + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No hay imágenes adicionales en la galería</p>
              )}
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
