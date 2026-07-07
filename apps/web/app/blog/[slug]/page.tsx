import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BlogSidebar } from '@/components/blog/blog-sidebar';

export default function SingleBlogPage({ params }: { params: { slug: string } }) {
  // Mock data for the post matching the user's dynamic requirements
  const post = {
    title: 'Los Secretos Ocultos de la Ciudadela de Machu Picchu',
    date: '15 de Agosto, 2024',
    heroImage: '/salkantay.webp',
    blocks: [
      { 
        type: 'paragraph', 
        title: 'Un Enigma en las Nubes',
        content: 'Machu Picchu, la ciudad perdida de los Incas, esconde más secretos de los que el turista promedio llega a conocer. Ubicada a más de 2,400 metros sobre el nivel del mar, esta maravilla arquitectónica no solo es un prodigio de la ingeniería, sino también un santuario sagrado rodeado de misticismo.' 
      },
      { type: 'full-image', url: '/laguna-de-humantay.webp' },
      { 
        type: 'paragraph', 
        content: 'A pesar de haber sido "descubierta" científicamente por Hiram Bingham en 1911, los arqueólogos modernos siguen encontrando nuevas terrazas, canales de agua subterráneos y templos ocultos bajo la densa vegetación del bosque nuboso. La ciudad sigue revelando fragmentos de la vida de quienes la construyeron para el inca Pachacútec.' 
      },
      { 
        type: 'text-image', 
        align: 'left', 
        url: '/salkantay.webp', 
        title: 'La Ingeniería Sin Ruedas',
        content: 'Uno de los mayores misterios es cómo los Incas lograron transportar rocas que pesan toneladas a través de las montañas escarpadas sin conocer la rueda ni tener animales de tiro grandes. La teoría más aceptada sugiere el uso de rodillos de madera y una fuerza laboral masiva, impulsada por la devoción espiritual más que por la esclavitud.' 
      },
      { 
        type: 'paragraph', 
        content: 'Caminar por sus estrechas callejuelas de piedra es retroceder en el tiempo. Cada sector de la ciudadela, ya sea el agrícola, el urbano o el religioso, fue diseñado en perfecta armonía con el entorno montañoso y los movimientos astronómicos. Durante el solsticio de invierno, por ejemplo, el sol se alinea perfectamente con la ventana central del Templo del Sol.' 
      },
      { 
        type: 'text-image', 
        align: 'right', 
        url: '/agencia-viajes-cusco-contacto.webp', 
        title: 'Más Allá de la Ciudadela',
        content: 'Además de la ciudadela principal, montañas como Huayna Picchu y Machu Picchu Montaña ofrecen vistas espectaculares y albergan sitios como el Templo de la Luna, una cueva ceremonial asombrosa tallada con precisión milimétrica. Planificar tu viaje con tiempo y un buen guía es fundamental para descubrir todos estos detalles imperdibles.' 
      },
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Clean, no text */}
        <div className="relative h-[80dvh] min-h-[400px] w-full bg-gray-900 flex items-end justify-center">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/salkantay.webp')] bg-cover bg-center opacity-90" />
          </div>
        </div>

        {/* Post Header (Centered) */}
        <div className="container mx-auto px-4 pt-16 pb-8 text-center max-w-4xl relative z-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-gray-900 leading-tight tracking-tight mb-6">
            {post.title}
          </h1>
          <div className="w-16 h-1 bg-brand-teal mx-auto mb-6 rounded-full"></div>
          <p className="text-gray-500 italic">
            Publicado el {post.date}
          </p>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 pb-20 relative z-20">
          <div className="flex flex-col lg:flex-row gap-12 w-full">
            
            {/* Left Column (70%) - Main Content */}
            <article className="lg:w-[70%] md:pr-12">

              <div className="max-w-none">
                {post.blocks.map((block, index) => {
                  if (block.type === 'paragraph') {
                    return (
                      <div key={index} className="mb-10">
                        {block.title && (
                          <h3 className="text-2xl font-bold font-heading text-gray-900 mb-4">{block.title}</h3>
                        )}
                        <p className="text-gray-600 text-lg leading-relaxed m-0">
                          {block.content}
                        </p>
                      </div>
                    );
                  }
                  
                  if (block.type === 'full-image') {
                    return (
                      <div key={index} className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden my-10">
                        <Image src={block.url!} alt="Imagen del artículo" fill className="object-cover" />
                      </div>
                    );
                  }
                  
                  if (block.type === 'text-image') {
                    const isLeft = block.align === 'left';
                    return (
                      <div key={index} className={`flex flex-col ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-stretch gap-8 my-10`}>
                        {/* Image Side */}
                        <div className="w-full md:w-1/2 relative min-h-[250px] md:min-h-full rounded-2xl overflow-hidden">
                          <Image src={block.url!} alt="Imagen del artículo" fill className="object-cover" />
                        </div>
                        {/* Text Side */}
                        <div className="w-full md:w-1/2 flex items-center">
                          <div>
                            {block.title && (
                              <h3 className="text-2xl font-bold font-heading text-gray-900 mb-4">{block.title}</h3>
                            )}
                            <p className="text-gray-600 text-lg leading-relaxed m-0">
                              {block.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </article>

            {/* Right Column (30%) - Sidebar */}
            <aside className="lg:w-[30%] pt-16 lg:pt-0">
              <BlogSidebar currentSlug={params.slug} />
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
