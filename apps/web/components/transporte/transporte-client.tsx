'use client';

import { Suspense } from 'react';
import { 
  Shield, 
  Wind, 
  Stethoscope, 
  Clock 
} from 'lucide-react';
import { TransporteDirectCheckout } from './transporte-direct-checkout';
import { TransferRouteData } from './transporte-route-card';

interface TransporteClientProps {
  initialTransfers: TransferRouteData[];
}

function TransporteContent({ initialTransfers }: TransporteClientProps) {
  return (
    <div className="space-y-16">
      
      {/* Checkout Directo Integrado / Flujo Screenshot 2 */}
      <section className="py-10 md:py-14 relative z-30">
        <TransporteDirectCheckout transfers={initialTransfers} />
      </section>

      {/* Flota & Beneficios */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold font-heading text-[#062918]">
              ¿Por qué viajar con <span className="text-[#0d9488]">IncaBound</span>?
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Garantizamos puntualidad, vehículos sanitizados y conductores altamente capacitados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#F9FAFA] p-5 rounded-2xl border border-gray-200/80 text-center space-y-2.5 hover:border-[#062918] transition-all duration-300 hover:shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-100/70 text-[#062918] flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-emerald-800" />
              </div>
              <h4 className="text-sm font-semibold text-[#062918] font-heading">Seguridad Total</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Conductores con amplia experiencia en rutas andinas y monitoreo GPS continuo.
              </p>
            </div>

            <div className="bg-[#F9FAFA] p-5 rounded-2xl border border-gray-200/80 text-center space-y-2.5 hover:border-[#062918] transition-all duration-300 hover:shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-teal-100/70 text-[#062918] flex items-center justify-center mx-auto">
                <Wind className="w-5 h-5 text-teal-800" />
              </div>
              <h4 className="text-sm font-semibold text-[#062918] font-heading">Máximo Confort</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Asientos reclinables, climatización y amplio espacio para todo tu equipaje.
              </p>
            </div>

            <div className="bg-[#F9FAFA] p-5 rounded-2xl border border-gray-200/80 text-center space-y-2.5 hover:border-[#062918] transition-all duration-300 hover:shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-blue-100/70 text-[#062918] flex items-center justify-center mx-auto">
                <Stethoscope className="w-5 h-5 text-blue-800" />
              </div>
              <h4 className="text-sm font-semibold text-[#062918] font-heading">Botiquín & Oxígeno</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Balón de oxígeno medicinal y primeros auxilios en todos nuestros traslados.
              </p>
            </div>

            <div className="bg-[#F9FAFA] p-5 rounded-2xl border border-gray-200/80 text-center space-y-2.5 hover:border-[#062918] transition-all duration-300 hover:shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-purple-100/70 text-[#062918] flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5 text-purple-800" />
              </div>
              <h4 className="text-sm font-semibold text-[#062918] font-heading">Puntualidad 100%</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Rastreo en vivo de tu número de vuelo para recogerte sin esperas ni demoras.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export function TransporteClient({ initialTransfers }: TransporteClientProps) {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Cargando módulo de traslados...</div>}>
      <TransporteContent initialTransfers={initialTransfers} />
    </Suspense>
  );
}
