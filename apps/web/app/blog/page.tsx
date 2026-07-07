import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata = {
  title: 'Blog de Viajes | Inca Bound',
  description: 'Descubre historias, guías y consejos para tu próxima aventura en los Andes y Machu Picchu.',
};

const allArticles = [
  {
    id: 1,
    title: 'Los Secretos Ocultos de la Ciudadela de Machu Picchu',
    image: '/fallback.svg',
    slug: 'secretos-machu-picchu'
  },
  {
    id: 2,
    title: 'Guía Definitiva para el Camino Inca',
    image: '/fallback.svg',
    slug: 'guia-camino-inca'
  },
  {
    id: 3,
    title: '5 Cosas que debes saber antes de ir a Cusco',
    image: '/fallback.svg',
    slug: 'tips-cusco'
  },
  {
    id: 4,
    title: 'La Gastronomía Andina que debes probar',
    image: '/fallback.svg',
    slug: 'gastronomia-andina'
  },
  {
    id: 5,
    title: '¿Por qué elegir el Salkantay Trek?',
    image: '/fallback.svg',
    slug: 'por-que-salkantay'
  },
  {
    id: 6,
    title: 'Aclimatación y Soroche: Guía de Supervivencia',
    image: '/fallback.svg',
    slug: 'aclimatacion-soroche'
  },
  {
    id: 7,
    title: 'El mejor equipo para hacer senderismo en Perú',
    image: '/fallback.svg',
    slug: 'equipo-senderismo'
  },
  {
    id: 8,
    title: 'Tradiciones Vivas: La cultura de las comunidades',
    image: '/fallback.svg',
    slug: 'tradiciones-vivas'
  }
];

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[80dvh] min-h-[500px] w-full bg-gray-900 flex items-center justify-center">
          <div className="absolute inset-0">
            {/* Background Image placeholder */}
            <div className="absolute inset-0 bg-[url('/blogs-hero-inca-bound.webp')] bg-cover bg-center opacity-50" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="relative z-10 text-center px-4 mt-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-white mb-6 drop-shadow-lg leading-tight tracking-tight">
              Blog del Viajero
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Inspírate con nuestras historias, guías completas y los mejores tips para organizar tu expedición a la tierra de los Incas.
            </p>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {allArticles.map((article) => (
              <Link 
                href={`/blog/${article.slug}`} 
                key={article.id} 
                className="relative group cursor-pointer overflow-hidden aspect-[4/3] bg-black block rounded-2xl shadow-sm"
              >
                {/* Background Image */}
                <Image 
                  src={article.image} 
                  alt={article.title} 
                  fill 
                  className="object-cover opacity-70 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105 z-0"
                />
                
                {/* Gradient overlay for bottom text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                {/* Content - Bottom Title */}
                <div className="absolute inset-0 flex items-end justify-start p-6 text-left z-20">
                  <h3 className="text-white text-[18px] font-semibold tracking-wide font-heading drop-shadow-md transform group-hover:-translate-y-2 transition-transform duration-500">
                    {article.title}
                  </h3>
                </div>
                
                {/* "Street Fighter" Selection Border Effect (Modified) */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none rounded-tl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none rounded-br-lg" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

