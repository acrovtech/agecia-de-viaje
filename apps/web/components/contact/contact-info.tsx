import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Link from 'next/link';

export function ContactInfo() {
  return (
    <div className="h-full flex flex-col justify-between space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 tracking-tight mb-6">Información de Contacto</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Estamos aquí para ayudarte a planificar la aventura de tu vida. Visítanos en nuestra oficina central en Cusco o contáctanos por nuestros canales digitales.
        </p>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#062918]/10 flex items-center justify-center flex-shrink-0 mt-1">
              <MapPin className="w-5 h-5 text-[#062918]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Ubicación</h4>
              <p className="text-gray-600 mt-1">Calle Marquez 231 | C.C. Sotomayor<br/>Oficina 308, Cusco, Perú</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#062918]/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Phone className="w-5 h-5 text-[#062918]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Teléfono / WhatsApp</h4>
              <p className="text-gray-600 mt-1">
                <a href="https://wa.me/51974681666" className="hover:text-[#062918] transition-colors">(+51) 974 681 666</a>
                <span className="mx-2">•</span>
                <a href="https://wa.me/51984772299" className="hover:text-[#062918] transition-colors">(+51) 984 772 299</a>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#062918]/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Mail className="w-5 h-5 text-[#062918]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Correo Electrónico</h4>
              <p className="text-gray-600 mt-1">
                <a href="mailto:incabound@gmail.com" className="hover:text-[#062918] transition-colors">incabound@gmail.com</a>
                <span className="mx-2">•</span>
                <a href="mailto:info@incabound.com" className="hover:text-[#062918] transition-colors">info@incabound.com</a>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#062918]/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Clock className="w-5 h-5 text-[#062918]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Horario de Atención</h4>
              <p className="text-gray-600 mt-1">Lunes a Sábado: 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
        
        {/* Redes Sociales */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h4 className="font-bold text-gray-900 mb-4">Síguenos en Redes</h4>
          <div className="flex gap-4">
            <Link href="https://www.facebook.com/incabound?locale=es_LA" target="_blank" rel="noopener noreferrer" aria-label="Facebook Inca Bound" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#062918] hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </Link>
            <Link href="https://www.instagram.com/incabound/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Inca Bound" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#062918] hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </Link>
            <Link href="https://www.tripadvisor.com.pe/Attraction_Review-g294314-d8146250-Reviews-Inca_Bound-Cusco_Cusco_Region.html" target="_blank" rel="noopener noreferrer" aria-label="TripAdvisor Inca Bound" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#062918] hover:text-white transition-colors duration-300">
              <svg viewBox="0 0 576 512" fill="currentColor" className="w-5 h-5"><path d="M528.91,178.82,576,127.58H471.66a326.11,326.11,0,0,0-367,0H0l47.09,51.24A143.911,143.911,0,0,0,241.86,390.73L288,440.93l46.11-50.17A143.94,143.94,0,0,0,575.88,285.18h-.03A143.56,143.56,0,0,0,528.91,178.82ZM144.06,382.57a97.39,97.39,0,1,1,97.39-97.39A97.39,97.39,0,0,1,144.06,382.57ZM288,282.37c0-64.09-46.62-119.08-108.09-142.59a281,281,0,0,1,216.17,0C334.61,163.3,288,218.29,288,282.37Zm143.88,100.2h-.01a97.405,97.405,0,1,1,.01,0ZM144.06,234.12h-.01a51.06,51.06,0,1,0,51.06,51.06v-.11A51,51,0,0,0,144.06,234.12Zm287.82,0a51.06,51.06,0,1,0,51.06,51.06A51.06,51.06,0,0,0,431.88,234.12Z"></path></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
