import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ShieldCheck, Lock, Eye, FileText, UserCheck, Server, AlertCircle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Políticas de Privacidad | Inca Bound Tour Operator',
  description: 'Conoce cómo Inca Bound protege tus datos personales en cumplimiento de la Ley N° 29733 de Protección de Datos Personales en Perú.',
};

export default function PrivacidadPage() {
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
              Políticas de Privacidad
            </h1>
            <p className="text-emerald-100 text-base md:text-lg opacity-90 leading-relaxed">
              Compromiso de protección de datos personales y transparencia en el tratamiento de información de nuestros viajeros (Ley N° 29733 - Perú).
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="container mx-auto px-4 lg:px-8 py-16 max-w-4xl">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs space-y-10">
            
            {/* Introducción */}
            <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 text-slate-700 text-sm md:text-base leading-relaxed space-y-2">
              <p className="font-semibold text-[#062918]">
                Inca Bound Tour Operator (E.I.R.L.)
              </p>
              <p>
                En cumplimiento de la <strong>Ley N° 29733 (Ley de Protección de Datos Personales de la República del Perú)</strong> y su Reglamento (D.S. 003-2013-JUS), garantizamos la confidencialidad, seguridad e integridad de la información proporcionada por nuestros clientes al utilizar nuestro sitio web e itinerarios de viaje.
              </p>
            </div>

            {/* Sección 1: Recopilación de Información */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Eye className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  1. Información Personal Recopilada
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Para procesar la reserva formal de servicios turísticos, pasajes de tren y boletos de ingreso a santuarios protegidos, recopilamos los siguientes datos personales:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Datos de Identificación:</strong> Nombres completos, apellidos, tipo y número de documento oficial (Pasaporte o DNI) y nacionalidad.</li>
                  <li><strong>Datos de Contacto:</strong> Correo electrónico, número telefónico / WhatsApp y país de residencia.</li>
                  <li><strong>Información de Viaje:</strong> Fechas de expedición, itinerarios seleccionados, restricciones alimentarias y/o médicas de relevancia para actividades de trekking.</li>
                </ul>
              </div>
            </section>

            {/* Sección 2: Finalidad del Tratamiento de Datos */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  2. Finalidad del Tratamiento de Datos
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  La información recolectada es utilizada exclusivamente para los siguientes fines operativos y legales:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Emisión de Boletos Nominativos:</strong> Compra obligatoria de entradas ante el Ministerio de Cultura del Perú (Llaqta de Machu Picchu y Camino Inca) y pasajes de tren en PeruRail o IncaRail.</li>
                  <li><strong>Seguro SOAT y Permisos:</strong> Tramitación de seguros de transporte turístico e inscripciones operativas ante la DIRCETUR.</li>
                  <li><strong>Coordinación y Soporte:</strong> Confirmación de itinerarios, notificación de horarios de recojo en hoteles y atención al cliente.</li>
                </ul>
              </div>
            </section>

            {/* Sección 3: Procesamiento de Pagos y Seguridad */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  3. Procesamiento de Pagos y Seguridad Financiera
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Las transacciones electrónicas se ejecutan a través de nuestra pasarela de pagos autorizada <strong>Izipay (Comercio Seguro PCI-DSS)</strong>.
                </p>
                <p className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 font-medium text-slate-800">
                  🔒 <strong>Inca Bound NUNCA almacena ni tiene acceso</strong> a los números completos de tarjetas de crédito o débito, códigos CVC/CVV o claves de seguridad bancarias de nuestros pasajeros.
                </p>
              </div>
            </section>

            {/* Sección 4: Protección de Menores (ESNNA) */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  4. Protección de Datos de Menores de Edad (Código ESNNA)
                </h2>
              </div>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                En estricto cumplimiento del <em>Código de Conducta contra la Explotación Sexual de Niños, Niñas y Adolescentes (ESNNA)</em>, la recolección de datos de menores se realiza únicamente con la autorización directa de sus padres o apoderados legales para fines exclusivos de acreditación de tarifas estudiantiles y pasajes turísticos.
              </p>
            </section>

            {/* Sección 5: Derechos ARCO */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Server className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  5. Derechos de Acceso, Rectificación y Cancelación (Derechos ARCO)
                </h2>
              </div>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                El titular de los datos personales puede ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición previstos en la Ley N° 29733, mediante comunicación escrita enviada a nuestro correo electrónico oficial: <a href="mailto:incabound@gmail.com" className="text-[#062918] font-bold underline">incabound@gmail.com</a>.
              </p>
            </section>

            {/* Aviso Final */}
            <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs md:text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Inca Bound se reserva el derecho de actualizar sus políticas de privacidad para cumplir con nuevas regulaciones gubernamentales o mejoras operativas. Las modificaciones serán publicadas oportunamente en esta misma sección.
              </p>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
