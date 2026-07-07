'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, TreePine, Users, HeartHandshake, ArrowUpRight } from 'lucide-react';

const bentoItems = [
  {
    id: 'reforestacion',
    title: 'Proyecto de Reforestación',
    description: 'Comprometidos con devolverle a la Pachamama lo que nos da. Reforestamos los Andes peruanos.',
    fullText: 'Nuestro proyecto de reforestación se enfoca en plantar especies nativas como la Queuña y la Chachacoma en las alturas del Valle Sagrado y el Camino Inca. Esta iniciativa no solo ayuda a combatir el cambio climático global, sino que previene la erosión del suelo andino y restaura los ecosistemas para la fauna local. Por cada grupo de viajeros que reserva un paquete de caminata con nosotros, financiamos la siembra y el cuidado de nuevos árboles nativos en colaboración con las comunidades campesinas.',
    image: '/fallback.svg', 
    icon: TreePine,
    className: 'md:col-span-2 md:row-span-2 min-h-[300px] md:min-h-[500px]',
  },
  {
    id: 'comunidades',
    title: 'Ayuda a Comunidades',
    description: 'Turismo ético y sostenible con impacto directo.',
    fullText: 'Creemos firmemente en un turismo que beneficie directamente a las poblaciones originarias. Invertimos una parte de nuestras ganancias anuales en proyectos de infraestructura básica, salud y educación en las comunidades altoandinas de donde provienen nuestros porteadores, cocineros y arrieros. Garantizamos salarios justos, equipamiento adecuado de montaña y un seguro de salud para todo nuestro equipo en ruta.',
    image: '/fallback.svg', 
    icon: Users,
    className: 'md:col-span-1 md:row-span-1 min-h-[250px]',
  },
  {
    id: 'recreacion',
    title: 'Campañas de Recreación',
    description: 'Llevando sonrisas a los niños de los Andes.',
    fullText: 'Más allá del impacto económico, buscamos nutrir el espíritu. Durante las festividades, especialmente en Navidad, organizamos caravanas y campañas de recreación en las aldeas más remotas de Cusco. Llevamos juguetes, ropa abrigadora, útiles escolares y organizamos chocolatadas y torneos deportivos infantiles. El turismo es un puente, y nosotros lo usamos para llevar alegría a quienes más lo necesitan.',
    image: '/fallback.svg', 
    icon: HeartHandshake,
    className: 'md:col-span-1 md:row-span-1 min-h-[250px]',
  }
];

export function SocialResponsibility() {
  const [selectedItem, setSelectedItem] = useState<(typeof bentoItems)[0] | null>(null);

  return (
    <section className="py-24 bg-[#F9FAFA] relative">
      <div className="container mx-auto px-4">
        <div className="mb-16">
          <h2 className="section-title">
            Responsabilidad Social
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-center">
            Nuestra responsabilidad social no es una opción, es el núcleo de Inca Bound. Conoce cómo tu viaje genera un impacto positivo en Perú.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-fr gap-6">
          {bentoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`relative group rounded-[24px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700 bg-black ${item.className}`}
              >
                {/* Background Image */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 z-0 opacity-90"
                />
                
                {/* Overlay: Oscuro por defecto y un poco más oscuro en hover para enfocar */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors duration-700 z-10" />

                {/* Content: Centered Icon and Title */}
                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center z-20">
                  <div className="mb-4 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <Icon className="w-10 h-10 text-white drop-shadow-md" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide transform group-hover:translate-y-2 transition-transform duration-500 drop-shadow-md">
                    {item.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal - Utilizando el mismo backdrop glassmorphism del megamenu */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Blur igual al Megamenu con fade-in suave */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[10px] transition-opacity animate-in fade-in duration-500" 
            onClick={() => setSelectedItem(null)}
          />
          
          {/* Modal Content - Animación súper suave de entrada (Personalizada) */}
          <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-modal-enter">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative h-[250px] w-full">
              <Image
                src={selectedItem.image}
                alt={selectedItem.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <div className="flex items-center gap-3 mb-2">
                  <selectedItem.icon className="w-6 h-6 text-white" />
                  <h3 className="text-3xl font-bold text-white">{selectedItem.title}</h3>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Nuestro Impacto</h4>
              <p className="text-gray-700 leading-relaxed text-lg">
                {selectedItem.fullText}
              </p>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

