'use client';

import { useEffect, useRef } from 'react';
import { logoutAction } from '@/app/actions/auth';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export function InactivityTimer() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        // Auto-logout seguro por 30 minutos de inactividad
        logoutAction();
      }, THIRTY_MINUTES_MS);
    };

    // Eventos del usuario que reinician el temporizador de actividad
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, []);

  return null;
}
