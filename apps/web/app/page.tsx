import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/home/hero';
import { WhyUs } from '@/components/home/why-us';
import { RecommendedTours } from '@/components/home/recommended-tours';
import { WhatDefinesUs } from '@/components/home/what-defines-us';
import { SocialResponsibility } from '@/components/home/social-responsibility';
import { FaqSection } from '@/components/home/faq-section';
import { LatestArticles } from '@/components/home/latest-articles';
import { Testimonials } from '@/components/home/testimonials';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        <Hero />

        {/* 3. Por qué Incabound */}
        <WhyUs />

        {/* 4. Tours Recomendados (4 cards) */}
        <RecommendedTours />

        {/* 5. Lo que nos define (3 cards) */}
        <WhatDefinesUs />

        {/* 6. Responsabilidad Social (Bento Grid) */}
        <SocialResponsibility />

        {/* 7. Testimonios (Tripadvisor) */}
        <Testimonials />

        {/* 8. FAQs (SEO Optimized) */}
        <FaqSection />

        {/* 9. Últimos Blogs */}
        <LatestArticles />
      </main>

      <Footer />
    </div>
  );
}
