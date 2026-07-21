'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ShoppingCart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

type MenuTour = {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  menuGroup: string | null;
};

function HoverSlideshow({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 1500);
    } else {
      setCurrentIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  return (
    <div 
      className="absolute inset-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fallback bg just in case */}
      <div className="absolute inset-0 bg-gray-600" />
      {images.map((src, index) => (
        <Image 
          key={src} 
          src={src} 
          alt="Nacional" 
          fill 
          className={`object-cover transition-all duration-1000 ${index === currentIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`} 
        />
      ))}
    </div>
  );
}

export function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [destinoView, setDestinoView] = useState<'main' | 'nacional' | 'cusco'>('main');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tours, setTours] = useState<MenuTour[]>([]);

  useEffect(() => {
    fetch('/api/tours/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTours(data);
      })
      .catch(console.error);
  }, []);

  // Reset internal megamenu views when the global menu closes
  useEffect(() => {
    if (!activeMenu) {
      setTimeout(() => setDestinoView('main'), 300); // Wait for transition before resetting
    }
  }, [activeMenu]);

  return (
    <header className={`left-0 w-full z-50 py-4 mt-[10px] transition-colors duration-300 ${isMobileMenuOpen ? 'fixed top-0 bg-white shadow-md' : 'absolute top-0'}`}>
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center z-50">
          <Image src="/logo.svg" alt="Inca Bound Logo" width={90} height={90} className="w-[60px] h-[60px] md:w-[78px] md:h-[78px] object-contain transition-all duration-300" priority />
        </Link>

        {/* Desktop Nav */}
        <nav 
          className="hidden lg:flex items-center gap-16 text-white/70 font-medium text-[17px] h-full relative"
          onMouseLeave={() => setActiveMenu(null)}
        >
          <Link href="/" className="hover:text-white transition-colors py-4">Inicio</Link>
          
          {/* Destinos */}
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors h-full py-4"
            onMouseEnter={() => setActiveMenu('destinos')}
          >
            <span>Destinos</span> <ChevronDown size={14} />
          </div>

          {/* Caminatas */}
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors h-full py-4"
            onMouseEnter={() => setActiveMenu('caminatas')}
          >
            <span>Caminatas</span> <ChevronDown size={14} />
          </div>

          {/* Paquetes */}
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors h-full py-4"
            onMouseEnter={() => setActiveMenu('paquetes')}
          >
            <span>Paquetes</span> <ChevronDown size={14} />
          </div>

          <Link href="/transporte" className="hover:text-white transition-colors py-4">Solo Transporte</Link>
          <Link href="/blog" className="hover:text-white transition-colors py-4">Blogs</Link>
          <Link href="/nosotros" className="hover:text-white transition-colors py-4">Nosotros</Link>
          <Link href="/contacto" className="hover:text-white transition-colors py-4">Contáctanos</Link>

          {/* Global Megamenu Container */}
          {activeMenu && (
            <div className="absolute top-full left-0 w-full pt-2 z-50">
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl text-white">
                
                {/* Content for Destinos */}
                {activeMenu === 'destinos' && (
                  <div className="w-full h-[470px] flex flex-col">
                    {/* View 1: Main Categories */}
                    {destinoView === 'main' && (
                      <div className="grid grid-cols-2 gap-3 w-full h-full pb-2">
                        <div 
                          className="relative rounded-xl overflow-hidden cursor-pointer group"
                          onClick={() => setDestinoView('nacional')}
                        >
                          <HoverSlideshow images={['/nacional-1.webp', '/nacional-2.webp', '/nacional-3.webp']} />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors pointer-events-none" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-lg">NACIONAL</h2>
                          </div>
                        </div>
                        <div className="relative rounded-xl overflow-hidden cursor-pointer group">
                          <div className="absolute inset-0 bg-gray-500 transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-lg">INTERNACIONAL</h2>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View 2: Nacional Grid */}
                    {destinoView === 'nacional' && (
                      <div className="flex flex-col w-full h-full animate-in fade-in zoom-in-95 duration-300">
                        <h2 className="text-center text-xl font-bold tracking-widest mb-6 mt-4">NACIONAL</h2>
                        <div className="grid grid-cols-3 gap-3 flex-1 pb-2">
                          {[
                            { name: 'CUSCO', image: '/destino-cusco.webp' },
                            { name: 'PUNO', image: '/destino-puno.webp' },
                            { name: 'AREQUIPA', image: '/destino-arequipa.webp' },
                            { name: 'ICA', image: '/destino-ica.webp' },
                            { name: 'LIMA', image: '/destino-lima.webp' },
                            { name: 'SELVA', image: '/destino-selva.webp' }
                          ].map((regionObj) => (
                            <div 
                              key={regionObj.name}
                              className="relative rounded-xl overflow-hidden cursor-pointer group shadow-lg"
                              onClick={() => regionObj.name === 'CUSCO' ? setDestinoView('cusco') : null}
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

                    {/* View 3: Cusco Lists */}
                    {destinoView === 'cusco' && (
                      <div className="flex flex-col w-full h-full animate-in fade-in slide-in-from-right-8 duration-300 px-6 pb-4">
                        <h2 className="text-center text-xl font-bold tracking-widest mb-6 mt-4">CUSCO</h2>
                        <div className="grid grid-cols-4 gap-8 flex-1">
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Full Day</h3>
                            <ul className="flex flex-col max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'FULL DAY').map(t => (
                                <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2"><Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">{t.title}</Link></li>
                              ))}
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'FULL DAY').length === 0 && <li className="text-white/40 text-sm italic">No hay tours</li>}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Paquetes</h3>
                            <ul className="flex flex-col max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'PAQUETES').map(t => (
                                <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2"><Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">{t.title}</Link></li>
                              ))}
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'PAQUETES').length === 0 && <li className="text-white/40 text-sm italic">No hay tours</li>}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Medio Día</h3>
                            <ul className="flex flex-col max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'MEDIO DÃA').map(t => (
                                <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2"><Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">{t.title}</Link></li>
                              ))}
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'MEDIO DÃA').length === 0 && <li className="text-white/40 text-sm italic">No hay tours</li>}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Aventura</h3>
                            <ul className="flex flex-col max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'AVENTURA').map(t => (
                                <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2"><Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">{t.title}</Link></li>
                              ))}
                              {tours.filter(t => t.region === 'CUSCO' && t.menuGroup === 'AVENTURA').length === 0 && <li className="text-white/40 text-sm italic">No hay tours</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content for Caminatas */}
                {activeMenu === 'caminatas' && (
                  <div className="w-full mt-4 px-6 pb-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-6 text-center">Todas las Caminatas</h3>
                    <div className="grid grid-cols-3 gap-12 max-h-80 overflow-y-auto custom-scrollbar">
                      {tours.filter(t => t.menuGroup === 'CAMINATAS').map(t => (
                        <div key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2">
                          <Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">
                            {t.title}
                          </Link>
                        </div>
                      ))}
                      {tours.filter(t => t.menuGroup === 'CAMINATAS').length === 0 && <p className="text-white/40 text-sm italic col-span-3 text-center">No hay caminatas publicadas</p>}
                    </div>
                  </div>
                )}

                {/* Content for Paquetes */}
                {activeMenu === 'paquetes' && (
                  <div className="grid grid-cols-3 gap-12 w-full mt-4 px-12 pb-4">
                    {/* Lima - Cusco */}
                    <div>
                      <div className="w-full h-40 bg-gray-600 rounded-xl mb-6 relative overflow-hidden shadow-lg">
                        <Image src="/sacred-valley.jpg" alt="Lima-Cusco" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                      <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">Lima - Cusco</h3>
                      <ul className="flex flex-col max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {tours.filter(t => t.menuGroup === 'LIMA-CUSCO').map(t => (
                          <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2"><Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">{t.title}</Link></li>
                        ))}
                        {tours.filter(t => t.menuGroup === 'LIMA-CUSCO').length === 0 && <li className="text-white/40 text-sm italic">Próximamente</li>}
                      </ul>
                    </div>
                    
                    {/* Lima - Arequipa */}
                    <div>
                      <div className="w-full h-40 bg-gray-600 rounded-xl mb-6 relative overflow-hidden shadow-lg">
                        <Image src="/inca-trail.jpg" alt="Lima-Arequipa" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                      <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">Lima - Arequipa</h3>
                      <ul className="flex flex-col max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {tours.filter(t => t.menuGroup === 'LIMA-AREQUIPA').map(t => (
                          <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2"><Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">{t.title}</Link></li>
                        ))}
                        {tours.filter(t => t.menuGroup === 'LIMA-AREQUIPA').length === 0 && <li className="text-white/40 text-sm italic">Próximamente</li>}
                      </ul>
                    </div>

                    {/* Lima - Ica */}
                    <div>
                      <div className="w-full h-40 bg-gray-600 rounded-xl mb-6 relative overflow-hidden shadow-lg">
                        <Image src="/fallback.svg" alt="Lima-Ica" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                      <h3 className="font-bold text-lg uppercase tracking-wider mb-4 border-b border-white/20 pb-3">Lima - Ica</h3>
                      <ul className="flex flex-col max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {tours.filter(t => t.menuGroup === 'LIMA-ICA').map(t => (
                          <li key={t.id} className="my-2 transition-all duration-300 hover:translate-x-2"><Link href={`/tours/${t.slug}`} className="block py-2 pl-4 border-l-4 border-white/70 rounded-md transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-white/80 hover:text-white text-sm">{t.title}</Link></li>
                        ))}
                        {tours.filter(t => t.menuGroup === 'LIMA-ICA').length === 0 && <li className="text-white/40 text-sm italic">Próximamente</li>}
                      </ul>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </nav>

        {/* Right Section: Actions */}
        <div className={`flex items-center gap-6 text-sm z-50 transition-colors duration-300 ${isMobileMenuOpen ? 'text-gray-900' : 'text-white'}`}>
          {/* Cart Icon */}
          <Link href="/carrito" className="relative hover:text-[#2dd4bf] transition-colors">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-[#2dd4bf] text-black text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">0</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden transition-transform active:scale-95 p-1 relative w-8 h-8 flex items-center justify-center overflow-hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu 
              size={28} 
              strokeWidth={1.5} 
              className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} 
            />
            <X 
              size={28} 
              strokeWidth={1.5} 
              className={`absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} 
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div 
        className={`fixed inset-0 w-full h-full bg-white z-40 lg:hidden flex flex-col pt-20 pb-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Links */}
        <nav className="flex-1 flex flex-col justify-center text-[#555] font-bold text-center uppercase tracking-wider text-sm">
          <Link href="/" className="relative py-5 border-b border-gray-100 flex items-center justify-center" onClick={() => setIsMobileMenuOpen(false)}>Inicio</Link>
          <div className="relative border-b border-gray-100 flex items-center justify-center">
            <Link href="/tours" className="py-5 w-full text-center" onClick={() => setIsMobileMenuOpen(false)}>Destinos</Link>
            <ChevronDown size={18} className="absolute right-6 text-gray-400 pointer-events-none" />
          </div>
          <Link href="/transporte" className="relative py-5 border-b border-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Solo Transporte</Link>
          <Link href="/blog" className="relative py-5 border-b border-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Blogs</Link>
          <Link href="/nosotros" className="relative py-5 border-b border-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Nosotros</Link>
          <Link href="/contacto" className="relative py-5 border-b border-gray-100" onClick={() => setIsMobileMenuOpen(false)}>Contacto</Link>
        </nav>
      </div>
    </header>
  );
}

