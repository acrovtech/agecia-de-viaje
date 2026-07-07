import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/home/hero';
import dynamic from 'next/dynamic';

const WhyUs = dynamic(() => import('@/components/home/why-us').then(mod => mod.WhyUs), { ssr: true });
const RecommendedTours = dynamic(() => import('@/components/home/recommended-tours').then(mod => mod.RecommendedTours), { ssr: true });
const WhatDefinesUs = dynamic(() => import('@/components/home/what-defines-us').then(mod => mod.WhatDefinesUs), { ssr: true });
const SocialResponsibility = dynamic(() => import('@/components/home/social-responsibility').then(mod => mod.SocialResponsibility), { ssr: true });
const FaqSection = dynamic(() => import('@/components/home/faq-section').then(mod => mod.FaqSection), { ssr: true });
const LatestArticles = dynamic(() => import('@/components/home/latest-articles').then(mod => mod.LatestArticles), { ssr: true });
const Testimonials = dynamic(() => import('@/components/home/testimonials').then(mod => mod.Testimonials), { ssr: true });

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
