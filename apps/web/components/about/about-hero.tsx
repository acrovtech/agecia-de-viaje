import Image from 'next/image';

export function AboutHero() {
  return (
    <section className="relative bg-white py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch w-full">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 tracking-tight leading-tight">
              Nuestra Pasión es <span className="text-brand-teal">Conectar</span> el Mundo con los Andes
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              En Inca Bound, no solo organizamos viajes; creamos experiencias transformadoras. Nacimos en el corazón de los Andes con la misión de compartir la riqueza de nuestra herencia cultural inca, fomentando un turismo sostenible y de profundo respeto hacia la Pachamama (Madre Tierra) y nuestras comunidades locales.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Cada itinerario está diseñado meticulosamente por guías expertos que conocen cada piedra de nuestras montañas, garantizándote aventura, seguridad e historias inolvidables.
            </p>
          </div>

          <div className="relative h-full w-full min-h-[400px]">
            <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
              {/* Left tall image (Andes / Montaña) */}
              <div className="relative row-span-2 rounded-2xl overflow-hidden shadow-lg group">
                <Image 
                  src="/andes-hiker-custom.webp" 
                  alt="Aventura en los Andes" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              
              {/* Top right image (Naturaleza / Laguna) */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg group">
                <Image 
                  src="/andes-lake-custom.webp" 
                  alt="Naturaleza andina" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>

              {/* Bottom right image (Naturaleza / Colores) */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg group">
                <Image 
                  src="/andes-llama-custom.webp" 
                  alt="Paisajes y colores" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-brand-teal/10 rounded-full blur-2xl -z-10" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-green/10 rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
