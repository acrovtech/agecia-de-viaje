'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

const WhatsappIcon = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

import { CONTACT_CONFIG } from '@/lib/contact-config';

const advisors = [
  {
    name: 'Asistencia y Operaciones',
    phone: CONTACT_CONFIG.whatsappOperations,
    role: 'Asesor 24/7',
    avatar: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/asesor-viajes-inca-bound.webp'
  },
  {
    name: 'Reservas y Cotizaciones',
    phone: CONTACT_CONFIG.whatsappNumber,
    role: 'Asesor de Ventas',
    avatar: '/logo.svg' 
  }
];

export function WhatsappButton() {
  const [isOpen, setIsOpen] = useState(false);

  const getWhatsappUrl = (phone: string) => {
    const message = encodeURIComponent('Hola Inca Bound, deseo más información sobre los tours.');
    return `https://wa.me/${phone}?text=${message}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Modal */}
      {isOpen && (
        <div className="mb-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-[#00a884] p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">Chatea con nosotros</h3>
              <p className="text-xs opacity-90">Típicamente respondemos en minutos</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-2 bg-gray-50 flex flex-col gap-1">
            {advisors.map((advisor, idx) => (
              <a
                key={idx}
                href={getWhatsappUrl(advisor.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-xl transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center border border-gray-100">
                  <Image src={advisor.avatar} alt={advisor.name} fill sizes="40px" className="object-cover" unoptimized={true} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-[#00a884] transition-colors">{advisor.name}</p>
                  <p className="text-xs text-gray-500">{advisor.role}</p>
                </div>
                <div className="text-[#00a884]">
                  <WhatsappIcon size={18} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 overflow-hidden"
        aria-label="Contactar por WhatsApp"
      >
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
          <WhatsappIcon size={28} />
        </div>
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
          <X size={28} />
        </div>
      </button>
    </div>
  );
}
