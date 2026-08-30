import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Cookie, ShieldCheck, CheckCircle2, Sliders, Info, Lock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Política de Cookies | Inca Bound Tour Operator',
  description: 'Conoce cómo Inca Bound utiliza cookies y tecnologías similares para garantizar la mejor experiencia de navegación y seguridad en tu reserva.',
};

export default function CookiesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header />

      <main className="flex-1">
        {/* Hero Section Normalizado con Fondo Fotográfico */}
        <div className="relative h-[60dvh] min-h-[460px] md:min-h-[500px] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src="/assets/heros/hero-cookies.png" 
              alt="Políticas de Cookies Inca Bound" 
              fill 
              sizes="100vw" 
              className="object-cover" 
              priority 
              unoptimized={true} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
          </div>

          <div className="relative z-10 text-center px-4 mt-16 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold font-heading text-white mb-4 tracking-tight drop-shadow-lg leading-tight">
              Política de Cookies
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Información clara y transparente sobre el uso de cookies y tecnologías de almacenamiento local en Inca Bound (Ley N° 29733 - Perú).
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
                En <strong>Inca Bound</strong> utilizamos cookies y tecnologías similares para optimizar la velocidad de carga de nuestros itinerarios, recordar tus preferencias de reserva, facilitar el pago seguro y ofrecerte una experiencia de navegación personalizada y confiable.
              </p>
            </div>

            {/* Sección 1: ¿Qué son las cookies? */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Info className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  1. ¿Qué son las Cookies?
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Una <em>cookie</em> es un pequeño archivo de texto que un sitio web descarga en tu dispositivo (computadora, smartphone o tablet) cuando lo visitas. Permiten que el sitio recuerde tus acciones y preferencias (como inicio de sesión, idioma, tamaño de letra, items en el carrito de reservas y otras opciones de visualización) durante un período determinado, evitando que tengas que volver a introducirlos cada vez que regresas.
                </p>
              </div>
            </section>

            {/* Sección 2: Tipos de Cookies que utilizamos */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Sliders className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  2. Tipos de Cookies que Utilizamos
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Esenciales */}
                <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-2">
                  <div className="flex items-center gap-2 text-[#062918] font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Cookies Técnicas y Esenciales</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    Indispensables para el funcionamiento básico de la web. Permiten la navegación fluida, la gestión del carrito de compras y la seguridad de las transacciones con pasarela bancaria. No requieren consentimiento previo.
                  </p>
                </div>

                {/* Rendimiento */}
                <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <Eye className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>Cookies de Rendimiento y Análisis</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    Nos ayudan a comprender de forma anónima cómo interactúan los viajeros con nuestra plataforma (páginas más visitadas, tiempos de carga, posibles errores) para mejorar continuamente el servicio.
                  </p>
                </div>

                {/* Preferencias */}
                <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>Cookies de Funcionalidad y Preferencia</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    Guardan tus preferencias individuales, como filtros de búsqueda en tours o traslados, moneda seleccionada e información temporal en el proceso de reserva.
                  </p>
                </div>

                {/* Seguridad */}
                <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <Lock className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>Cookies de Seguridad y Prevención</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    Protegen las sesiones contra ataques maliciosos (CSRF), autentican las sesiones administrativas y validan la integridad de las peticiones a nuestra API.
                  </p>
                </div>

              </div>
            </section>

            {/* Sección 3: Tabla Detallada */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <Cookie className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  3. Detalle de Cookies Aplicadas
                </h2>
              </div>
              
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs md:text-sm text-slate-700">
                  <thead className="bg-[#062918] text-white uppercase text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Cookie / Clave</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4">Propósito</th>
                      <th className="py-3 px-4">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-medium text-emerald-800">ib_cookie_consent</td>
                      <td className="py-3 px-4">Inca Bound</td>
                      <td className="py-3 px-4">Almacena la preferencia de consentimiento del usuario sobre la política de cookies.</td>
                      <td className="py-3 px-4">1 año</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-medium text-emerald-800">session_token / auth</td>
                      <td className="py-3 px-4">Inca Bound</td>
                      <td className="py-3 px-4">Gestión segura de sesión de usuario y panel administrativo.</td>
                      <td className="py-3 px-4">Sesión / 7 días</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-medium text-emerald-800">_ga / _ga_*</td>
                      <td className="py-3 px-4">Google Analytics</td>
                      <td className="py-3 px-4">Métricas estadísticas agregadas y anónimas de visitas.</td>
                      <td className="py-3 px-4">Hasta 2 años</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-medium text-emerald-800">izi_session / vads_*</td>
                      <td className="py-3 px-4">Izipay</td>
                      <td className="py-3 px-4">Validación del token de seguridad en la pasarela de pagos cifrada.</td>
                      <td className="py-3 px-4">Sesión</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Sección 4: Cómo desactivar cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-[#062918]">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-heading">
                  4. ¿Cómo Administrar o Desactivar las Cookies?
                </h2>
              </div>
              <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-3">
                <p>
                  Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones de tu navegador web. En caso de desactivar cookies técnicas esenciales, algunas funcionalidades de la tienda o el proceso de checkout de reservas podrían no operar con normalidad.
                </p>
                <p className="font-semibold text-slate-800 pt-1">
                  Instrucciones según tu navegador:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-slate-700 text-xs md:text-sm">
                  <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
                  <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y Seguridad &gt; Cookies y datos del sitio.</li>
                  <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
                  <li><strong>Microsoft Edge:</strong> Configuración &gt; Cookies y permisos del sitio &gt; Administrar y eliminar cookies.</li>
                </ul>
              </div>
            </section>

            {/* Sección 5: Enlace con Privacidad */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-700 text-sm md:text-base leading-relaxed space-y-2">
              <h3 className="font-bold text-[#062918] text-base md:text-lg">
                Relación con nuestras Políticas de Privacidad
              </h3>
              <p>
                Para conocer detalladamente cómo tratamos tus datos personales, tus derechos ARCO y las medidas de seguridad que implementamos conforme a la <strong>Ley N° 29733</strong>, te invitamos a consultar nuestras{' '}
                <Link href="/privacidad" className="text-[#062918] font-bold underline hover:text-[#008060] transition-colors">
                  Políticas de Privacidad
                </Link>.
              </p>
            </div>

            {/* Aviso Final */}
            <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs md:text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Inca Bound puede modificar esta Política de Cookies en función de nuevas exigencias legislativas, reglamentarias o con la finalidad de adaptar dicha política a las instrucciones dictadas por la Autoridad Nacional de Protección de Datos Personales del Perú.
              </p>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
