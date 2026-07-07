'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TourCard } from '@/components/ui/tour-card';
import Image from 'next/image';
import { useState, useRef, useEffect, Suspense } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Custom hook para click outside
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

// Subcomponente de Filtro Dropdown
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
            {/* Opción para deseleccionar / Todos */}
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

function ToursCatalogContent() {
  const searchParams = useSearchParams();
  const queryDestino = searchParams.get('destino');
  const initialDestino = queryDestino ? queryDestino.charAt(0).toUpperCase() + queryDestino.slice(1).toLowerCase() : null;

  const [tours, setTours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States (Single Selection)
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

  // Compute available filter options from data
  const destinoOptions = ['Cusco', 'Lima', 'Ica', 'Arequipa', 'Puno', 'Madre de Dios'];
  const categoryOptions = categories.map(c => c.name);
  const durationOptions = Array.from(new Set(tours.map(t => t.duration).filter(Boolean)));
  const difficultyOptions = ['Fácil', 'Moderado', 'Desafiante'];

  // Apply filters (Single Selection Logic)
  const filteredTours = tours.filter(tour => {
    if (selectedDestino && tour.region !== selectedDestino.toUpperCase()) return false;
    if (selectedDuration && tour.duration !== selectedDuration) return false;
    if (selectedDifficulty && tour.difficulty !== selectedDifficulty) return false;
    
    if (selectedCategory) {
      const tourCatNames = tour.categories?.map((c: any) => c.category?.name) || [];
      if (!tourCatNames.includes(selectedCategory)) return false;
    }
    
    return true;
  });
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section del Catálogo */}
      <div className="relative pt-20 w-full bg-gray-900 flex flex-col justify-end min-h-[80dvh] mb-8">
        <div className="absolute inset-0">
          <Image src="/tours-peru-inca-bound.jpg" alt="Tours en Perú" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-black/30" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10 pb-16 flex flex-col items-center md:items-start">
          <div className="max-w-4xl text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg leading-tight font-heading mb-4">
              Explora el Perú con IncaBound
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs md:text-sm text-white mb-6 font-medium">
              <span className="hover:text-gray-200 cursor-pointer transition-colors">Inicio</span>
              <span className="text-white/60">/</span>
              <span>Tours</span>
            </div>
            <p className="text-gray-300 text-base md:text-lg">
              Desde caminatas desafiantes en los Andes hasta tours culturales de un día. Encuentra tu próxima aventura.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 pb-16">
        
        {/* Layout Principal (Barra de filtros superior + Grilla completa) */}
        <section className="container mx-auto px-4 lg:px-8">
          
          {/* Barra de Filtros Superior */}
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
                <FilterDropdown 
                  title="Categoría" 
                  options={categoryOptions} 
                  selectedOption={selectedCategory}
                  onChange={setSelectedCategory}
                />
                <FilterDropdown 
                  title="Duración" 
                  options={durationOptions} 
                  selectedOption={selectedDuration}
                  onChange={setSelectedDuration}
                />
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

          {/* Contador de resultados */}
          <div className="mb-6 text-center md:text-left">
            {loading ? (
              <p className="text-gray-500 text-sm font-medium animate-pulse">Cargando tours...</p>
            ) : (
              <p className="text-gray-500 text-sm font-medium">Mostrando <span className="font-bold text-gray-900">{filteredTours.length}</span> tours disponibles</p>
            )}
          </div>

          {/* Grilla de Resultados (100% width) */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-[#2dd4bf] border-t-transparent rounded-full animate-spin"></div>
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
                  altitude={tour.maxAltitude}
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

          {/* Paginación simple */}
          <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium" disabled>Anterior</button>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center border border-[#062918] bg-[#062918] text-white rounded-lg font-bold shadow-sm">1</button>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 bg-white text-gray-700 rounded-lg hover:border-[#062918] transition-colors font-medium">2</button>
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-[#062918] transition-colors font-medium">Siguiente</button>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function ToursCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>}>
      <ToursCatalogContent />
    </Suspense>
  );
}
