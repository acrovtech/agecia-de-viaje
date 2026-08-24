'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ScrollToTopOnNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    // Al cambiar de ruta o entrar a un tour/blog, asegurar que la vista empiece siempre desde arriba
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}
