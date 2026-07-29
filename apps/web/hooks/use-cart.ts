'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CartItem, 
  getStoredCartList,
  getStoredCart, 
  saveCart, 
  removeCartItemBySlug,
  clearCart, 
  getCartRemainingMinutes, 
  CART_UPDATED_EVENT 
} from '@/lib/cart-utils';

export function useCartManager() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(60);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const refreshCart = useCallback(() => {
    const storedList = getStoredCartList(); // auto-limpia si pasaron 60 minutos
    setCartItems(storedList);
    setRemainingMinutes(getCartRemainingMinutes(storedList));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refreshCart();

    const handleCartUpdate = () => refreshCart();

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    // Timer cada 15 segundos para actualizar el contador de minutos restantes y expirar a los 60 min
    const interval = setInterval(() => {
      refreshCart();
    }, 15000);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      clearInterval(interval);
    };
  }, [refreshCart]);

  const updateCart = useCallback((itemData: Omit<CartItem, 'createdAt'> & { createdAt?: number }) => {
    const newItem: CartItem = {
      ...itemData,
      createdAt: itemData.createdAt || Date.now(),
    };
    saveCart(newItem);
    refreshCart();
  }, [refreshCart]);

  const removeItemBySlug = useCallback((slug: string) => {
    removeCartItemBySlug(slug);
    refreshCart();
  }, [refreshCart]);

  const removeItem = useCallback(() => {
    clearCart();
    refreshCart();
  }, [refreshCart]);

  return {
    cartItems,
    cartItem: cartItems[0] || null,
    cartCount: cartItems.length,
    remainingMinutes,
    isLoaded,
    updateCart,
    removeItemBySlug,
    removeItem,
    refreshCart,
  };
}
