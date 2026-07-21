'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Tour } from '@repo/db';
import { deleteTour } from '../../actions/tour';
import { Plus, Trash2, MapPin, Clock, Users } from 'lucide-react';

export function ToursClient({ initialTours }: { initialTours: Tour[] }) {
  const [tours, setTours] = useState(initialTours);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (confirm(`¿Está seguro de que desea eliminar el tour "${title}"? esta acción no se puede deshacer.`)) {
      setDeletingId(id);
      startTransition(async () => {
        const res = await deleteTour(id);
        if (res.success) {
          setTours(tours.filter(t => t.id !== id));
        } else {
          alert("Error al eliminar el tour.");
        }
        setDeletingId(null);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Tours</h1>
          <p className="text-sm text-slate-500 mt-1">Crea, edita y administra el catálogo de experiencias y paquetes.</p>
        </div>
        <Link
          href="/tours/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B4354] hover:bg-[#083340] text-white font-semibold text-xs rounded-xl shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Tour</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {tours.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="font-medium">No hay tours creados aún.</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Nuevo Tour" para agregar tu primera experiencia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Tour</th>
                  <th className="px-6 py-4">Región</th>
                  <th className="px-6 py-4">Duración</th>
                  <th className="px-6 py-4">Dificultad</th>
                  <th className="px-6 py-4">Servicios</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {tour.cardImage ? (
                          <img src={tour.cardImage} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                            No Img
                          </div>
                        )}
                        <div>
                          <div className="line-clamp-1">{tour.title}</div>
                          <div className="text-xs text-slate-400 font-mono">/{tour.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {tour.region || 'Cusco'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {tour.duration}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        {tour.difficulty || 'Moderado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {tour.hasSharedService && tour.hasPrivateService ? 'Compartido + Privado' : tour.hasSharedService ? 'Compartido' : 'Privado'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={isPending && deletingId === tour.id}
                        onClick={() => handleDelete(tour.id, tour.title)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Eliminar tour"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
