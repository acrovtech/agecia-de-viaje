'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, CheckCircle2, XCircle, Info, ArrowRight } from 'lucide-react';

interface TourSummary {
  id: string;
  title: string;
  isFeatured: boolean;
}

interface FeaturedLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTours: TourSummary[];
  allTours: TourSummary[];
  onConfirmAdd: (idsToFeature: string[]) => void;
  onQuickRemoveFeatured: (idToRemove: string) => void;
  isPending?: boolean;
}

export function FeaturedLimitModal({
  isOpen,
  onClose,
  selectedTours,
  allTours,
  onConfirmAdd,
  onQuickRemoveFeatured,
  isPending = false,
}: FeaturedLimitModalProps) {
  const MAX_FEATURED = 6;

  // Tours recomendados actualmente en la BD
  const currentlyFeatured = allTours.filter((t) => t.isFeatured);
  const currentCount = currentlyFeatured.length;
  const availableSlots = Math.max(0, MAX_FEATURED - currentCount);

  // De los seleccionados, cuáles son nuevos para recomendar y cuáles ya lo están
  const toAdd = selectedTours.filter((t) => !t.isFeatured);
  const alreadyFeatured = selectedTours.filter((t) => t.isFeatured);

  const newTotal = currentCount + toAdd.length;
  const exceedsLimit = newTotal > MAX_FEATURED;
  const excess = newTotal - MAX_FEATURED;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 select-none max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start gap-3 text-left">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
              exceedsLimit
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}
          >
            {exceedsLimit ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1 flex-1">
            <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
              {exceedsLimit
                ? 'Límite de tours recomendados superado'
                : 'Agregar a Tours Recomendados'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              La sección del Home en la web muestra un máximo de{' '}
              <strong className="text-slate-700 font-semibold">{MAX_FEATURED} tours recomendados</strong>.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Barra de progreso de cupos */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Estado de cupos en el Home:</span>
            <span className="font-bold text-slate-900">
              {currentCount} de {MAX_FEATURED} ocupados
            </span>
          </div>

          {/* Gráfico de los 6 slots */}
          <div className="grid grid-cols-6 gap-1.5 h-2.5">
            {Array.from({ length: MAX_FEATURED }).map((_, idx) => {
              const isOccupied = idx < currentCount;
              const isProjected =
                !isOccupied && idx < currentCount + toAdd.length && !exceedsLimit;
              const isOver = !isOccupied && idx < currentCount + toAdd.length && exceedsLimit;

              let bgClass = 'bg-slate-200';
              if (isOccupied) bgClass = 'bg-amber-500';
              else if (isProjected) bgClass = 'bg-emerald-500';
              else if (isOver) bgClass = 'bg-rose-500';

              return (
                <div
                  key={idx}
                  className={`rounded-full transition-all ${bgClass}`}
                  title={`Slot ${idx + 1}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>
              Disponibles antes de seleccionar:{' '}
              <strong className="text-slate-800 font-semibold">{availableSlots}</strong>
            </span>
            {toAdd.length > 0 && (
              <span className={exceedsLimit ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                {exceedsLimit
                  ? `Excede por ${excess} ${excess === 1 ? 'tour' : 'tours'}`
                  : `Quedarán ${MAX_FEATURED - newTotal} disponibles`}
              </span>
            )}
          </div>
        </div>

        {/* Alerta si supera el límite */}
        {exceedsLimit ? (
          <div className="mt-3 space-y-3">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                Solo puedes tener {MAX_FEATURED} tours en el Home
              </p>
              <p>
                Actualmente ya tienes <strong>{currentCount} recomendados</strong>. Solo puedes
                seleccionar <strong>{availableSlots} {availableSlots === 1 ? 'restante' : 'restantes'}</strong>, pero seleccionaste{' '}
                <strong>{toAdd.length}</strong>.
              </p>
            </div>

            {/* Listado de los recomendados actuales para poder liberar un cupo rápido */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Tours recomendados actualmente en el Home (puedes liberar cupos):
              </span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white">
                {currentlyFeatured.map((tour) => (
                  <div
                    key={tour.id}
                    className="p-2.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate font-medium text-slate-800">{tour.title}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onQuickRemoveFeatured(tour.id)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md px-2 py-0.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      Liberar cupo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <span className="text-xs font-semibold text-slate-700">
              Tours que se agregarán a Recomendados ({toAdd.length}):
            </span>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-44 overflow-y-auto bg-white">
              {toAdd.map((tour) => (
                <div key={tour.id} className="p-2.5 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{tour.title}</span>
                </div>
              ))}
              {toAdd.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Todos los tours seleccionados ya están recomendados en el Home.
                </div>
              )}
            </div>

            {alreadyFeatured.length > 0 && (
              <p className="text-[11px] text-slate-400 italic">
                * {alreadyFeatured.length} de los tours seleccionados ya estaban previamente recomendados.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 bg-transparent p-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="text-xs font-semibold h-8 rounded-lg px-3 cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={exceedsLimit || toAdd.length === 0 || isPending}
            onClick={() => onConfirmAdd(toAdd.map((t) => t.id))}
            className="text-xs font-semibold h-8 rounded-lg px-3.5 bg-[#008060] hover:bg-[#006e52] text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-[#006e52]"
          >
            {isPending ? (
              'Guardando...'
            ) : exceedsLimit ? (
              `Supera el límite (${excess} de más)`
            ) : (
              `Confirmar recomendados (${toAdd.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
