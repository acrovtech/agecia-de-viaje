import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CheckoutForm } from './checkout-form';

export const metadata = {
  title: 'Checkout | Inca Bound',
};

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">Completar Reserva</h1>
            <p className="text-gray-600">Estás a un paso de tu próxima gran aventura en los Andes.</p>
          </div>

          <CheckoutForm />

        </div>
      </main>

      <Footer />
    </div>
  );
}
