'use client';

import Link from 'next/link';

export function TransporteMegamenu() {
  const items = [
    { title: "Transporte a Soraypampa", href: "/transporte" },
    { title: "Traslado del Hotel al Aeropuerto o Viceversa", href: "/transporte" }
  ];

  return (
    <div className="w-full px-6 py-4">
      <div className="max-w-xl mx-auto">
        <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/20 pb-3 text-center">
          Servicios de Transporte
        </h3>
        <ul className="flex flex-col space-y-2">
          {items.map((item) => (
            <li key={item.title} className="transition-all duration-300 hover:translate-x-2">
              <Link 
                href={item.href} 
                className="block py-3 pl-4 border-l-4 border-white/70 border-b border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm font-medium"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
