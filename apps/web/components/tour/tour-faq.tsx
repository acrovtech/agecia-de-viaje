'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function TourFaq({ faqs }: { faqs: any[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="flex flex-col border-t border-gray-200 mt-4 bg-white">
      {faqs.map((faq, index) => {
        const isOpen = openFaq === index;
        
        return (
          <div key={index} className="flex flex-col border-b border-gray-200">
            {/* Cabecera del Acordeón FAQ */}
            <button 
              onClick={() => toggleFaq(index)}
              className={`w-full flex items-center justify-between px-6 py-4 md:py-5 text-left transition-colors hover:bg-gray-50/50 ${
                isOpen ? 'text-[#062918]' : 'text-gray-800'
              }`}
            >
              <h3 className="font-semibold text-[15px] md:text-base leading-snug pr-4">
                {faq.question}
              </h3>
              <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#062918]' : 'text-gray-400'}`}>
                <ChevronDown size={24} />
              </div>
            </button>

            {/* Contenido Desplegable */}
            <div 
              className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${
                isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
              }`}
            >
              <div className="px-6 pb-6">
                <p className="text-gray-600 leading-relaxed text-[15px]">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
