import Image from 'next/image';
import Link from 'next/link';
import { User, FileText, ShieldCheck, CreditCard, FileSignature, MapPin, Map, Navigation, Palmtree, Tent, Mountain, Compass, Info, HelpCircle, BookOpen, Mail, Phone, Car, Cookie } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#062918] text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-12">
          
          {/* Column 1: Logo & Info */}
          <div className="flex flex-col items-center lg:col-span-3">
            <Link href="/" className="inline-block mb-4">
              <Image src="/logo.svg" alt="Logo" width={160} height={160} className="w-28 md:w-32 h-auto object-contain" unoptimized={true} />
            </Link>
            <div className="text-center mb-6">
              <p className="font-bold tracking-widest text-sm uppercase">Tour Operator</p>
            </div>
            <p className="text-sm mb-4 text-center">Pague sus reservas aqui</p>
            {/* Mock QR and Cards */}
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-white p-1 rounded-md flex items-center justify-center">
                <Image src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/qr.webp" alt="QR Code" width={80} height={80} className="w-full h-full object-cover rounded-sm" unoptimized={true} />
              </div>
              <a href="https://secure.micuentaweb.pe/vads-site/IZI_INCA_BOUND1" target="_blank" rel="noopener noreferrer" className="grid grid-cols-2 gap-1.5 w-24 hover:opacity-85 transition-opacity">
                <div className="bg-white rounded-md overflow-hidden flex items-center justify-center h-8 w-full shadow-2xs">
                  <img src="/mastercard.svg" alt="Mastercard" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white rounded-md overflow-hidden flex items-center justify-center h-8 w-full shadow-2xs">
                  <img src="/visa.svg" alt="Visa" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white rounded-md overflow-hidden flex items-center justify-center h-8 w-full shadow-2xs">
                  <img src="/amex.svg" alt="Amex" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white rounded-md overflow-hidden flex items-center justify-center h-8 w-full shadow-2xs">
                  <img src="/discover.svg" alt="Discover" className="w-full h-full object-cover" />
                </div>
              </a>
            </div>
          </div>

          {/* Column 2: Destinos */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-6">Destinos</h3>
            <ul className="space-y-4 text-sm opacity-90">
              <li><Link href="/tours?destino=cusco" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Mountain size={16} /> Cusco</Link></li>
              <li><Link href="/tours?destino=puno" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Compass size={16} /> Puno</Link></li>
              <li><Link href="/tours?destino=arequipa" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Map size={16} /> Arequipa</Link></li>
              <li><Link href="/tours?destino=ica" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Navigation size={16} /> Ica</Link></li>
              <li><Link href="/tours?destino=lima" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Palmtree size={16} /> Lima</Link></li>
              <li><Link href="/tours?destino=selva" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Tent size={16} /> Selva</Link></li>
            </ul>
          </div>

          {/* Column 3: Políticas */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-6">Políticas</h3>
            <ul className="space-y-4 text-sm opacity-90">
              <li><Link href="/terminos" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><FileText size={16} /> Términos y Condiciones</Link></li>
              <li><Link href="/privacidad" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><ShieldCheck size={16} /> Privacidad</Link></li>
              <li><Link href="/cookies" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Cookie size={16} /> Cookies</Link></li>
              <li><Link href="/pagos" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><CreditCard size={16} /> Políticas de Pago</Link></li>
              <li><Link href="/politicas-de-transporte" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><Car size={16} /> Políticas de Transporte</Link></li>
            </ul>
          </div>

          {/* Column 4: Información útil */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-6">Información útil</h3>
            <ul className="space-y-4 text-sm opacity-90 mb-8">
              <li><Link href="/#faq" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><HelpCircle size={16} /> Preguntas frecuentes</Link></li>
              <li><Link href="/blog" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><BookOpen size={16} /> Blogs</Link></li>
              <li><Link href="/esnna" className="flex items-center gap-2 hover:text-[#2dd4bf] transition-colors"><FileSignature size={16} /> Codigo ESNNA</Link></li>
            </ul>

            <h3 className="font-bold text-lg mb-6">Redes Sociales</h3>
            <div className="flex gap-4">
              <a href="#" aria-label="Facebook" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="TripAdvisor" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg viewBox="0 0 576 512" fill="currentColor" width="20" height="20"><path d="M528.91,178.82,576,127.58H471.66a326.11,326.11,0,0,0-367,0H0l47.09,51.24A143.911,143.911,0,0,0,241.86,390.73L288,440.93l46.11-50.17A143.94,143.94,0,0,0,575.88,285.18h-.03A143.56,143.56,0,0,0,528.91,178.82ZM144.06,382.57a97.39,97.39,0,1,1,97.39-97.39A97.39,97.39,0,0,1,144.06,382.57ZM288,282.37c0-64.09-46.62-119.08-108.09-142.59a281,281,0,0,1,216.17,0C334.61,163.3,288,218.29,288,282.37Zm143.88,100.2h-.01a97.405,97.405,0,1,1,.01,0ZM144.06,234.12h-.01a51.06,51.06,0,1,0,51.06,51.06v-.11A51,51,0,0,0,144.06,234.12Zm287.82,0a51.06,51.06,0,1,0,51.06,51.06A51.06,51.06,0,0,0,431.88,234.12Z"></path></svg>
              </a>
            </div>
          </div>

          {/* Column 5: Contactos */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-lg mb-6">Contactos</h3>
            <ul className="space-y-4 text-sm opacity-90">
              <li className="flex gap-3">
                <MapPin size={16} className="mt-1 shrink-0" />
                <span>Cusco, Perú</span>
              </li>
              <li className="flex gap-3">
                <Mail size={16} className="shrink-0" />
                <a href="mailto:info@agenciadeviajes.com" className="hover:text-[#2dd4bf] transition-colors">info@agenciadeviajes.com</a>
              </li>
              <li className="flex gap-3">
                <Phone size={16} className="shrink-0" />
                <a href="https://wa.me/51974681666" className="hover:text-[#2dd4bf] transition-colors">(+51) 974 681 666</a>
              </li>
              <li className="flex gap-3">
                <Phone size={16} className="shrink-0" />
                <a href="https://wa.me/51984772299" className="hover:text-[#2dd4bf] transition-colors">(+51) 984 772 299</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-xs opacity-70 flex flex-col md:flex-row items-center justify-center gap-2">
          <span>COPYRIGHT © {new Date().getFullYear()} Agencia de Viajes. Todos los derechos reservados.</span>
          <span className="hidden md:inline">|</span>
          <span>
            Created by <a href="https://acrovtech.com" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-white transition-colors underline decoration-white/30 underline-offset-2">Acrovtech</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
