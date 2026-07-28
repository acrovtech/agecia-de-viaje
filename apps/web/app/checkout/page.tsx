import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CheckoutForm } from './checkout-form';
import { Suspense } from 'react';

export const metadata = {
  title: 'Checkout - Completa tu Reserva | Inca Bound',
};

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Header variant="dark" />
      
      <main className="flex-1 pt-24 pb-16">
        {/* Ancho máximo 1280px (max-w-7xl) coincidente con acrov-checkout-frame */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Cargando checkout...</div>}>
            <CheckoutForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
