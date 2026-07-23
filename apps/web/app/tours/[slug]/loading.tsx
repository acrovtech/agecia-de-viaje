import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function LoadingTourDetail() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Hero Skeleton */}
        <div className="relative pt-20 w-full bg-gray-900 flex flex-col justify-end min-h-[50dvh] animate-pulse">
          <div className="container mx-auto px-4 lg:px-8 pb-16">
            <div className="h-10 bg-white/20 rounded-lg w-2/3 max-w-xl mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-1/3"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 animate-pulse">
            <div className="w-full lg:w-2/3 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 p-4"></div>
                ))}
              </div>
              <div className="h-32 bg-white rounded-2xl border border-gray-100 p-6"></div>
              <div className="h-64 bg-white rounded-2xl border border-gray-100 p-6"></div>
            </div>
            <div className="w-full lg:w-1/3 space-y-6">
              <div className="h-48 bg-white rounded-2xl border border-gray-100"></div>
              <div className="h-64 bg-white rounded-2xl border border-gray-100"></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
