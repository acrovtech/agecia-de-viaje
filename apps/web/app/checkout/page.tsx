import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CheckoutForm } from './checkout-form';
import { Suspense } from 'react';

export const metadata = {
  title: 'Checkout - Completar Reserva | Inca Bound',
};

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header variant="dark" />
      
      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Cargando checkout...</div>}>
            <CheckoutForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
