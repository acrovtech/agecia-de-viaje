import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { prisma } from '@repo/db';

export const metadata = {
  title: 'Blog de Viajes | Inca Bound',
  description: 'Descubre historias, guías y consejos para tu próxima aventura en los Andes y Machu Picchu.',
};

export const revalidate = 3600;

export default async function BlogPage() {
  let allArticles: any[] = [];
  try {
    allArticles = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error cargando el blog:", error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header />

      <main className="flex-1">
        {/* Hero Section Normalizado */}
        <div className="relative h-[60dvh] min-h-[460px] md:min-h-[500px] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/blogs-hero-inca-bound.webp" 
              alt="Blog del Viajero Inca Bound" 
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
              Blog del Viajero
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed">
              Inspírate con nuestras historias, guías completas y los mejores tips para organizar tu expedición a la tierra de los Incas.
            </p>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="container mx-auto px-4 py-20">
          {allArticles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 max-w-xl mx-auto shadow-xs">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Próximamente nuevas historias</h3>
              <p className="text-gray-500 text-sm">
                Estamos preparando guías detalladas y recomendaciones exclusivas para tu próximo viaje.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {allArticles.map((article) => (
                <Link 
                  href={`/blog/${article.slug}`} 
                  key={article.id} 
                  className="relative group cursor-pointer overflow-hidden aspect-[4/3] bg-black block rounded-2xl shadow-sm"
                >
                  <Image 
                    src={article.bannerImage || '/fallback.svg'} 
                    alt={article.title} 
                    fill 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 440px"
                    quality={85}
                    className="object-cover opacity-70 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105 z-0"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                  <div className="absolute inset-0 flex items-end justify-start p-6 text-left z-20">
                    <h3 className="text-white text-[18px] font-semibold tracking-wide font-heading drop-shadow-md transform group-hover:-translate-y-2 transition-transform duration-500">
                      {article.title}
                    </h3>
                  </div>
                  
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none rounded-tl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none rounded-br-lg" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
