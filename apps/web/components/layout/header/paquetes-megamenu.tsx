'use client';

import Link from 'next/link';
import Image from 'next/image';

type MenuTour = {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  menuGroup: string | null;
};

export function PaquetesMegamenu({ tours }: { tours: MenuTour[] }) {
  const limaCusco = tours.filter(t => t.menuGroup === 'LIMA-CUSCO');
  const limaArequipa = tours.filter(t => t.menuGroup === 'LIMA-AREQUIPA');
  const limaIca = tours.filter(t => t.menuGroup === 'LIMA-ICA');

  return (
    <div className="grid grid-cols-3 gap-12 w-full mt-4 px-12 pb-4">
      {/* Lima - Cusco */}
      <div>
        <div className="w-full h-40 bg-gray-600 rounded-xl mb-6 relative overflow-hidden shadow-lg">
          <Image 
            src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/paquetes/custom-lima-cusco.webp" 
            alt="Paquete Lima - Cusco" 
            fill 
            className="object-cover transition-transform duration-500 hover:scale-105" 
            unoptimized={true}
          />
        </div>
        <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">Lima - Cusco</h3>
        <ul className="flex flex-col max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {limaCusco.map(t => (
            <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                {t.title}
              </Link>
            </li>
          ))}
          {limaCusco.length === 0 && <li className="text-white/40 text-sm italic">Próximamente</li>}
        </ul>
      </div>
      
      {/* Lima - Arequipa */}
      <div>
        <div className="w-full h-40 bg-gray-600 rounded-xl mb-6 relative overflow-hidden shadow-lg">
          <Image 
            src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/paquetes/custom-lima-arequipa.webp" 
            alt="Paquete Lima - Arequipa" 
            fill 
            className="object-cover transition-transform duration-500 hover:scale-105" 
            unoptimized={true}
          />
        </div>
        <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">Lima - Arequipa</h3>
        <ul className="flex flex-col max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {limaArequipa.map(t => (
            <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                {t.title}
              </Link>
            </li>
          ))}
          {limaArequipa.length === 0 && <li className="text-white/40 text-sm italic">Próximamente</li>}
        </ul>
      </div>

      {/* Lima - Ica */}
      <div>
        <div className="w-full h-40 bg-gray-600 rounded-xl mb-6 relative overflow-hidden shadow-lg">
          <Image 
            src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/paquetes/custom-lima-ica.webp" 
            alt="Paquete Lima - Ica" 
            fill 
            className="object-cover transition-transform duration-500 hover:scale-105" 
            unoptimized={true}
          />
        </div>
        <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">Lima - Ica</h3>
        <ul className="flex flex-col max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {limaIca.map(t => (
            <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2">
              <Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                {t.title}
              </Link>
            </li>
          ))}
          {limaIca.length === 0 && <li className="text-white/40 text-sm italic">Próximamente</li>}
        </ul>
      </div>
    </div>
  );
}
