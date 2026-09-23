import { MetadataRoute } from 'next';
import { prisma } from '@repo/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://agenciadeviajes.com';

  // Rutas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tours`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transporte`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/esnna`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pagos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politicas-de-transporte`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Rutas dinámicas desde la BD (Tours y Blog)
  try {
    const [tours, blogs] = await Promise.all([
      prisma.tour.findMany({
        where: { isPublished: true },
        select: {
          slug: true,
          updatedAt: true,
          bannerImage: true,
          cardImage: true,
          images: {
            select: { url: true },
            take: 5,
          },
        },
      }),
      prisma.blog.findMany({
        select: {
          slug: true,
          updatedAt: true,
          bannerImage: true,
        },
      }),
    ]);

    const tourRoutes: MetadataRoute.Sitemap = tours.map((tour) => {
      const images = [
        tour.bannerImage,
        tour.cardImage,
        ...(tour.images?.map((img) => img.url) || []),
      ].filter((img): img is string => Boolean(img && (img.startsWith('http') || img.startsWith('/'))));

      return {
        url: `${baseUrl}/tours/${tour.slug}`,
        lastModified: tour.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
        ...(images.length > 0 ? { images: Array.from(new Set(images)) } : {}),
      };
    });

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => {
      const images = [blog.bannerImage].filter(
        (img): img is string => Boolean(img && (img.startsWith('http') || img.startsWith('/')))
      );

      return {
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: blog.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
        ...(images.length > 0 ? { images: Array.from(new Set(images)) } : {}),
      };
    });

    return [...staticRoutes, ...tourRoutes, ...blogRoutes];
  } catch (error) {
    console.error('Error generando sitemap dinámico:', error);
    return staticRoutes;
  }
}
