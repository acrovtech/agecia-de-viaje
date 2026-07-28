'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TourCard } from '@/components/ui/tour-card';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

function FilterDropdown({ 
  title, 
  options, 
  selectedOption, 
  onChange 
}: { 
  title: string, 
  options: string[], 
  selectedOption: string | null,
  onChange: (opt: string | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useOnClickOutside(ref, () => setIsOpen(false));

  const hasSelection = selectedOption !== null;

  return (
    <div className="relative w-full md:w-auto" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-w-[180px] flex justify-between md:justify-center items-center gap-2 px-4 md:px-5 py-2.5 border rounded-xl text-xs md:text-sm font-medium transition-colors ${
          isOpen || hasSelection ? 'border-[#062918] text-[#062918] bg-gray-50' : 'border-gray-200 text-gray-700 hover:border-[#062918] hover:text-[#062918] bg-white shadow-sm'
        }`}
      >
        <span className="truncate">{hasSelection ? selectedOption : title}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
          <div className="flex flex-col">
            <button 
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                selectedOption === null ? 'font-bold text-[#062918] bg-gray-50/50' : 'text-gray-600'
              }`}
            >
              Todos
            </button>

            {options.map(opt => (
              <button 
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                  selectedOption === opt ? 'font-bold text-[#062918] bg-gray-50/50' : 'text-gray-600'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ToursCatalogClient() {
  const searchParams = useSearchParams();
  const queryDestino = searchParams.get('destino');
  const initialDestino = queryDestino ? queryDestino.charAt(0).toUpperCase() + queryDestino.slice(1).toLowerCase() : null;

  const [tours, setTours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDestino, setSelectedDestino] = useState<string | null>(initialDestino);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tours')
      .then(res => res.json())
      .then(data => {
        if (data.tours) setTours(data.tours);
        if (data.categories) setCategories(data.categories);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const clearFilters = () => {
    setSelectedDestino(null);
    setSelectedCategory(null);
    setSelectedDuration(null);
    setSelectedDifficulty(null);
  };

  // Opciones dinámicas extraídas del Admin (Base de datos)
  const rawRegions = tours.map(t => t.region).filter(Boolean);
  const destinoOptions = Array.from(new Set(['Cusco', ...rawRegions]));
  const categoryOptions = Array.from(new Set(categories.map(c => c.name).filter(Boolean)));
  const durationOptions = Array.from(new Set(tours.map(t => t.duration).filter(Boolean)));
  const rawDifficulties = tours.map(t => t.difficulty).filter(Boolean);
  const difficultyOptions = Array.from(new Set(['Fácil', 'Moderado', 'Desafiante', ...rawDifficulties]));

  // Lógica de filtrado case-insensitive conectada 100% a la BD
  const filteredTours = tours.filter(tour => {
    if (selectedDestino) {
      const tourRegion = (tour.region || '').trim().toLowerCase();
      const targetDestino = selectedDestino.trim().toLowerCase();
      if (tourRegion !== targetDestino) return false;
    }

    if (selectedDuration) {
      const tourDuration = (tour.duration || '').trim().toLowerCase();
      const targetDuration = selectedDuration.trim().toLowerCase();
      if (tourDuration !== targetDuration) return false;
    }

    if (selectedDifficulty) {
      const tourDifficulty = (tour.difficulty || '').trim().toLowerCase();
      const targetDifficulty = selectedDifficulty.trim().toLowerCase();
      if (tourDifficulty !== targetDifficulty) return false;
    }
    
    if (selectedCategory) {
      const tourCats = tour.categories || [];
      const tourCatNames = tourCats.map((c: any) => (c.name || c.category?.name || '').trim().toLowerCase());
      const targetCat = selectedCategory.trim().toLowerCase();
      if (!tourCatNames.includes(targetCat)) return false;
    }
    
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <div className="relative pt-20 w-full bg-gray-900 flex flex-col justify-end min-h-[50dvh] md:min-h-[60dvh] mb-8">
        <div className="absolute inset-0">
          <Image src="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/tours-peru-inca-bound.webp" alt="Tours en Perú" fill className="object-cover" priority unoptimized={true} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-black/30" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 pb-12 flex flex-col items-center md:items-start">
          <div className="max-w-4xl text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg leading-tight font-heading mb-4">
              Explora el Perú con IncaBound
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs md:text-sm text-white mb-4 font-medium">
              <Link href="/" className="hover:text-gray-200 transition-colors underline decoration-white/30 underline-offset-2">
                Inicio
              </Link>
              <span className="text-white/60">/</span>
              <span className="text-white font-semibold">Tours</span>
            </div>
            <p className="text-gray-300 text-base md:text-lg">
              Desde caminatas desafiantes en los Andes hasta tours culturales de un día. Encuentra tu próxima aventura.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 pb-16">
        <section className="container mx-auto px-4 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 md:p-4 rounded-2xl border border-gray-200 shadow-sm w-full">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-3 w-full md:w-auto">
              <span className="text-sm font-bold text-gray-900 text-center md:text-left w-full md:w-auto pb-3 md:pb-0 border-b border-gray-100 md:border-none">
                Filtrar por:
              </span>
              <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto">
                <FilterDropdown 
                  title="Destino" 
                  options={destinoOptions} 
                  selectedOption={selectedDestino}
                  onChange={setSelectedDestino}
                />
                {categoryOptions.length > 0 && (
                  <FilterDropdown 
                    title="Categoría" 
                    options={categoryOptions} 
                    selectedOption={selectedCategory}
                    onChange={setSelectedCategory}
                  />
                )}
                {durationOptions.length > 0 && (
                  <FilterDropdown 
                    title="Duración" 
                    options={durationOptions} 
                    selectedOption={selectedDuration}
                    onChange={setSelectedDuration}
                  />
                )}
                <FilterDropdown 
                  title="Dificultad" 
                  options={difficultyOptions} 
                  selectedOption={selectedDifficulty}
                  onChange={setSelectedDifficulty}
                />
              </div>
            </div>
            
            <button 
              onClick={clearFilters}
              className="text-sm font-medium text-gray-500 hover:text-[#062918] underline transition-colors whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="mb-6 text-center md:text-left">
            {loading ? (
              <p className="text-gray-500 text-sm font-medium animate-pulse">Cargando catálogo de tours...</p>
            ) : (
              <p className="text-gray-500 text-sm font-medium">Mostrando <span className="font-bold text-gray-900">{filteredTours.length}</span> tours disponibles</p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200/80 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTours.map((tour, index) => (
                <TourCard 
                  key={tour.id || index}
                  title={tour.title}
                  slug={tour.slug}
                  imageSrc={tour.cardImage || '/placeholder.jpg'}
                  duration={tour.duration}
                  difficulty={tour.difficulty}
                  altitude={tour.altitude || tour.maxAltitude}
                  groupSize={tour.groupSize}
                />
              ))}
              {filteredTours.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron tours</h3>
                  <p className="text-gray-500">Prueba ajustando los filtros para ver más resultados.</p>
                  <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-[#062918] text-white rounded-lg hover:bg-[#0a4026] transition-colors">Ver todos los tours</button>
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  );
}
