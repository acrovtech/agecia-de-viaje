import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@repo/db';
import { ArticlesCarousel } from './articles-carousel';

export async function LatestArticles() {
  let articles: any[] = [];
  try {
    articles = await prisma.blog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error cargando artículos del blog:", error);
  }

  // Fallbacks si la BD está inicializándose
  const defaultArticles = [
    {
      id: '1',
      title: 'Guía Completa para Visitar la Laguna Humantay',
      slug: 'guia-laguna-humantay',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/agencia-viajes-inca-bound.webp'
    },
    {
      id: '2',
      title: 'Consejos para Aclimatarte al Mal de Altura (Soroche) en Cusco',
      slug: 'consejos-aclimatacion-cusco',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/viajes-seguros-peru-inca-bound.webp'
    },
    {
      id: '3',
      title: 'Montaña de 7 Colores (Vinicunca): Todo lo que Debes Saber',
      slug: 'montana-7-colores-vinicunca',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/experiencia-viajes-inca-bound.webp'
    },
    {
      id: '4',
      title: 'Qué Llevar en tu Mochila de Trekking para el Valle Sagrado',
      slug: 'que-llevar-valle-sagrado',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/mascara.webp'
    },
    {
      id: '5',
      title: 'Machu Picchu: Diferencias entre los Circuitos de Ingreso',
      slug: 'circuitos-machu-picchu',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/tours-peru-inca-bound.webp'
    },
    {
      id: '6',
      title: 'Gastronomía Andina: Platos Típicos que Debes Probar en Cusco',
      slug: 'gastronomia-andina-cusco',
      bannerImage: 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/agencia-viajes-cusco-contacto.webp'
    }
  ];

  const displayArticles = articles.length > 0 
    ? articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        bannerImage: a.bannerImage || 'https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/agencia-viajes-inca-bound.webp'
      }))
    : defaultArticles;

  return <ArticlesCarousel articles={displayArticles} />;
}
