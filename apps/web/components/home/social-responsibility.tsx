import Image from 'next/image';
import { TreePine, Users, HeartHandshake } from 'lucide-react';

const bentoItems = [
  {
    id: 'reforestacion',
    title: 'Proyecto de Reforestación',
    description: 'Comprometidos con devolverle a la Pachamama lo que nos da. Reforestamos los Andes peruanos con especies nativas.',
    image: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/reforestacion.webp', 
    icon: TreePine,
    className: 'md:col-span-2 md:row-span-2 min-h-[320px] md:min-h-[500px]',
  },
  {
    id: 'comunidades',
    title: 'Ayuda a Comunidades',
    description: 'Turismo ético e inversión directa en educación y salud para familias de nuestros arrieros y porteadores.',
    image: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/comunidades.webp', 
    icon: Users,
    className: 'md:col-span-1 md:row-span-1 min-h-[250px]',
  },
  {
    id: 'recreacion',
    title: 'Campañas de Recreación',
    description: 'Llevando alegría, útiles escolares y chocolatadas a los niños de las comunidades más alejadas de Cusco.',
    image: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/recreacion.webp', 
    icon: HeartHandshake,
    className: 'md:col-span-1 md:row-span-1 min-h-[250px]',
  }
];

export function SocialResponsibility() {
  return (
    <section className="py-24 bg-[#F9FAFA] relative">
      <div className="container mx-auto px-4">
        <div className="mb-16">
          <h2 className="section-title">
            Responsabilidad Social
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-center">
            Nuestra responsabilidad social no es una opción, es el núcleo de nuestra misión. Conoce cómo tu viaje genera un impacto positivo en Perú.
          </p>
        </div>

        {/* Bento Grid con Hover Fade-In */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-fr gap-6">
          {bentoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`relative group rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-700 bg-black ${item.className}`}
              >
                {/* Background Image de Cloudflare R2 */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized={true}
                  className="object-cover transition-transform duration-700 group-hover:scale-105 z-0 opacity-90"
                />
                
                {/* Dark Overlay - Intensifica en Hover */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/70 transition-colors duration-700 z-10" />

                {/* Content: Centered Icon, Title and Hover Fade-In Description */}
                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center z-20">
                  <div className="mb-3 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <Icon className="w-10 h-10 text-white drop-shadow-md" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide drop-shadow-md mb-2">
                    {item.title}
                  </h3>
                  
                  {/* Texto de Descripción con Fade-In al hacer Hover */}
                  <p className="text-xs md:text-sm text-emerald-100/90 max-w-sm font-medium opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 leading-relaxed px-2">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
