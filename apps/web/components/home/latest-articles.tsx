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

  const displayArticles = articles.map(a => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    bannerImage: a.bannerImage || '/fallback.svg'
  }));

  return <ArticlesCarousel articles={displayArticles} />;
}
