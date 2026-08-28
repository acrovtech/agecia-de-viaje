import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ToursCatalogClient } from './tours-client';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Catálogo de Tours en Perú, Cusco y Machu Picchu | Inca Bound',
  description: 'Explora nuestra colección de tours diarios, trekking a Laguna Humantay, Vinicunca, Salkantay, Valle Sagrado y Machu Picchu con Inca Bound Tour Operator.',
  openGraph: {
    title: 'Catálogo de Tours en Perú | Inca Bound',
    description: 'Explora nuestra colección de tours diarios, trekking y experiencias auténticas en Cusco y Perú.',
    images: ['https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/tours-peru-inca-bound.webp'],
  },
};

function ToursSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="relative h-[60dvh] min-h-[460px] md:min-h-[500px] w-full bg-gray-900 flex items-center justify-center mb-8">
        <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
          <div className="h-12 w-80 bg-white/20 rounded-xl animate-pulse mx-auto mb-4" />
          <div className="h-4 w-96 bg-white/10 rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
      <main className="container mx-auto px-4 lg:px-8 pb-16 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ToursCatalogPage() {
  return (
    <Suspense fallback={<ToursSkeleton />}>
      <ToursCatalogClient />
    </Suspense>
  );
}
