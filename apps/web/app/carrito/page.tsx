import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function CarritoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header variant="dark" />
      <main className="flex-1 flex flex-col items-center justify-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tu Carrito de Reservas</h1>
        <p className="text-gray-500">Próximamente podrás finalizar tus reservas aquí.</p>
      </main>
      <Footer />
    </div>
  );
}
