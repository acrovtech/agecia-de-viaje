'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Tour } from '@repo/db';
import { deleteTour } from '../../actions/tour';
import { Plus, Trash2, Edit, Map, MapPin, Search, Clock, Image as ImageIcon } from 'lucide-react';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (confirm(`¿Está seguro de que desea eliminar el tour "${title}"? Esta acción no se puede deshacer.`)) {
      setDeletingId(id);
      startTransition(async () => {
        const res = await deleteTour(id);
        if (res.success) {
          setTours(tours.filter(t => t.id !== id));
          setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
          alert("Error al eliminar el tour.");
        }
        setDeletingId(null);
      });
    }
  };

  const filteredTours = tours.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const isAllSelected = filteredTours.length > 0 && filteredTours.every(t => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTours.map(t => t.id));
    }
  };

  const toggleSelectTour = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Deseas eliminar los ${selectedIds.length} tours seleccionados? Esta acción no se puede deshacer.`)) {
      startTransition(async () => {
        for (const id of selectedIds) {
          await deleteTour(id);
        }
        setTours(prev => prev.filter(t => !selectedIds.includes(t.id)));
        setSelectedIds([]);
      });
    }
  };

  const handleBulkActivate = () => {
    if (selectedIds.length === 0) return;
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4 font-sans select-none">
      
      {/* 1. Header Estilo Shopify Admin Products Page */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f]">Tours</h1>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/tours/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar tour</span>
          </Link>
        </div>
      </div>

      {/* Barra de Búsqueda Principal */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 flex items-center text-xs">
        <div className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar tours..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {filteredTours.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs">
          <p className="font-semibold text-slate-600">No hay tours registrados aún.</p>
          <p className="text-xs text-slate-400 mt-1">Haz clic en "Agregar tour" para publicar tu primer tour.</p>
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
                  <col className="w-28" />
                  <col className="w-32" />
                  <col className="w-36" />
                  <col className="w-28" />
                </colgroup>
                <thead>
                  {selectedIds.length > 0 ? (
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 text-xs font-medium animate-in fade-in duration-150">
                      <th colSpan={6} className="px-4 py-2.5">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 pr-2 border-r border-slate-300/80">
                            <input 
                              type="checkbox" 
                              checked={isAllSelected}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                            />
                            <span className="font-semibold text-slate-900 text-xs">
                              {selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleBulkActivate}
                              className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                            >
                              Establecer como activo
                            </button>
                            <button
                              type="button"
                              onClick={handleBulkDelete}
                              disabled={isPending}
                              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                            >
                              {isPending ? 'Borrando...' : 'Borrar todos'}
                            </button>
                          </div>
                        </div>
                      </th>
                    </tr>
                  ) : (
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-3 w-8">
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                        />
                      </th>
                      <th className="px-4 py-3">Tour</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Duración</th>
                      <th className="px-4 py-3">Destino</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredTours.map((tour) => {
                    const isSelected = selectedIds.includes(tour.id);
                    return (
                      <tr key={tour.id} className={`transition-colors ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectTour(tour.id)}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                          />
                        </td>
                      
                      {/* Producto: Imagen + Nombre */}
                      <td className="px-4 py-3 font-semibold text-slate-900">
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

                      {/* Estado: Badge Verde Activo */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Activo
                        </span>
                      </td>

                      {/* Duración */}
                      <td className="px-4 py-3 text-slate-600">
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
                      <td className="px-4 py-3 font-semibold text-slate-900">
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
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

          {/* VISTA MOBILE: CARDS INDEPENDIENTES SOLO CON BADGE ACTIVO */}
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

                {/* Fila Detalle: Únicamente Badge Activo y Botón Editar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Activo
                  </span>

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

    </div>
  );
}
