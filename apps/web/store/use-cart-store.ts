import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  tourSlug: string;
  tourTitle: string;
  tourImage?: string;
  date: string;
  endDate?: string;
  pax: number;
  serviceType: 'shared' | 'private';
  unitPrice: number;
  totalPrice: number;
  privatePriceStr?: string;
  duration?: string;
  addedAt: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (itemData) => {
        const newItem: CartItem = {
          ...itemData,
          id: `${itemData.tourSlug}_${itemData.date}_${itemData.serviceType}_${Date.now()}`,
          addedAt: Date.now(),
        };

        set((state) => {
          // Si ya existe exactamente el mismo tour en la misma fecha y servicio, sumamos pax
          const existingIndex = state.items.findIndex(
            (it) =>
              it.tourSlug === itemData.tourSlug &&
              it.date === itemData.date &&
              it.serviceType === itemData.serviceType
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const existing = updatedItems[existingIndex]!;
            const newPax = existing.pax + itemData.pax;
            updatedItems[existingIndex] = {
              ...existing,
              pax: newPax,
              totalPrice: existing.unitPrice * newPax,
            };
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((it) => it.id !== id),
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((it) => {
            if (it.id === id) {
              const updated = { ...it, ...updates };
              if (updates.pax !== undefined || updates.unitPrice !== undefined) {
                updated.totalPrice = (updated.unitPrice ?? it.unitPrice) * (updated.pax ?? it.pax);
              }
              return updated;
            }
            return it;
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getItemCount: () => {
        return get().items.reduce((acc, it) => acc + (it.pax || 1), 0);
      },

      getGrandTotal: () => {
        return get().items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      },
    }),
    {
      name: 'incabound_cart_v2',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
