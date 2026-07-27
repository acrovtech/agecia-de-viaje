import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CheckoutForm } from './checkout-form';
import { Suspense } from 'react';

export const metadata = {
  title: 'Checkout | Inca Bound',
};

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header variant="dark" />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 mb-1">Completar Reserva</h1>
            <p className="text-sm sm:text-base text-gray-600">Estás a un paso de tu próxima gran aventura en los Andes.</p>
          </div>
          <Suspense fallback={<div className="h-40 flex items-center justify-center">Cargando formulario...</div>}>
            <CheckoutForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
