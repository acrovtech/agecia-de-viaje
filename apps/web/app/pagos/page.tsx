import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CreditCard, DollarSign, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Políticas de Pago y Cancelación | Inca Bound Tour Operator',
  description: 'Conoce nuestros métodos de pago seguros con Izipay, políticas de depósito de reserva, reembolsos y condiciones de reprogramación de tours.',
};

export default function PagosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header />

      <main className="flex-1">
        {/* Hero Section Normalizado con Fondo Fotográfico */}
        <div className="relative h-[60dvh] min-h-[460px] md:min-h-[500px] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/paquetes/custom-lima-cusco.webp" 
              alt="Políticas de Pago Inca Bound" 
              fill 
              sizes="100vw" 
              className="object-cover" 
              priority 
              unoptimized={true} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
          </div>

          <div className="relative z-10 text-center px-4 mt-16 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold font-heading text-white mb-4 tracking-tight drop-shadow-lg leading-tight">
              Políticas de Pago y Cancelación
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Transparencia en reservas, métodos de pago seguros Izipay, condiciones de depósito y políticas de reembolso para tus viajes en Perú.
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="container mx-auto px-4 lg:px-8 py-16 max-w-4xl">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs space-y-10">
            
            {/* Sección 1: Métodos de Pago Aceptados */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  1. Métodos de Pago Aceptados
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-4">
                <p>
                  En <strong>Inca Bound Tour Operator</strong> brindamos múltiples facilidades de pago seguras y cifradas para la confirmación de tus reservas:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Tarjetas de Crédito / Débito (Izipay)
                      </h4>
                      <p className="text-xs text-slate-500">Procesamiento inmediato con cifrado bancario PCI-DSS sin almacenamiento de credenciales.</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <div className="bg-white px-2 py-1 rounded border border-slate-200 h-7 flex items-center justify-center">
                        <Image src="/visa.svg" alt="Visa" width={36} height={20} className="h-4 w-auto object-contain" />
                      </div>
                      <div className="bg-white px-2 py-1 rounded border border-slate-200 h-7 flex items-center justify-center">
                        <Image src="/amex.svg" alt="Amex" width={36} height={20} className="h-4 w-auto object-contain" />
                      </div>
                      <div className="bg-white px-2 py-1 rounded border border-slate-200 h-7 flex items-center justify-center">
                        <Image src="/discover.svg" alt="Discover" width={36} height={20} className="h-4 w-auto object-contain" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Transferencias & Pagos Digitales
                    </h4>
                    <p className="text-xs text-slate-500">Transferencias en Soles (PEN) y Dólares (USD) a nuestras cuentas bancarias corporativas (BCP, Interbank), Yape, Plin o depósito presencial en nuestra oficina en Cusco.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección 2: Depósito de Reserva y Saldo Pendiente */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  2. Depósito de Reserva y Pago de Saldo
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Depósito de Garantía (50%):</strong> Para asegurar los cupos y la emisión de boletos oficiales no reembolsables, se requiere el abono del 50% de la tarifa total del paquete o servicio.
                  </li>
                  <li>
                    <strong>Pago del Saldo Restante (50%):</strong> El saldo adeudado se cancela directamente a la llegada a Cusco, previa reunión de orientación con nuestro equipo (Briefing), en efectivo (Dólares o Soles) o mediante tarjeta con pasarela Izipay.
                  </li>
                </ul>
              </div>
            </section>

            {/* Sección 3: Políticas de Cancelación y Reembolsos */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  3. Cancelaciones y Reembolsos
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-4">
                <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2 text-rose-900 text-xs md:text-sm">
                  <p className="font-bold flex items-center gap-2 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    Boletos Nominativos no Reembolsables (Machu Picchu & Trenes):
                  </p>
                  <p>
                    Por disposiciones normativas del <strong>Ministerio de Cultura del Perú</strong> y las empresas ferroviarias (PeruRail / IncaRail), los ingresos a Machu Picchu, Camino Inca y pasajes de tren emitidos con DNI o Pasaporte son <strong>estrictamente personales, nominativos, no reembolsables ni transferibles</strong> bajo ninguna circunstancia.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900">Condiciones de Cancelación según Anticipación:</h4>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li><strong>Cancelaciones con más de 48 horas de anticipación:</strong> En tours de 1 Día y 1/2 Día (Humantay, Vinicunca, Valle Sagrado), se permite reprogramación sin penalidad o reembolso parcial deduciendo gastos administrativos.</li>
                    <li><strong>Cancelaciones con menos de 24 horas o No Show:</strong> Se aplica una penalidad del 100% del valor total del tour debido al bloqueo de plazas y asignación de guiado/transporte.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Sección 4: Eventos de Fuerza Mayor */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  4. Eventos de Fuerza Mayor y Clima
                </h2>
              </div>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                En situaciones imprevisibles derivadas de fenómenos meteorológicos extremos, huaycos, paros o cierres preventivos emitidos por el SERNANP o entidades del Estado, Inca Bound coordinará itinerarios de contingencia alternativos o facilitará cartas de crédito de viaje válidas para futuras fechas.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
