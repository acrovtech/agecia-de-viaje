'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

const certificates = [
  { id: 1, title: 'Registro SUNAT', image: '/cert-sunat.webp' },
  { id: 2, title: 'Permisos Oficiales', image: '/cert-permisos.webp' },
  { id: 3, title: 'Licencia de Funcionamiento', image: '/cert-licencia.webp' },
  { id: 4, title: 'Constancia DIRCETUR', image: '/cert-dircetur.webp' }
];

export function CertificatesSection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Close modal when clicking escape key
  if (typeof window !== 'undefined') {
    window.onkeydown = (e) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
  }

  return (
    <section className="py-24 bg-[#F9FAFA]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="section-title">Certificados y Reconocimientos</h2>
          <p className="text-gray-600 text-lg">
            Estamos respaldados por las instituciones turísticas más importantes, garantizando un servicio formal, seguro y de altísima calidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {certificates.map((cert) => (
            <div key={cert.id} className="flex flex-col items-center">
              <div 
                onClick={() => setSelectedImage(cert.image)}
                className="relative group cursor-pointer overflow-hidden aspect-[3/4] bg-white block w-full rounded-lg shadow-sm hover:shadow-xl transition-all border border-gray-200"
              >
                {/* Background Image */}
                <Image 
                  src={cert.image} 
                  alt={cert.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Zoom Icon Overlay on Hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                    <ZoomIn className="w-6 h-6 text-brand-teal" />
                  </div>
                </div>
              </div>
              {/* Title positioned outside and below the card */}
              <h3 className="text-gray-900 text-[16px] font-semibold mt-4 text-center px-2">
                {cert.title}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-300 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-brand-teal transition-colors z-50"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-10 h-10" />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Certificado Ampliado" 
            className="max-w-[90vw] max-h-[90vh] object-contain animate-modal-enter shadow-2xl rounded-sm cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </section>
  );
}
