'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Users, ShieldCheck, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';

export function CarritoClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cartItem, setCartItem] = useState<{
    slug: string;
    tourTitle: string;
    date: string;
    pax: number;
    serviceType: string;
    price: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    // 1. Leer de query params si viene directo de tour-booking-card
    const slug = searchParams.get('slug');
    const tourTitle = searchParams.get('tourTitle');
    const date = searchParams.get('date');
    const pax = searchParams.get('pax');
    const type = searchParams.get('type');
    const price = searchParams.get('price');

    if (slug && tourTitle && date && price) {
      const newItem = {
        slug,
        tourTitle,
        date,
        pax: parseInt(pax || '1', 10),
        serviceType: type || 'shared',
        price: parseFloat(price),
        total: parseFloat(price) * parseInt(pax || '1', 10),
      };
      setCartItem(newItem);
      if (typeof window !== 'undefined') {
        localStorage.setItem('incabound_cart', JSON.stringify(newItem));
      }
    } else if (typeof window !== 'undefined') {
      // 2. O leer de localStorage si ya estaba guardado
      const saved = localStorage.getItem('incabound_cart');
      if (saved) {
        try {
          setCartItem(JSON.parse(saved));
        } catch {
          setCartItem(null);
        }
      }
    }
  }, [searchParams]);

  const handleClearCart = () => {
    setCartItem(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('incabound_cart');
    }
  };

  const handleProceedToCheckout = () => {
    if (!cartItem) return;
    const query = new URLSearchParams({
      slug: cartItem.slug,
      tourTitle: cartItem.tourTitle,
      date: cartItem.date,
      pax: cartItem.pax.toString(),
      type: cartItem.serviceType,
      price: cartItem.price.toString(),
      total: cartItem.total.toString(),
    });
    router.push(`/checkout?${query.toString()}`);
  };

  const formattedDate = cartItem?.date
    ? new Date(cartItem.date).toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header variant="dark" />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl font-bold font-heading text-gray-900">Tu Carrito de Reservas</h1>
              <p className="text-gray-500 text-sm mt-1">Revisa tu tour seleccionado antes de proceder al pago seguro.</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-[#062918]" />
          </div>

          {!cartItem ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-2xs my-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
                <ShoppingBag size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Aún no has seleccionado ninguna expedición. Explora nuestro catálogo de tours y elige tu próxima aventura en los Andes.
              </p>
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#062918] hover:bg-[#0a4026] text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Ver Catálogo de Tours
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Item Card (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs relative overflow-hidden flex flex-col md:flex-row gap-6 items-start">
                  
                  {/* Text details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="px-3 py-1 bg-[#062918]/10 text-[#062918] font-bold text-xs rounded-lg uppercase tracking-wider">
                        {cartItem.serviceType === 'shared' ? 'Servicio Compartido' : 'Servicio Privado'}
                      </span>
                      <button
                        onClick={handleClearCart}
                        title="Eliminar del carrito"
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-3">{cartItem.tourTitle}</h2>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#062918] shrink-0" />
                        <span className="capitalize">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[#062918] shrink-0" />
                        <span>{cartItem.pax} {cartItem.pax === 1 ? 'Viajero' : 'Viajeros'} (${cartItem.price} USD c/u)</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Subtotal tour</span>
                      <span className="text-xl font-bold text-[#062918]">${cartItem.total} USD</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Link
                    href="/tours"
                    className="text-sm font-medium text-gray-500 hover:text-[#062918] transition-colors underline"
                  >
                    ← Explorar más tours
                  </Link>
                  <button
                    onClick={handleClearCart}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>

              {/* Summary Checkout Box (1 col) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-fit space-y-6">
                <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Resumen del Carrito</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">${cartItem.total} USD</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cargos por gestión</span>
                    <span className="font-semibold text-emerald-600">GRATIS</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-gray-900">
                    <span>Total a pagar</span>
                    <span className="text-xl text-[#062918]">${cartItem.total} USD</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-4 bg-[#062918] hover:bg-[#0a4026] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  PROCEDER AL PAGO
                  <ArrowRight size={18} />
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Pago 100% Seguro con Izipay (PCI-DSS)</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
