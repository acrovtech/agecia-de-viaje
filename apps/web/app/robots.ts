import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://incabound.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/checkout',
        '/checkout/',
        '/carrito',
        '/reserva/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
