import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Car, Clock, ShieldCheck, Plane, Luggage, AlertCircle, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Políticas de Transporte y Traslados | Inca Bound Tour Operator',
  description: 'Conoce las políticas operativas, tiempos de espera, cobertura, equipaje y condiciones de seguridad de nuestros traslados turísticos en Cusco y el Valle Sagrado.',
};

export default function PoliticasTransportePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header />

      <main className="flex-1">
        {/* Hero Section Normalizado con Fondo Fotográfico */}
        <div className="relative h-[60dvh] min-h-[460px] md:min-h-[500px] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/transporte-hero.webp" 
              alt="Políticas de Transporte y Traslados Inca Bound" 
              fill 
              sizes="100vw" 
              className="object-cover" 
              priority 
              unoptimized={true} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
          </div>

          <div className="relative z-10 text-center px-4 mt-16 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-heading text-white mb-4 drop-shadow-lg leading-tight tracking-tight">
              Políticas de Transporte y Traslados
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Normativa operacional, tiempos de espera, protocolos de recojo en aeropuertos, hoteles y seguridad en nuestros traslados privados.
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="container mx-auto px-4 lg:px-8 py-16 max-w-4xl">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs space-y-10">
            
            {/* Introducción */}
            <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 text-slate-700 text-sm md:text-base leading-relaxed space-y-2">
              <p className="font-semibold text-[#062918]">
                Flota y Servicio Turístico Oficial Inca Bound
              </p>
              <p>
                Nuestros servicios de transporte privado y traslados turísticos en Cusco, Valle Sagrado, Poroy, Ollantaytambo y estaciones ferroviarias operan bajo estrictos estándares de puntualidad, confort y cumplimiento del Reglamento Nacional de Transporte Turístico Terrestre (MTC).
              </p>
            </div>

            {/* Sección 1: Monitoreo de Vuelos y Recojo en Aeropuerto */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Plane className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  1. Recojo en Aeropuerto y Monitoreo de Vuelos
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Para traslados desde el <strong>Aeropuerto Internacional Alejandro Velasco Astete (CUZ)</strong>:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Seguimiento en Tiempo Real:</strong> Monitoreamos el estatus del número de vuelo proporcionado en la reserva. En caso de retraso justificado por la aerolínea, el chofer adaptará la hora de recojo sin costo adicional.
                  </li>
                  <li>
                    <strong>Tiempo de Espera de Cortesía:</strong> El conductor esperará en la puerta de arribos con un cartel identificativo con el nombre del titular durante un máximo de <strong>45 minutos</strong> posteriores al aterrizaje efectivo del vuelo.
                  </li>
                  <li>
                    <strong>Pérdida de Conexión:</strong> Si el pasajero pierde su vuelo o sufre una reprogramación de fecha, debe notificarlo a nuestra central con al menos <strong>3 horas de anticipación</strong> para reagendar la unidad.
                  </li>
                </ul>
              </div>
            </section>

            {/* Sección 2: Recojos en Hoteles y Estaciones */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  2. Recojo en Hoteles, Estaciones de Tren y Domicilios
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Para traslados urbanos e interurbanos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Tolerancia de Espera en Hotel:</strong> El tiempo de espera de cortesía en el lobby del hotel es de <strong>15 minutos</strong> a partir de la hora pactada.
                  </li>
                  <li>
                    <strong>Accesibilidad en el Centro Histórico:</strong> En hoteles ubicados en calles peatonales o pasajes estrechos donde el acceso vehicular pesado esté restringido por la municipalidad, se coordinará el punto de encuentro vehicular seguro más cercano a pocos metros.
                  </li>
                </ul>
              </div>
            </section>

            {/* Sección 3: Capacidad de Vehículos y Equipaje */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Luggage className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  3. Capacidad de Pasajeros y Franquicia de Equipaje
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Cada categoría de vehículo cuenta con límites definidos para garantizar el confort y la seguridad vial:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                    <p className="font-bold text-slate-900 text-sm">Sedán Ejecutivo</p>
                    <p className="text-xs text-slate-500 mt-1">1 a 3 Pasajeros</p>
                    <p className="text-xs text-slate-600 mt-2">Hasta 2 maletas grandes (23kg) + 2 bolsos de mano.</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                    <p className="font-bold text-slate-900 text-sm">Van Turística (H1)</p>
                    <p className="text-xs text-slate-500 mt-1">4 a 6 Pasajeros</p>
                    <p className="text-xs text-slate-600 mt-2">Hasta 6 maletas medianas + equipaje de cabina.</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                    <p className="font-bold text-slate-900 text-sm">Minibús / Sprinter</p>
                    <p className="text-xs text-slate-500 mt-1">7 a 15 Pasajeros</p>
                    <p className="text-xs text-slate-600 mt-2">Capacidad completa con maletero posterior amplio.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección 4: Seguridad y Seguro SOAT Turístico */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  4. Seguridad, Seguros y Primeros Auxilios
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Seguro Obligatorio:</strong> Todas nuestras unidades cuentan con póliza de seguro <strong>SOAT Turístico</strong> y revisiones técnicas vigentes aprobadas por el MTC.</li>
                  <li><strong>Balón de Oxígeno y Botiquín:</strong> Para rutas de altitud hacia el Valle Sagrado, Ollantaytambo o Soraypampa, los vehículos están equipados con botiquín y balón de oxígeno medicinal para emergencias de aclimatación.</li>
                  <li><strong>Conductores Profesionales:</strong> Choferes acreditados con licencia profesional, capacitados en primeros auxilios y manejo defensivo en rutas andinas.</li>
                </ul>
              </div>
            </section>

            {/* Sección 5: Modificaciones y Cancelaciones */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  5. Cancelaciones y Cambios de Horario
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Las solicitudes de cambio de horario o cancelación de traslados deben comunicarse a nuestro WhatsApp de operaciones (+51 974 681 666) bajo las siguientes condiciones:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Hasta 12 horas antes:</strong> Modificación o cancelación sin costo de penalidad.</li>
                  <li><strong>Menos de 6 horas antes o No Show:</strong> Se cobrará el 100% de la tarifa pactada debido a la asignación exclusiva del chofer y la unidad.</li>
                </ul>
              </div>
            </section>

            {/* Enlace directo a Reserva */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#062918] text-base md:text-lg">
                  ¿Deseas cotizar o reservar un traslado?
                </h3>
                <p className="text-xs md:text-sm text-slate-600">
                  Explora nuestras rutas disponibles con confirmación inmediata y precios transparentes.
                </p>
              </div>
              <Link 
                href="/transporte"
                className="py-2.5 px-5 bg-[#062918] hover:bg-[#008060] text-white font-semibold text-xs md:text-sm rounded-xl transition-all shadow-sm shrink-0"
              >
                Ver Rutas y Tarifas
              </Link>
            </div>

            {/* Aviso Final */}
            <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs md:text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Para cualquier eventualidad en ruta o asistencia de emergencia con tu conductor, nuestra central telefónica y WhatsApp de asistencia 24/7 está a tu disposición en el <a href="https://wa.me/51974681666" target="_blank" rel="noopener noreferrer" className="font-bold underline text-amber-950">(+51) 974 681 666</a>.
              </p>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
