'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { Tour } from '@repo/db';
import { deleteTour, setToursFeaturedStatus, toggleTourFeaturedStatus } from '../../actions/tour';
import {
  Plus,
  Trash2,
  Edit,
  Map,
  MapPin,
  Search,
  Clock,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { FeaturedLimitModal } from '@/components/tours/featured-limit-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

function TourThumbnail({ src }: { src?: string; title?: string }) {
  const [hasError, setHasError] = useState(false);

  // Consider as valid only real uploads or external HTTP URLs
  const isValidImage = src && (src.startsWith('http') || src.startsWith('/uploads') || src.startsWith('data:image'));

  if (!isValidImage || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shrink-0 select-none shadow-2xs">
        <ImageIcon className="w-4.5 h-4.5 text-slate-400" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt="" 
      onError={() => setHasError(true)} 
      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" 
    />
  );
}

export function ToursClient({ initialTours }: { initialTours: Tour[] }) {
  const [tours, setTours] = useState(initialTours);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');
  const [filterDuration, setFilterDuration] = useState<string>('ALL');
  const [filterDestination, setFilterDestination] = useState<string>('ALL');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [targetTourForModal, setTargetTourForModal] = useState<Tour | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    id?: string;
    title?: string;
    count?: number;
  }>({ isOpen: false, type: 'bulk' });

  // Extraer valores únicos disponibles para filtros
  const availableDurations = useMemo(() => {
    const list = Array.from(
      new Set(tours.map((t) => t.duration?.trim()).filter(Boolean) as string[])
    );
    return list.sort();
  }, [tours]);

  const availableDestinations = useMemo(() => {
    const list = Array.from(
      new Set(tours.map((t) => t.region?.trim()).filter(Boolean) as string[])
    );
    return list.sort();
  }, [tours]);

  // Conteo de tours activos vs borradores
  const activeCount = useMemo(() => {
    return tours.filter((t) => (t as any).isActive !== false && (t as any).status !== 'DRAFT').length;
  }, [tours]);

  const draftCount = useMemo(() => {
    return tours.filter((t) => (t as any).isActive === false || (t as any).status === 'DRAFT').length;
  }, [tours]);

  // Conteo de recomendados
  const featuredCount = useMemo(() => {
    return tours.filter((t) => t.isFeatured).length;
  }, [tours]);

  // Filtrado reactivo de tours
  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      // Filtro especial: ver solo los recomendados en Home
      if (showOnlyFeatured && !tour.isFeatured) {
        return false;
      }

      // 1. Búsqueda por texto (Título, slug o región)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = tour.title.toLowerCase().includes(q);
        const matchSlug = tour.slug.toLowerCase().includes(q);
        const matchRegion = tour.region ? tour.region.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchSlug && !matchRegion) return false;
      }

      // 2. Filtro de Estado (Activo / Borrador)
      if (filterStatus === 'ACTIVE') {
        const isDraft = (tour as any).isActive === false || (tour as any).status === 'DRAFT';
        if (isDraft) return false;
      } else if (filterStatus === 'DRAFT') {
        const isDraft = (tour as any).isActive === false || (tour as any).status === 'DRAFT';
        if (!isDraft) return false;
      }

      // 3. Filtro de Duración
      if (filterDuration !== 'ALL' && tour.duration !== filterDuration) {
        return false;
      }

      // 4. Filtro de Destino (Región)
      if (filterDestination !== 'ALL' && tour.region !== filterDestination) {
        return false;
      }

      return true;
    });
  }, [tours, searchQuery, filterStatus, filterDuration, filterDestination, showOnlyFeatured]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterStatus !== 'ALL' ||
    filterDuration !== 'ALL' ||
    filterDestination !== 'ALL' ||
    showOnlyFeatured;

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setFilterDuration('ALL');
    setFilterDestination('ALL');
    setShowOnlyFeatured(false);
  };

  const promptDelete = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'single',
      id,
      title,
    });
  };

  const promptBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      type: 'bulk',
      count: selectedIds.length,
    });
  };

  const handleConfirmAction = () => {
    if (confirmModal.type === 'bulk') {
      startTransition(async () => {
        for (const id of selectedIds) {
          await deleteTour(id);
        }
        setTours((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
        setSelectedIds([]);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      });
    } else if (confirmModal.type === 'single' && confirmModal.id) {
      const id = confirmModal.id;
      setDeletingId(id);
      startTransition(async () => {
        const res = await deleteTour(id);
        if (res.success) {
          setTours((prev) => prev.filter((t) => t.id !== id));
          setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
        setDeletingId(null);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      });
    }
  };

  // Confirmar agregar tour a recomendados desde el modal de límite
  const handleConfirmAddFeatured = (idsToFeature: string[]) => {
    startTransition(async () => {
      const res = await setToursFeaturedStatus(idsToFeature, true);
      if (res.success) {
        setTours((prev) =>
          prev.map((t) => (idsToFeature.includes(t.id) ? { ...t, isFeatured: true } : t))
        );
        setIsFeaturedModalOpen(false);
        setTargetTourForModal(null);
      } else {
        alert(res.error || 'No se pudo actualizar los tours recomendados.');
      }
    });
  };

  // Liberar cupo rápido desde dentro del modal
  const handleQuickRemoveFeatured = (idToRemove: string) => {
    startTransition(async () => {
      const res = await toggleTourFeaturedStatus(idToRemove);
      if (res.success) {
        setTours((prev) =>
          prev.map((t) => (t.id === idToRemove ? { ...t, isFeatured: false } : t))
        );
      } else {
        alert(res.error || 'No se pudo quitar el tour recomendado.');
      }
    });
  };

  // Alternar directamente el estado de recomendado desde la columna dedicada
  const handleToggleFeatured = (id: string) => {
    const tour = tours.find((t) => t.id === id);
    if (!tour) return;

    if (tour.isFeatured) {
      // Quitar directamente
      startTransition(async () => {
        const res = await toggleTourFeaturedStatus(id);
        if (res.success) {
          setTours((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isFeatured: false } : t))
          );
        }
      });
    } else {
      // Validar si ya hay 6 tours recomendados en el Home
      if (featuredCount >= 6) {
        setTargetTourForModal(tour);
        setIsFeaturedModalOpen(true);
      } else {
        startTransition(async () => {
          const res = await toggleTourFeaturedStatus(id);
          if (res.success) {
            setTours((prev) =>
              prev.map((t) => (t.id === id ? { ...t, isFeatured: true } : t))
            );
          }
        });
      }
    }
  };

  const isAllSelected = filteredTours.length > 0 && filteredTours.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTours.map((t) => t.id));
    }
  };

  const toggleSelectTour = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedToursForModal = useMemo(() => {
    if (targetTourForModal) return [targetTourForModal];
    return [];
  }, [targetTourForModal]);

  return (
    <div className="space-y-4 font-sans select-none">
      
      {/* 1. Header Estilo Shopify Admin Products Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f]">Tours</h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Badge Interactivo Contador de Recomendados en Home (Máx 6) */}
          <button
            type="button"
            onClick={() => setShowOnlyFeatured((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
              showOnlyFeatured
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Hacer clic para filtrar y ver solo los tours recomendados en el Home"
          >
            <Sparkles className={`w-3.5 h-3.5 ${showOnlyFeatured ? 'text-white' : 'text-amber-500 fill-amber-500'}`} />
            <span>
              Recomendados Home: <strong className={showOnlyFeatured ? 'text-white font-bold' : 'text-amber-800 font-bold'}>{featuredCount}/6</strong>
            </span>
          </button>

          {/* Badge Outline Contador de Tours */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs">
            <Map className="h-3.5 w-3.5 text-slate-400" />
            <span>Total: <strong className="text-slate-900 font-semibold">{tours.length}</strong> tours</span>
          </div>

          <Link
            href="/tours/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar tour</span>
          </Link>
        </div>
      </div>

      {/* 2. Barra de Filtros Shopify Polaris (Búsqueda + Estado + Duración + Destino + Limpiar) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 flex flex-col md:flex-row items-center gap-2.5 text-xs">
        
        {/* Barra de Búsqueda Principal */}
        <div className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar tours por título, slug o destino..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Grupo de Filtros */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          {/* 1. Filtro de Estado (Todos los estados / Activo / Borrador) */}
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus((val as any) || 'ALL')}>
            <SelectTrigger className="h-8 w-[180px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
              <div className="flex items-center gap-1.5 truncate">
                {filterStatus === 'ALL' && (
                  <>
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Todos los estados</span>
                  </>
                )}
                {filterStatus === 'ACTIVE' && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700">Activo</span>
                  </>
                )}
                {filterStatus === 'DRAFT' && (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600">Borrador</span>
                  </>
                )}
              </div>
            </SelectTrigger>
            <SelectContent 
              alignItemWithTrigger={false} 
              align="start" 
              side="bottom" 
              sideOffset={6}
              className="w-[180px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
            >
              <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                <div className="flex items-center justify-between w-full">
                  <span>Todos los estados</span>
                  <span className="text-[11px] text-slate-400 font-normal">({tours.length})</span>
                </div>
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Activos</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">({activeCount})</span>
                </div>
              </SelectItem>
              <SelectItem value="DRAFT" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Borradores</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">({draftCount})</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* 2. Filtro de Duración (Ancho aumentado a w-[200px] para evitar '...') */}
          <Select value={filterDuration} onValueChange={(val) => setFilterDuration(val || 'ALL')}>
            <SelectTrigger className="h-8 w-[200px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {filterDuration === 'ALL' ? 'Todas las duraciones' : filterDuration}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent 
              alignItemWithTrigger={false} 
              align="start" 
              side="bottom" 
              sideOffset={6}
              className="w-[200px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 max-h-[260px]"
            >
              <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                <div className="flex items-center justify-between w-full">
                  <span>Todas las duraciones</span>
                  <span className="text-[11px] text-slate-400 font-normal">({tours.length})</span>
                </div>
              </SelectItem>
              {availableDurations.map((dur) => (
                <SelectItem key={dur} value={dur} className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span>{dur}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({tours.filter((t) => t.duration === dur).length})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 3. Filtro de Destino (Ancho aumentado a w-[190px] para evitar '...') */}
          <Select value={filterDestination} onValueChange={(val) => setFilterDestination(val || 'ALL')}>
            <SelectTrigger className="h-8 w-[190px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {filterDestination === 'ALL' ? 'Todos los destinos' : filterDestination}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent 
              alignItemWithTrigger={false} 
              align="start" 
              side="bottom" 
              sideOffset={6}
              className="w-[190px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 max-h-[260px]"
            >
              <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                <div className="flex items-center justify-between w-full">
                  <span>Todos los destinos</span>
                  <span className="text-[11px] text-slate-400 font-normal">({tours.length})</span>
                </div>
              </SelectItem>
              {availableDestinations.map((dest) => (
                <SelectItem key={dest} value={dest} className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span>{dest}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({tours.filter((t) => t.region === dest).length})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 4. Botón de Limpiar Filtros */}
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all shrink-0 shadow-2xs ${
              hasActiveFilters
                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 cursor-pointer'
                : 'text-slate-400 bg-slate-50/70 border-slate-200/80 cursor-not-allowed opacity-50'
            }`}
            title={hasActiveFilters ? 'Restablecer todos los filtros' : 'No hay filtros activos'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {filteredTours.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs space-y-2">
          <p className="font-semibold text-slate-600">No se encontraron tours con los filtros aplicados.</p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Agregar tour" para publicar tu primer tour.</p>
          )}
        </div>
      ) : (
        <>
          {/* VISTA DESKTOP: TABLA COMPLETA SHOPIFY POLARIS */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <colgroup>
                  <col className="w-12" />
                  <col className="w-auto" />
                  <col className="w-24" />
                  <col className="w-36" />
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-24" />
                </colgroup>
                <thead>
                  {selectedIds.length > 0 ? (
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 text-xs font-medium animate-in fade-in duration-150">
                      <th colSpan={7} className="px-4 py-2.5">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 pr-2 border-r border-slate-300/80">
                            <input 
                              type="checkbox" 
                              checked={isAllSelected}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                            />
                            <span className="font-semibold text-slate-900 text-xs">
                              {selectedIds.length} seleccionados
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={promptBulkDelete}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>{isPending ? 'Borrando...' : 'Borrar seleccionados'}</span>
                            </button>
                          </div>
                        </div>
                      </th>
                    </tr>
                  ) : (
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-3 w-8 text-center">
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Tour</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Recomendado</th>
                      <th className="px-4 py-3 text-center">Duración</th>
                      <th className="px-4 py-3 text-center">Destino</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredTours.map((tour) => {
                    const isSelected = selectedIds.includes(tour.id);
                    return (
                      <tr key={tour.id} className={`group/row transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectTour(tour.id)}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                          />
                        </td>
                      
                        {/* Producto: Imagen + Nombre */}
                        <td className="px-4 py-3 text-left font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <TourThumbnail src={tour.cardImage} title={tour.title} />
                            <div>
                              <Link href={`/tours/${tour.id}/edit`} className="font-bold text-slate-900 hover:underline line-clamp-1 text-xs">
                                {tour.title}
                              </Link>
                              <div className="text-[11px] text-slate-400 font-mono">/{tour.slug}</div>
                            </div>
                          </div>
                        </td>

                        {/* Estado: Badge Verde Activo / Gris Borrador */}
                        <td className="px-4 py-3 text-center">
                          {(tour as any).isActive === false || (tour as any).status === 'DRAFT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Borrador</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Activo</span>
                            </span>
                          )}
                        </td>

                        {/* Columna Recomendado en Home (1 Clic directo con validación de límite) */}
                        <td className="px-4 py-3 text-center">
                          {tour.isFeatured ? (
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(tour.id)}
                              title="Recomendado en el Home (Clic para quitar)"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              <span>Recomendado</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(tour.id)}
                              title="Hacer clic para marcar como recomendado en el Home (máx. 6)"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Recomendar</span>
                            </button>
                          )}
                        </td>

                        {/* Duración */}
                        <td className="px-4 py-3 text-center text-slate-600">
                          {tour.duration ? (
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {tour.duration}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">-</span>
                          )}
                        </td>

                        {/* Destino */}
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">
                          {tour.region ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {tour.region}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">-</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/tours/${tour.id}/edit`}
                              className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1"
                              title="Editar tour"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* VISTA MOBILE: CARDS INDEPENDIENTES CON FILTRO APLICADO */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredTours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col gap-3 hover:border-slate-300 transition-all">
                {/* Fila Top: Imagen + Título */}
                <div className="flex items-start gap-3">
                  <TourThumbnail src={tour.cardImage} title={tour.title} />
                  <div className="flex-1 min-w-0">
                    <Link href={`/tours/${tour.id}/edit`} className="font-bold text-slate-900 hover:underline text-sm leading-tight uppercase tracking-tight line-clamp-2">
                      {tour.title}
                    </Link>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">/{tour.slug}</div>
                  </div>
                </div>

                {/* Fila Detalle: Badge Activo, Botón Recomendado, Destino y Botón Editar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(tour as any).isActive === false || (tour as any).status === 'DRAFT' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Borrador</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Activo</span>
                      </span>
                    )}

                    {tour.isFeatured ? (
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(tour.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>Recomendado</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(tour.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-slate-400" />
                        <span>Recomendar</span>
                      </button>
                    )}

                    {tour.region && (
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-[100px]">
                        {tour.region}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/tours/${tour.id}/edit`}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1 shrink-0 ml-2 shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        isLoading={isPending}
        title={
          confirmModal.type === 'bulk'
            ? `¿Eliminar ${confirmModal.count || selectedIds.length} tours seleccionados?`
            : `¿Eliminar "${confirmModal.title}"?`
        }
        description="Esta acción es irreversible y eliminará permanentemente la información de los tours seleccionados."
        confirmText="Eliminar"
        variant="danger"
      />

      {/* Modal de límite y gestión de tours recomendados (máx 6) */}
      <FeaturedLimitModal
        isOpen={isFeaturedModalOpen}
        onClose={() => {
          setIsFeaturedModalOpen(false);
          setTargetTourForModal(null);
        }}
        selectedTours={selectedToursForModal}
        allTours={tours}
        onConfirmAdd={handleConfirmAddFeatured}
        onQuickRemoveFeatured={handleQuickRemoveFeatured}
        isPending={isPending}
      />
    </div>
  );
}
