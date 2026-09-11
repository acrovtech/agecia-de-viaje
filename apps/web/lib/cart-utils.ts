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

export const CART_STORAGE_KEY = 'travel_agency_cart';
export const CART_OPEN_EVENT = 'travel_agency_cart_open';
export const CART_EXPIRATION_MS = 60 * 60 * 1000; // 60 minutos en ms

export const CART_UPDATED_EVENT = 'travel_agency_cart_updated';

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
    tourTitle: tourTitle || 'Tour Seleccionado',
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
 * Lee la lista completa de tours del carrito (soporta multi-tour) y auto-limpia expirados
 */
export function getStoredCartList(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const rawItems: CartItem[] = Array.isArray(parsed) ? parsed : [parsed];

    // Filtrar items no expirados (menos de 60 min)
    const validItems = rawItems.filter(item => {
      return item && item.createdAt && (Date.now() - item.createdAt <= CART_EXPIRATION_MS);
    });

    if (validItems.length !== rawItems.length) {
      if (validItems.length === 0) {
        clearCart();
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
        window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
      }
    }

    return validItems;
  } catch {
    clearCart();
    return [];
  }
}

/**
 * Retorna el primer item del carrito (compatibilidad con vistas single)
 */
export function getStoredCart(): CartItem | null {
  const items = getStoredCartList();
  return items[0] || null;
}

/**
 * Guarda o actualiza un item en la lista del carrito (multi-tour)
 */
export function saveCart(item: CartItem): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getStoredCartList();
    const itemWithTimestamp: CartItem = {
      ...item,
      createdAt: item.createdAt || Date.now(),
    };

    // Si ya existe el tour en la lista, actualizarlo; si no, agregarlo
    const index = existing.findIndex(i => i.tourSlug === item.tourSlug);
    let updatedList: CartItem[];

    if (index >= 0) {
      updatedList = [...existing];
      updatedList[index] = itemWithTimestamp;
    } else {
      updatedList = [...existing, itemWithTimestamp];
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  } catch (err) {
    console.error('Error guardando carrito:', err);
  }
}

/**
 * Elimina un tour específico del carrito por su tourSlug
 */
export function removeCartItemBySlug(slug: string): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getStoredCartList();
    const filtered = existing.filter(item => item.tourSlug !== slug);

    if (filtered.length === 0) {
      clearCart();
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
    }
  } catch (err) {
    console.error('Error eliminando item del carrito:', err);
  }
}

/**
 * Vacía completamente el carrito de localStorage
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
export function getCartRemainingMinutes(item: CartItem | null | CartItem[]): number {
  const items = Array.isArray(item) ? item : (item ? [item] : []);
  if (items.length === 0) return 0;

  // Tomar el timestamp del item más antiguo
  const oldestTime = Math.min(...items.map(i => i.createdAt || Date.now()));
  const elapsedMs = Date.now() - oldestTime;
  const remainingMs = CART_EXPIRATION_MS - elapsedMs;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (60 * 1000));
}
