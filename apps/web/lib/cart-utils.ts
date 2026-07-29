export type CartItem = {
  tourSlug: string;
  tourTitle: string;
  image?: string | null;
  date: string | null;
  pax: number;
  serviceType: string;
  price: number;
  totalPrice: number;
  createdAt: number; // timestamp Unix en ms
};

export const CART_STORAGE_KEY = 'incabound_cart';
export const CART_EXPIRATION_MS = 60 * 60 * 1000; // 60 minutos en ms

export const CART_UPDATED_EVENT = 'incabound_cart_updated';

/**
 * Parsea los query params de la URL y construye un CartItem normalizado
 */
export function parseCartItemFromParams(searchParams: URLSearchParams): CartItem | null {
  const tourTitle = searchParams.get('tourTitle');
  const tourSlug = searchParams.get('slug');
  const tourImage = searchParams.get('image');
  const dateStr = searchParams.get('date');
  const pax = searchParams.get('pax');
  const serviceType = searchParams.get('type') || 'shared';
  const price = searchParams.get('price');
  const total = searchParams.get('total');

  if (!tourTitle && !tourSlug) {
    return null;
  }

  const numPax = Math.max(1, parseInt(pax || '1', 10) || 1);
  const numPrice = parseFloat(price || '0') || 0;
  const numTotal = parseFloat(total || '0') || (numPax * numPrice);

  return {
    tourSlug: tourSlug || '',
    tourTitle: tourTitle || 'Tour Inca Bound',
    image: tourImage,
    date: dateStr,
    pax: numPax,
    serviceType: serviceType,
    price: numPrice,
    totalPrice: numTotal,
    createdAt: Date.now(),
  };
}

/**
 * Lee el carrito de localStorage y AUTO-LIMPIA items con más de 60 minutos de antigüedad
 */
export function getStoredCart(): CartItem | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;

    const item: CartItem = JSON.parse(raw);

    // Si no tiene timestamp createdAt (migración) o pasaron más de 60 min, auto-limpiar
    if (!item.createdAt || (Date.now() - item.createdAt > CART_EXPIRATION_MS)) {
      clearCart();
      return null;
    }

    return item;
  } catch {
    clearCart();
    return null;
  }
}

/**
 * Guarda o actualiza un item en el carrito agregando createdAt y notificando a la app
 */
export function saveCart(item: CartItem): void {
  if (typeof window === 'undefined') return;

  try {
    const itemWithTimestamp: CartItem = {
      ...item,
      createdAt: item.createdAt || Date.now(),
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itemWithTimestamp));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  } catch (err) {
    console.error('Error guardando carrito:', err);
  }
}

/**
 * Elimina el carrito de localStorage y emite el evento de actualización
 */
export function clearCart(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  } catch (err) {
    console.error('Error limpiando carrito:', err);
  }
}

/**
 * Calcula los minutos restantes antes de que el carrito expire (0 a 60 minutos)
 */
export function getCartRemainingMinutes(item: CartItem | null): number {
  if (!item || !item.createdAt) return 0;
  const elapsedMs = Date.now() - item.createdAt;
  const remainingMs = CART_EXPIRATION_MS - elapsedMs;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (60 * 1000));
}
