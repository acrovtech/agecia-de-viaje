import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Clock, Users, MapPin, ShieldCheck, HeartPulse, Luggage, AlertCircle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Inca Bound Tour Operator',
  description: 'Conoce las políticas de servicio, duración de tours de 1 Día y 1/2 Día, tamaño de grupos de máximo 19 Pax y condiciones de reserva de Inca Bound.',
};

export default function TerminosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header variant="dark" />

      <main className="flex-1">
        {/* Banner de Encabezado */}
        <div className="bg-[#062918] text-white pt-28 pb-16">
          <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 text-emerald-300 mb-4 backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-heading mb-4 tracking-tight">
              Términos y Condiciones
            </h1>
            <p className="text-emerald-100 text-base md:text-lg opacity-90 leading-relaxed">
              Políticas de servicio, itinerarios operacionales, duraciones reales, capacidad de pasajeros y condiciones de transporte de Inca Bound Tour Operator.
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="container mx-auto px-4 lg:px-8 py-16 max-w-4xl">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs space-y-10">
            
            {/* Sección 1: Duración de los Tours */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  1. Duración Operativa de los Servicios (1 Día y 1/2 Día)
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  En <strong>Inca Bound Tour Operator</strong>, la clasificación de la duración de nuestras expediciones se define bajo los siguientes estándares operativos reales:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-slate-700">
                  <li>
                    <strong>Tours de 1 Día (Jornada Completa):</strong> Corresponden a expediciones de alta montaña y circuitos regionales (tales como <em>Laguna Humantay, Montaña de 7 Colores, Ausangate, Valle Sagrado, Machu Picchu, Waqrapukara, Pallay Poncho y Queshuachaca</em>). La duración real de un tour de "1 Día" abarca entre <strong>12 y 16 horas</strong> de servicio continuo, que incluyen el recojo matutino en hospedaje, traslados terrestres de ida y vuelta, tiempos de trekking, alimentación y paradas guiadas.
                  </li>
                  <li>
                    <strong>Tours de 1/2 Día (Media Jornada):</strong> Corresponden a recorridos urbanos y de aclimatación céntrica (como el <em>City Tour Cusco</em>), con una duración operativa aproximada de <strong>5 a 6 horas</strong>.
                  </li>
                </ul>
              </div>
            </section>

            {/* Sección 2: Tamaño de Grupo (Pax) */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  2. Capacidad y Tamaño de Grupo (Máximo 19 Pasajeros)
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Para garantizar la máxima seguridad, comodidad y calidad en la guianza bilingüe, los grupos en modalidad compartida están estrictamente limitados a un máximo de <strong>19 pasajeros (19 Pax)</strong> por unidad de transporte turístico de primera categoría.
                </p>
                <p>
                  En servicios de modalidad privada, la capacidad se personaliza de acuerdo al requerimiento específico del cliente o corporación.
                </p>
              </div>
            </section>

            {/* Sección 3: Puntos de Recojo y Horarios */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  3. Puntos de Recojo y Puntualidad
                </h2>
              </div>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                Los recojos incluidos en la tarifa compartida aplican para hoteles y alojamientos ubicados dentro del Centro Histórico de Cusco. En caso de hospedajes en departamentos privados (AirBnB) o pasajes fuera del perímetro céntrico de transporte pesado, se coordinará un punto de encuentro accesible cercano (ej. Plaza Regocijo o Plaza de Armas).
              </p>
            </section>

            {/* Sección 4: Salud y Aclimatación (Soroche) */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  4. Salud, Aclimatación y Mal de Altura (Soroche)
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Expediciones a Laguna Humantay (4,200 m s. n. m.) o Montaña de Colores (5,020 m s. n. m.) exigen una adecuada aclimatación previa en la ciudad de Cusco (mínimo 24 a 48 horas).
                </p>
                <p>
                  El pasajero tiene la obligación moral de comunicar a nuestro equipo cualquier condición de salud preexistente (cardíaca, respiratoria o hipertensión). Nuestras unidades cuentan con botiquín de primeros auxilios y balón de oxígeno medicinal para contingencias.
                </p>
              </div>
            </section>

            {/* Sección 5: Equipaje y Pertencias */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Luggage className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  5. Responsabilidad sobre Equipaje y Pertenencias
                </h2>
              </div>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                Cada pasajero es responsable del cuidado de sus objetos personales, cámaras y documentos durante las caminatas y paradas. Inca Bound no se responsabiliza por pérdidas de artículos de valor dejados desatendidos fuera de las consignas oficiales del transporte.
              </p>
            </section>

            {/* Aviso Final */}
            <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs md:text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Al efectuar la reserva de cualquier expedición o paquete a través de nuestro portal web o asesores oficiales de Inca Bound, el usuario declara haber leído, comprendido y aceptado incondicionalmente los presentes Términos y Condiciones.
              </p>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
