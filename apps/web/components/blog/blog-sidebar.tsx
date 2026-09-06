import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@repo/db';

export async function BlogSidebar({ currentSlug }: { currentSlug?: string }) {
  let latestPosts: any[] = [];
  try {
    latestPosts = await prisma.blog.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      where: currentSlug ? { slug: { not: currentSlug } } : undefined
    });
  } catch (e) {
    console.error("Error fetching latest blog posts for sidebar:", e);
  }

  if (latestPosts.length === 0) return null;

  return (
    <div className="w-full space-y-8 sticky top-28 select-none">
      <div className="p-2">
        <h3 className="text-xl font-bold font-heading text-slate-900 mb-6 border-b border-slate-100 pb-4">
          Últimos Posts
        </h3>
        <div className="flex flex-col gap-6">
          {latestPosts.map(post => {
            const hasThumb = Boolean(
              post.bannerImage &&
              !post.bannerImage.includes('default-') &&
              (post.bannerImage.startsWith('http') || post.bannerImage.startsWith('/uploads') || post.bannerImage.startsWith('/blogs'))
            );
            const dateStr = new Date(post.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

            return (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group flex gap-4 items-center">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200/80">
                  {hasThumb ? (
                    <Image src={post.bannerImage} alt={post.title} fill sizes="(max-width: 640px) 160px, 80px" quality={85} className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                      Blog
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 justify-center">
                  <h4 className="font-semibold text-slate-800 text-sm group-hover:text-[#062918] transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">{dateStr}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
