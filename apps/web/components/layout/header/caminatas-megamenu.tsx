'use client';

import Link from 'next/link';

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

export function CaminatasMegamenu() {
  const fullDay = [
    "Montaña de Colores Vinicunca (N)",
    "Laguna de Huamantay (N)",
    "Quelcayo (N)",
    "Siete Lagunas (N)",
    "Waqrapukara",
    "Queshuachaca"
  ];

  const dosDias = [
    "Qelcaya (N)",
    "Camino Inca 2D",
    "Laguna Humantay Salkantay (N)"
  ];

  const cuatroDiasMas = [
    "Camino Inca 4D",
    "Selva Inca 4D",
    "Caminata de Lares 4D",
    "Salkantay 5D"
  ];

  return (
    <div className="w-full px-6 py-4">
      <div className="grid grid-cols-3 gap-8">
        {/* Column 1 */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Caminata Full Day</h3>
          <ul className="flex flex-col pr-2">
            {fullDay.map(title => (
              <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                <Link 
                  href={getTourSlug(title)} 
                  className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tour de Dos Días</h3>
          <ul className="flex flex-col pr-2">
            {dosDias.map(title => (
              <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                <Link 
                  href={getTourSlug(title)} 
                  className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Tour de 4 Días a Más</h3>
          <ul className="flex flex-col pr-2">
            {cuatroDiasMas.map(title => (
              <li key={title} className="my-2 transition-all duration-300 hover:translate-x-2">
                <Link 
                  href={getTourSlug(title)} 
                  className="block py-2 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
