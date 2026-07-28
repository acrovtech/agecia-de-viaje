import { Suspense } from 'react';
import { CarritoClient } from './carrito-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tu Carrito de Reservas | Inca Bound',
  description: 'Revisa las expediciones seleccionadas en Inca Bound y procede al pago seguro.',
};

export default function CarritoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando carrito...</div>}>
      <CarritoClient />
    </Suspense>
  );
}
