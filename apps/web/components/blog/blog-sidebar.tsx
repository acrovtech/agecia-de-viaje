import Image from 'next/image';
import Link from 'next/link';

const latestPosts = [
  { id: 1, title: 'Los Secretos Ocultos de la Ciudadela de Machu Picchu', image: '/fallback.svg', slug: 'secretos-machu-picchu', date: '15 de Agosto, 2024' },
  { id: 2, title: 'Guía Definitiva para el Camino Inca', image: '/fallback.svg', slug: 'guia-camino-inca', date: '12 de Agosto, 2024' },
  { id: 3, title: '5 Cosas que debes saber antes de ir a Cusco', image: '/fallback.svg', slug: 'tips-cusco', date: '08 de Agosto, 2024' }
];

export function BlogSidebar({ currentSlug }: { currentSlug?: string }) {
  // Filter out the current post and limit to 3 posts max if needed
  const displayPosts = latestPosts.filter(post => post.slug !== currentSlug).slice(0, 3);

  return (
    <div className="w-full space-y-8 sticky top-24">
      <div className="p-2">
        <h3 className="text-xl font-bold font-heading text-gray-900 mb-6 border-b border-gray-100 pb-4">Últimos Posts</h3>
        <div className="flex flex-col gap-6">
          {displayPosts.map(post => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group flex gap-4 items-center">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex flex-col gap-1 justify-center">
                <h4 className="font-semibold text-gray-800 text-sm group-hover:text-brand-teal transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h4>
                <span className="text-xs text-gray-500 italic">{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

