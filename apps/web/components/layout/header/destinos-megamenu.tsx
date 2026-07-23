'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

type DestinoView = 'main' | 'nacional' | 'cusco' | 'puno' | 'arequipa' | 'ica' | 'selva' | 'lima';

function HoverSlideshow({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="absolute inset-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gray-600" />
      {images.map((src, index) => (
        <Image 
          key={src} 
          src={src} 
          alt="Destino" 
          fill 
          className={`object-cover transition-all duration-1000 ${index === currentIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`} 
        />
      ))}
    </div>
  );
}

function getTourSlug(title: string) {
  const cleanTitle = title.toLowerCase().replace(/ \(n\)$/, '');
  if (cleanTitle.includes('humantay') || cleanTitle.includes('huamantay')) {
    return '/tours/laguna-humantay';
  }
  if (cleanTitle.includes('vinicunca') || cleanTitle.includes('montaña de colores')) {
    return '/tours/montana-de-colores-vinicunca';
  }
  return `/tours/${cleanTitle.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

export function DestinosMegamenu() {
  const [destinoView, setDestinoView] = useState<DestinoView>('main');

  return (
    <div className="w-full flex flex-col">
      {/* View 1: Main Categories */}
      {destinoView === 'main' && (
        <div className="grid grid-cols-2 gap-3 w-full h-[440px]">
          <div 
            className="relative rounded-xl overflow-hidden cursor-pointer group h-full"
            onClick={() => setDestinoView('nacional')}
          >
            <HoverSlideshow images={['/nacional-1.webp', '/nacional-2.webp', '/nacional-3.webp']} />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-lg">NACIONAL</h2>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden cursor-pointer group h-full">
            <HoverSlideshow images={['/Alaska-Destino-Menu.webp', '/Arequipa-Destino-Menu.webp', '/Cristo-Redentor-Destino-Menu.webp']} />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-lg">INTERNACIONAL</h2>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Nacional Grid */}
      {destinoView === 'nacional' && (
        <div className="flex flex-col w-full h-[440px] animate-in fade-in zoom-in-95 duration-300">
          <div className="relative flex items-center justify-center mb-4 mt-2">
            <button 
              onClick={() => setDestinoView('main')}
              className="absolute left-4 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <h2 className="text-center text-xl font-bold tracking-widest">NACIONAL</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 flex-1 pb-1">
            {[
              { name: 'CUSCO', key: 'cusco', image: '/destino-cusco.webp' },
              { name: 'PUNO', key: 'puno', image: '/destino-puno.webp' },
              { name: 'AREQUIPA', key: 'arequipa', image: '/destino-arequipa.webp' },
              { name: 'ICA', key: 'ica', image: '/destino-ica.webp' },
              { name: 'LIMA', key: 'lima', image: '/destino-lima.webp' },
              { name: 'SELVA', key: 'selva', image: '/destino-selva.webp' }
            ].map((regionObj) => (
              <div 
                key={regionObj.name}
                className="relative rounded-xl overflow-hidden cursor-pointer group shadow-lg min-h-[170px]"
                onClick={() => setDestinoView(regionObj.key as DestinoView)}
              >
                {regionObj.image ? (
                  <Image src={regionObj.image} alt={regionObj.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-gray-600 transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-white tracking-wider drop-shadow-md">{regionObj.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 3: CUSCO */}
      {destinoView === 'cusco' && (
        <div className="flex flex-col w-full min-h-[440px] animate-in fade-in slide-in-from-right-8 duration-300 px-6 pb-4">
          <div className="relative flex items-center justify-center mb-4 mt-2">
            <button 
              onClick={() => setDestinoView('nacional')}
              className="absolute left-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Nacional
            </button>
            <h2 className="text-center text-xl font-bold tracking-widest">CUSCO</h2>
          </div>
          <div className="grid grid-cols-4 gap-5 flex-1">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Full Day</h3>
              <ul className="flex flex-col pr-2">
                {[
                  "Machu Picchu", "Valle Sagrado VIP", "Quelcaya (N)", 
                  "Laguna de Humantay", "Montaña de Colores Vinicunca", 
                  "Palcoyo (N)", "Queshuachaca", "Waqrapukara"
                ].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Paquetes</h3>
              <ul className="flex flex-col pr-2">
                {[
                  "Cusco 3 Días", "Cusco 4 Días", "Cusco 5 Días", "Cusco 6 Días (N)", "Cusco 7 Días"
                ].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Medio Día</h3>
              <ul className="flex flex-col pr-2">
                {[
                  "City Tour Cusco", "Circuito Valle Sur", "Maras - Moray - Salineras", "Morada de los Dioses (N)"
                ].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Aventura</h3>
              <ul className="flex flex-col pr-2">
                {[
                  "Rafting (N)", "Cabalgata (N)", "Cuatrimotos (N)"
                ].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* View 4: PUNO */}
      {destinoView === 'puno' && (
        <div className="flex flex-col w-full min-h-[440px] animate-in fade-in slide-in-from-right-8 duration-300 px-6 pb-4">
          <div className="relative flex items-center justify-center mb-4 mt-2">
            <button 
              onClick={() => setDestinoView('nacional')}
              className="absolute left-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Nacional
            </button>
            <h2 className="text-center text-xl font-bold tracking-widest">PUNO</h2>
          </div>
          <div className="grid grid-cols-3 gap-5 flex-1">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Medio Día</h3>
              <ul className="flex flex-col pr-2">
                {["Islas Uros", "Chullpas de Sillustani"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Full Day</h3>
              <ul className="flex flex-col pr-2">
                {["Uros - Taquile"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours 2 Días</h3>
              <ul className="flex flex-col pr-2">
                {["Uros - Amantani - Taquile"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* View 5: AREQUIPA */}
      {destinoView === 'arequipa' && (
        <div className="flex flex-col w-full min-h-[440px] animate-in fade-in slide-in-from-right-8 duration-300 px-6 pb-4">
          <div className="relative flex items-center justify-center mb-4 mt-2">
            <button 
              onClick={() => setDestinoView('nacional')}
              className="absolute left-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Nacional
            </button>
            <h2 className="text-center text-xl font-bold tracking-widest">AREQUIPA</h2>
          </div>
          <div className="grid grid-cols-3 gap-5 flex-1">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Medio Día</h3>
              <ul className="flex flex-col pr-2">
                {["City Tour en Arequipa", "Campiña", "Santa Catalina"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Full Day</h3>
              <ul className="flex flex-col pr-2">
                {["Cañón del Colca 1 Día", "Salinas", "Termales"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours 2 Días</h3>
              <ul className="flex flex-col pr-2">
                {["Cañón del Colca"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* View 6: ICA */}
      {destinoView === 'ica' && (
        <div className="flex flex-col w-full min-h-[440px] animate-in fade-in slide-in-from-right-8 duration-300 px-6 pb-4">
          <div className="relative flex items-center justify-center mb-4 mt-2">
            <button 
              onClick={() => setDestinoView('nacional')}
              className="absolute left-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Nacional
            </button>
            <h2 className="text-center text-xl font-bold tracking-widest">ICA</h2>
          </div>
          <div className="grid grid-cols-3 gap-5 flex-1">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Medio Día</h3>
              <ul className="flex flex-col pr-2">
                {["Tour Buggy"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Full Day</h3>
              <ul className="flex flex-col pr-2">
                {["Líneas de Nazca", "Islas Ballestas"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Otros Tours</h3>
              <ul className="flex flex-col pr-2">
                {["Viñedos"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* View 7: SELVA */}
      {destinoView === 'selva' && (
        <div className="flex flex-col w-full min-h-[440px] animate-in fade-in slide-in-from-right-8 duration-300 px-6 pb-4">
          <div className="relative flex items-center justify-center mb-4 mt-2">
            <button 
              onClick={() => setDestinoView('nacional')}
              className="absolute left-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Nacional
            </button>
            <h2 className="text-center text-xl font-bold tracking-widest">SELVA</h2>
          </div>
          <div className="grid grid-cols-3 gap-5 flex-1">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tambopata</h3>
              <ul className="flex flex-col pr-2">
                {["Tambopata 3D", "Tambopata 4D"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Manu</h3>
              <ul className="flex flex-col pr-2">
                {["Parque Nacional Manu 4D"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Selva Perdida</h3>
              <ul className="flex flex-col pr-2">
                {["Selva Perdida + Machu Picchu 2 Días", "Selva Perdida + Machu Picchu 3 Días"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* View 8: LIMA */}
      {destinoView === 'lima' && (
        <div className="flex flex-col w-full min-h-[440px] animate-in fade-in slide-in-from-right-8 duration-300 px-6 pb-4">
          <div className="relative flex items-center justify-center mb-4 mt-2">
            <button 
              onClick={() => setDestinoView('nacional')}
              className="absolute left-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Nacional
            </button>
            <h2 className="text-center text-xl font-bold tracking-widest">LIMA</h2>
          </div>
          <div className="grid grid-cols-3 gap-5 flex-1">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Medio Día</h3>
              <ul className="flex flex-col pr-2">
                {["City Tour Lima", "Museos", "Pachacamac"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours Full Day</h3>
              <ul className="flex flex-col pr-2">
                {["Paracas - Desierto de Ica", "Caral"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tours 2 Días</h3>
              <ul className="flex flex-col pr-2">
                {["Paracas - Ica", "Paracas - Ica - Nazca"].map(title => (
                  <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                    <Link href={getTourSlug(title)} className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
