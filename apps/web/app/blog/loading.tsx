import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function BlogLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFA]">
      <Header variant="dark" />
      <main className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 py-16">
        <Loader2 className="w-10 h-10 animate-spin text-[#062918]" />
        <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando publicaciones del blog...</p>
      </main>
      <Footer />
    </div>
  );
}
