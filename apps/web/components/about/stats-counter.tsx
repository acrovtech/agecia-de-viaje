'use client';

import { useEffect, useRef, useState } from 'react';

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          
          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            setCount(Math.floor(easeProgress * end));
            
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(end);
            }
          };
          
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return { count, elementRef };
}

interface StatItemProps {
  end: number;
  label: string;
  suffix?: string;
}

function StatItem({ end, label, suffix = '' }: StatItemProps) {
  const { count, elementRef } = useCountUp(end);

  return (
    <div ref={elementRef} className="text-center p-6">
      <div className="text-5xl md:text-6xl font-bold font-heading text-brand-teal mb-2">
        {count}{suffix}
      </div>
      <p className="text-gray-600 font-medium text-lg uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function StatsCounter() {
  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <StatItem end={15} label="Años de Experiencia" suffix="+" />
          <StatItem end={5000} label="Viajeros Felices" suffix="+" />
          <StatItem end={50} label="Rutas Exclusivas" />
          <StatItem end={100} label="Satisfacción" suffix="%" />
        </div>
      </div>
    </section>
  );
}
