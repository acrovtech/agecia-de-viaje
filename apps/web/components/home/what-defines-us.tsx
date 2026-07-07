import { Compass, ShieldCheck, Leaf } from 'lucide-react';

const features = [
  {
    icon: Compass,
    title: 'Expertos Locales',
    description: 'Somos guías andinos nacidos y criados en estas tierras. Conocemos los secretos y las historias de cada rincón de nuestra cultura inca.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad Garantizada',
    description: 'Tu tranquilidad es nuestra máxima prioridad. Contamos con equipos de rescate, primeros auxilios y logística de alta montaña para que viajes sin preocupaciones.',
  },
  {
    icon: Leaf,
    title: 'Turismo Sostenible',
    description: 'Viajar con nosotros significa proteger la Pachamama. Promovemos prácticas ecológicas y trabajamos directamente con las comunidades originarias.',
  }
];

export function WhatDefinesUs() {
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="section-title">Lo que nos define</h2>
        <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-16">
          Nuestra filosofía se basa en el respeto profundo por nuestra cultura y el compromiso absoluto con tu experiencia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 flex flex-col items-center text-center group relative overflow-hidden"
              >
                {/* Corner borders */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-gray-200 group-hover:border-brand-teal transition-colors duration-300 z-30 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-gray-200 group-hover:border-brand-teal transition-colors duration-300 z-30 rounded-br-2xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-gray-200 group-hover:border-brand-teal transition-colors duration-300 z-30 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-gray-200 group-hover:border-brand-teal transition-colors duration-300 z-30 rounded-bl-2xl" />

                {/* Amorphous Blob Background for Icon */}
                <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-brand-teal/10 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] group-hover:rounded-[60%_40%_30%_70%/60%_30%_70%_40%] transition-all duration-700 ease-in-out group-hover:bg-brand-teal/20 scale-110" />
                  <Icon className="w-10 h-10 text-brand-teal relative z-10 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-heading">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
