'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  CheckCircle2,
  ArrowRight,
  Clock,
  Search,
  ChevronDown,
  RotateCcw,
  SquarePen,
  Image as ImageIcon,
} from 'lucide-react';
import { PageHeader } from '../../design-system/page-header';
import { StatusBadge } from '../../design-system/status-badge';
import { CatalogEditor } from '../catalog-editor';
import type { CatalogDetail } from '../../../lib/catalog-editor';

export interface CatalogItem {
  id: string;
  title: string;
  slug: string;
  hasSharedService: boolean;
  sharedPrice: number | null;
  isActive?: boolean;
  isPublished: boolean;
  cardImage?: string | null;
  bannerImage?: string | null;
  duration?: string | null;
  region?: string | null;
}

export interface CatalogViewProps {
  kind: 'tours' | 'transfers';
  canEdit: boolean;
  editing: boolean;
  record?: CatalogDetail;
  editId?: string;
  catalog?: {
    data: CatalogItem[];
    nextCursor: string | null;
  };
  saved?: boolean;
  errorMessage?: string;
  agencySlug: string;
}

export function CatalogView({
  kind,
  canEdit,
  editing,
  record,
  editId,
  catalog,
  saved,
  errorMessage,
  agencySlug,
}: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');
  const [filterDuration, setFilterDuration] = useState('ALL');
  const [filterDestination, setFilterDestination] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<'status' | 'duration' | 'destination' | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseRoute = kind === 'tours' ? '/catalog/tours' : '/catalog/transfers';
  const isNew = editId === 'new';

  const totalCount = catalog ? catalog.data.length : 0;

  const activeCount = useMemo(() => {
    if (!catalog) return 0;
    return catalog.data.filter((t) => t.isPublished).length;
  }, [catalog]);

  const draftCount = useMemo(() => {
    if (!catalog) return 0;
    return catalog.data.filter((t) => !t.isPublished).length;
  }, [catalog]);

  const durationCounts = useMemo(() => {
    if (!catalog) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const t of catalog.data) {
      const d = t.duration?.trim();
      if (d) {
        counts.set(d, (counts.get(d) ?? 0) + 1);
      }
    }
    return counts;
  }, [catalog]);

  const destinationCounts = useMemo(() => {
    if (!catalog) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const t of catalog.data) {
      const r = t.region?.trim();
      if (r) {
        counts.set(r, (counts.get(r) ?? 0) + 1);
      }
    }
    return counts;
  }, [catalog]);

  const availableDurations = useMemo(() => {
    if (!catalog) return [];
    const list = Array.from(
      new Set(catalog.data.map((t) => t.duration?.trim()).filter(Boolean) as string[])
    );
    return list.sort();
  }, [catalog]);

  const availableDestinations = useMemo(() => {
    if (!catalog) return [];
    const list = Array.from(
      new Set(catalog.data.map((t) => t.region?.trim()).filter(Boolean) as string[])
    );
    return list.sort();
  }, [catalog]);

  const filteredTours = useMemo(() => {
    if (!catalog) return [];
    return catalog.data.filter((tour) => {
      // 1. Search text (Title, slug or destination/region)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = tour.title.toLowerCase().includes(q);
        const matchSlug = tour.slug.toLowerCase().includes(q);
        const matchRegion = tour.region ? tour.region.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchSlug && !matchRegion) return false;
      }

      // 2. Filter Status
      if (filterStatus === 'ACTIVE') {
        if (!tour.isPublished) return false;
      } else if (filterStatus === 'DRAFT') {
        if (tour.isPublished) return false;
      }

      // 3. Filter Duration
      if (filterDuration !== 'ALL' && tour.duration !== filterDuration) {
        return false;
      }

      // 4. Filter Destination
      if (filterDestination !== 'ALL' && tour.region !== filterDestination) {
        return false;
      }

      return true;
    });
  }, [catalog, searchQuery, filterStatus, filterDuration, filterDestination]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterStatus !== 'ALL' ||
    filterDuration !== 'ALL' ||
    filterDestination !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setFilterDuration('ALL');
    setFilterDestination('ALL');
    setOpenDropdown(null);
  };

  const isAllSelected =
    filteredTours.length > 0 && selectedIds.length === filteredTours.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTours.map((item) => item.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  if (editing && canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={isNew ? (kind === 'tours' ? 'Crear Tour' : 'Crear Traslado') : `Editar: ${record?.title ?? ''}`}
          description={
            isNew
              ? 'Registra un nuevo servicio en el catálogo comercial de tu agencia.'
              : 'Modifica la información básica, descripciones y precios.'
          }
          actions={
            <Link
              href={baseRoute}
              className="product-button-secondary text-xs"
            >
              Cancelar
            </Link>
          }
        />

        <div className="product-card-surface p-6">
          {errorMessage ? (
            <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
              {errorMessage}
            </p>
          ) : (
            <CatalogEditor
              kind={kind}
              record={record}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={kind === 'tours' ? 'Tours' : 'Traslados'}
        description={
          kind === 'tours'
            ? undefined
            : 'Servicios de transporte y traslados privados o compartidos.'
        }
        actions={
          canEdit && (
            <Link
              href={`${baseRoute}?edit=new`}
              className="product-button-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Crear {kind === 'tours' ? 'tour' : 'traslado'}</span>
            </Link>
          )
        }
      />

      {saved && (
        <div
          role="status"
          className="p-3 rounded-lg bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span>Servicio guardado con éxito.</span>
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
          {errorMessage}
        </p>
      )}

      {kind === 'tours' && catalog && (
        <div
          ref={dropdownRef}
          className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 flex flex-col md:flex-row items-center gap-2.5 text-xs"
        >
          {/* Barra de Búsqueda Principal */}
          <div className="w-full md:flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tours por título, slug o destino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#f9fafb] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Grupo de Filtros */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* 1. Filtro de Estado */}
            <div className="relative w-[170px]">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === 'status' ? null : 'status'))}
                className="h-9 w-full px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer select-none"
              >
                <span className="truncate">
                  {filterStatus === 'ALL'
                    ? 'Todos los estados'
                    : filterStatus === 'ACTIVE'
                    ? 'Activos'
                    : 'Borradores'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                    openDropdown === 'status' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'status' && (
                <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus('ALL');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                      filterStatus === 'ALL'
                        ? 'bg-[#f1f5f9] font-bold text-slate-900'
                        : 'font-medium text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Todos los estados</span>
                    <span className="text-slate-400 font-normal text-[11px]">({totalCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus('ACTIVE');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                      filterStatus === 'ACTIVE'
                        ? 'bg-[#f1f5f9] font-bold text-slate-900'
                        : 'font-medium text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Activos</span>
                    <span className="text-slate-400 font-normal text-[11px]">({activeCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus('DRAFT');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                      filterStatus === 'DRAFT'
                        ? 'bg-[#f1f5f9] font-bold text-slate-900'
                        : 'font-medium text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Borradores</span>
                    <span className="text-slate-400 font-normal text-[11px]">({draftCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Filtro de Duración */}
            <div className="relative w-[190px]">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === 'duration' ? null : 'duration'))}
                className="h-9 w-full px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer select-none"
              >
                <span className="truncate">
                  {filterDuration === 'ALL' ? 'Todas las duraciones' : filterDuration}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                    openDropdown === 'duration' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'duration' && (
                <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 z-50 max-h-[260px] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDuration('ALL');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                      filterDuration === 'ALL'
                        ? 'bg-[#f1f5f9] font-bold text-slate-900'
                        : 'font-medium text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Todas las duraciones</span>
                    <span className="text-slate-400 font-normal text-[11px]">({totalCount})</span>
                  </button>
                  {availableDurations.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        setFilterDuration(dur);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                        filterDuration === dur
                          ? 'bg-[#f1f5f9] font-bold text-slate-900'
                          : 'font-medium text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{dur}</span>
                      <span className="text-slate-400 font-normal text-[11px] shrink-0 ml-2">
                        ({durationCounts.get(dur) ?? 0})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Filtro de Destino */}
            <div className="relative w-[180px]">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === 'destination' ? null : 'destination'))}
                className="h-9 w-full px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer select-none"
              >
                <span className="truncate">
                  {filterDestination === 'ALL' ? 'Todos los destinos' : filterDestination}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
                    openDropdown === 'destination' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'destination' && (
                <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 z-50 max-h-[260px] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDestination('ALL');
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                      filterDestination === 'ALL'
                        ? 'bg-[#f1f5f9] font-bold text-slate-900'
                        : 'font-medium text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Todos los destinos</span>
                    <span className="text-slate-400 font-normal text-[11px]">({totalCount})</span>
                  </button>
                  {availableDestinations.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => {
                        setFilterDestination(dest);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                        filterDestination === dest
                          ? 'bg-[#f1f5f9] font-bold text-slate-900'
                          : 'font-medium text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{dest}</span>
                      <span className="text-slate-400 font-normal text-[11px] shrink-0 ml-2">
                        ({destinationCounts.get(dest) ?? 0})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Botón Limpiar */}
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all shrink-0 shadow-2xs ${
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
      )}

      {catalog && (
        <div className="product-card-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              {kind === 'tours' && (
                <colgroup>
                  <col className="w-12" />
                  <col className="w-auto" />
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-32" />
                  <col className="w-32" />
                </colgroup>
              )}
              <thead>
                {kind === 'tours' ? (
                  <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[11px] font-semibold">
                    <th className="w-12 py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleAll}
                        aria-label="Seleccionar todos los tours"
                        className="w-4 h-4 rounded border-[#d1d5db] text-[#111111] accent-[#111111] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">TOUR</th>
                    <th className="py-3 px-4 text-center">ESTADO</th>
                    <th className="py-3 px-4 text-center">DURACIÓN</th>
                    <th className="py-3 px-4 text-center">DESTINO</th>
                    <th className="py-3 pr-6 pl-4 text-right">ACCIONES</th>
                  </tr>
                ) : (
                  <tr className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4 font-medium">Servicio</th>
                    <th className="py-2.5 px-4 font-medium">Modalidad</th>
                    <th className="py-2.5 px-4 font-medium">Tarifa Compartida</th>
                    <th className="py-2.5 px-4 font-medium">Estado</th>
                    <th className="py-2.5 px-4 font-medium">Operatividad</th>
                    <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {kind === 'tours'
                  ? filteredTours.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`product-data-row ${isSelected ? 'bg-[#f9fafb]' : ''}`}
                        >
                          <td className="w-12 py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItem(item.id)}
                              aria-label={`Seleccionar tour ${item.title}`}
                              className="w-4 h-4 rounded border-[#d1d5db] text-[#111111] accent-[#111111] cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#f3f4f6] border border-[#e5e7eb] shrink-0 flex items-center justify-center">
                                {item.cardImage || item.bannerImage ? (
                                  <img
                                    src={item.cardImage || item.bannerImage || ''}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-[#9ca3af]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#111111] text-xs uppercase tracking-tight truncate max-w-xs sm:max-w-md">
                                  {item.title}
                                </div>
                                <div className="text-[11px] text-[#6b7280] font-mono">/{item.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.isPublished ? (
                              <span className="text-[#16a34a] font-semibold text-xs">Activo</span>
                            ) : (
                              <span className="text-[#9ca3af] font-semibold text-xs">Borrador</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-[#374151]">
                            {item.duration ? (
                              <span className="inline-flex items-center justify-center gap-1.5 font-medium text-xs text-[#374151]">
                                <Clock className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                                <span>{item.duration}</span>
                              </span>
                            ) : (
                              <span className="text-[#9ca3af]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-[#374151]">
                            {item.region ? (
                              <span className="text-xs font-medium text-[#374151]">{item.region}</span>
                            ) : (
                              <span className="text-[#9ca3af]">-</span>
                            )}
                          </td>
                          <td className="py-3 pr-6 pl-4 text-right">
                            {canEdit && (
                              <div className="flex justify-end">
                                <Link
                                  href={`${baseRoute}?edit=${encodeURIComponent(item.id)}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#374151] bg-white border border-[#e5e7eb] hover:bg-[#f8f9fa] rounded-md transition-colors shadow-2xs"
                                >
                                  <SquarePen className="w-3.5 h-3.5 text-[#6b7280]" />
                                  <span>Editar</span>
                                </Link>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  : catalog.data.map((item) => (
                      <tr key={item.id} className="product-data-row">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111111] text-sm">{item.title}</div>
                          <div className="text-[11px] text-[#6b7280] font-mono">/{item.slug}</div>
                        </td>
                        <td className="py-3 px-4 text-[#374151]">
                          {item.hasSharedService ? 'Compartido' : 'Solo privado'}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#111111]">
                          {item.hasSharedService && item.sharedPrice !== null
                            ? new Intl.NumberFormat('es-PE', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(item.sharedPrice)
                            : 'Por cotizar'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={item.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {canEdit && (
                            <>
                              <Link
                                href={`${baseRoute}?edit=${encodeURIComponent(item.id)}`}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#111111] bg-white border border-[#e5e7eb] shadow-product-card hover:bg-[#f8f9fa] rounded-md transition-colors"
                              >
                                Editar
                              </Link>
                              <Link
                                href={`/content?kind=${kind}&id=${encodeURIComponent(item.id)}`}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#6b7280] hover:text-[#111111] hover:underline underline-offset-2 transition-colors"
                              >
                                Contenido
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                {((kind === 'tours' && filteredTours.length === 0) ||
                  (kind !== 'tours' && catalog.data.length === 0)) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-[#898989]"
                    >
                      {kind === 'tours'
                        ? hasActiveFilters
                          ? 'No se encontraron tours con los filtros aplicados'
                          : 'No hay tours registrados en el catálogo'
                        : 'No hay traslados registrados en el catálogo'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {catalog.nextCursor && (
            <div className="p-3 border-t border-[#e5e7eb] flex justify-end bg-[#f8f9fa]">
              <Link
                href={`${baseRoute}?after=${encodeURIComponent(catalog.nextCursor)}`}
                className="product-button-secondary text-xs"
              >
                <span>Página siguiente</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
