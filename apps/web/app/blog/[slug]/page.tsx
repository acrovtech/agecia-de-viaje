import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BlogSidebar } from '@/components/blog/blog-sidebar';
import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const rawSlug = resolvedParams?.slug || '';
  const decodedSlug = decodeURIComponent(rawSlug).trim();

  const blog = await prisma.blog.findFirst({
    where: {
      OR: [
        { slug: decodedSlug },
        { slug: decodedSlug.toLowerCase() },
        { slug: rawSlug },
        { slug: rawSlug.toLowerCase() }
      ]
    },
    include: { paragraphs: true }
  });

  if (!blog) {
    return { title: 'Blog no encontrado - Inca Bound' };
  }

  return {
    title: blog.metaTitle || `${blog.title} - Inca Bound`,
    description: blog.metaDescription || blog.paragraphs?.[0]?.content?.slice(0, 160) || '',
    keywords: blog.keywords || undefined,
    openGraph: {
      title: blog.title,
      description: blog.metaDescription || blog.title,
      images: blog.bannerImage ? [{ url: blog.bannerImage }] : [],
    },
  };
}

export default async function SingleBlogPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const rawSlug = resolvedParams?.slug || '';
  const decodedSlug = decodeURIComponent(rawSlug).trim();
  if (!rawSlug && !decodedSlug) notFound();

  const blog = await prisma.blog.findFirst({
    where: {
      OR: [
        { slug: decodedSlug },
        { slug: decodedSlug.toLowerCase() },
        { slug: rawSlug },
        { slug: rawSlug.toLowerCase() }
      ]
    },
    include: {
      paragraphs: { orderBy: { order: 'asc' } },
    },
  });

  if (!blog) notFound();

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasBanner = Boolean(
    blog.bannerImage &&
    !blog.bannerImage.includes('default-') &&
    (blog.bannerImage.startsWith('http') || blog.bannerImage.startsWith('/uploads') || blog.bannerImage.startsWith('/blogs'))
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero Banner Header */}
        <div className="relative h-[45dvh] md:h-[60dvh] min-h-[360px] w-full bg-slate-950 flex items-end justify-center overflow-hidden">
          {hasBanner ? (
            <div className="absolute inset-0">
              <Image src={blog.bannerImage} alt={blog.title} fill sizes="100vw" className="object-cover opacity-75" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
          )}
        </div>

        {/* Post Title & Date */}
        <div className="container mx-auto px-4 pt-12 pb-8 text-center relative z-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-slate-900 leading-tight tracking-tight mb-6 max-w-5xl mx-auto">
            {blog.title}
          </h1>
          <div className="w-16 h-1 bg-[#062918] mx-auto mb-6 rounded-full" />
          <p className="text-slate-500 italic text-sm font-medium">
            Publicado el {formattedDate}
          </p>
        </div>

        {/* Article Body + Sidebar */}
        <div className="container mx-auto px-4 pb-20 relative z-20">
          <div className="flex flex-col lg:flex-row gap-12 w-full">
            
            {/* Left Column (70%) - Paragraph Blocks */}
            <article className="lg:w-[70%] md:pr-8 space-y-12">
              {blog.paragraphs.map((p, index) => {
                const hasBlockImage = Boolean(
                  p.image &&
                  (p.image.startsWith('http') || p.image.startsWith('/uploads') || p.image.startsWith('/blogs'))
                );

                const isEven = index % 2 === 0;

                return (
                  <div key={p.id || index} className="w-full">
                    {hasBlockImage ? (
                      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 lg:gap-8 items-start my-6">
                        {isEven ? (
                          <>
                            {/* Text Container (Left) */}
                            <div className="md:col-span-6 text-slate-700 text-base md:text-lg leading-relaxed space-y-4">
                              {p.subtitle && (
                                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-heading text-slate-900 leading-snug">
                                  {p.subtitle}
                                </h2>
                              )}
                              {p.content.split('\n\n').map((paragraphText, i) => (
                                <p key={i}>{paragraphText}</p>
                              ))}
                            </div>

                            {/* Image Container (Right) */}
                            <div className="md:col-span-4 relative aspect-[4/3] w-full max-h-[260px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                              <Image 
                                src={p.image!} 
                                alt={p.subtitle || blog.title} 
                                fill 
                                className="object-cover" 
                                sizes="(max-width: 768px) 100vw, 40vw"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Image Container (Left on desktop) */}
                            <div className="md:col-span-4 relative aspect-[4/3] w-full max-h-[260px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0 md:order-1 order-2">
                              <Image 
                                src={p.image!} 
                                alt={p.subtitle || blog.title} 
                                fill 
                                className="object-cover" 
                                sizes="(max-width: 768px) 100vw, 40vw"
                              />
                            </div>

                            {/* Text Container (Right on desktop) */}
                            <div className="md:col-span-6 text-slate-700 text-base md:text-lg leading-relaxed space-y-4 md:order-2 order-1">
                              {p.subtitle && (
                                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-heading text-slate-900 leading-snug">
                                  {p.subtitle}
                                </h2>
                              )}
                              {p.content.split('\n\n').map((paragraphText, i) => (
                                <p key={i}>{paragraphText}</p>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-700 text-base md:text-lg leading-relaxed space-y-4 my-6">
                        {p.subtitle && (
                          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-heading text-slate-900 leading-snug mb-3">
                            {p.subtitle}
                          </h2>
                        )}
                        {p.content.split('\n\n').map((paragraphText, i) => (
                          <p key={i}>{paragraphText}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </article>

            {/* Right Column (30%) - Dynamic Sidebar */}
            <aside className="lg:w-[30%] pt-10 lg:pt-0">
              <BlogSidebar currentSlug={blog.slug} />
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
