'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Clock, 
  Users, 
  Briefcase, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { deleteTransfer, toggleTransferStatus } from '../../actions/transporte';

interface TransferItem {
  id: string;
  title: string;
  slug: string;
  origin: string;
  destination: string;
  duration: string;
  tripType: string;
  hasSharedService: boolean;
  sharedPrice: number | null;
  hasPrivateService: boolean;
  isActive: boolean;
  order: number;
  vehiclePrices: {
    id: string;
    vehicleId: string;
    price: number;
    vehicle: {
      name: string;
      code: string;
      maxPax: number;
      maxLuggage: number;
      image: string;
    };
  }[];
}

export function TransporteClient({ initialTransfers }: { initialTransfers: TransferItem[] }) {
  const [transfers, setTransfers] = useState(initialTransfers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (confirm(`¿Está seguro de eliminar la ruta "${title}"?`)) {
      startTransition(async () => {
        const res = await deleteTransfer(id);
        if (res.success) {
          setTransfers((prev) => prev.filter((t) => t.id !== id));
        } else {
          alert('Error al eliminar el traslado: ' + (res.error || ''));
        }
      });
    }
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleTransferStatus(id, currentStatus);
      if (res.success) {
        setTransfers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: !currentStatus } : t))
        );
      }
    });
  };

  const filteredTransfers = transfers.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans select-none">
      
      {/* 1. Header estilo Polaris */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f]">
            Transportes & Traslados
          </h1>
          <span className="text-xs text-slate-500 font-medium">({transfers.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/transporte/vehiculos"
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-[#2f2f2f] font-medium text-[13px] flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Gestionar Flota</span>
          </Link>

          <Link
            href="/transporte/new"
            className="px-3.5 py-1.5 rounded-lg bg-[#008060] hover:bg-[#006e52] text-white font-medium text-[13px] shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Ruta</span>
          </Link>
        </div>
      </div>

      {/* 2. Barra de búsqueda y Filtros */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por origen, destino o nombre de ruta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <a
          href={typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? 'https://incabound.com/transporte' : (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/transporte` : 'http://localhost:3000/transporte')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
        >
          <span>Ver en la web pública</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 3. Tabla / Listado de Rutas */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredTransfers.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Car className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">No se encontraron rutas de traslado</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crea tu primera ruta de transporte indicando el origen, destino y los precios por vehículo.
            </p>
            <Link
              href="/transporte/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#008060] text-white font-medium text-xs shadow-xs hover:bg-[#006e52] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Ruta de Traslado</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f7f7f7] border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-4">Ruta / Trayecto</th>
                  <th className="py-2.5 px-4">Duración</th>
                  <th className="py-2.5 px-4">Servicio Privado</th>
                  <th className="py-2.5 px-4">Servicio Compartido</th>
                  <th className="py-2.5 px-4 text-center">Estado</th>
                  <th className="py-2.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.map((transfer) => {
                  const lowestPrivatePrice = transfer.vehiclePrices.length > 0
                    ? Math.min(...transfer.vehiclePrices.map((vp) => vp.price))
                    : null;

                  return (
                    <tr key={transfer.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ruta */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/transporte/${transfer.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 block text-xs"
                        >
                          {transfer.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="text-emerald-700 font-medium">{transfer.origin}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-700 font-medium">{transfer.destination}</span>
                        </div>
                      </td>

                      {/* Duración */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{transfer.duration}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{transfer.tripType}</span>
                      </td>

                      {/* Privado */}
                      <td className="py-3 px-4">
                        {transfer.hasPrivateService ? (
                          <div>
                            <span className="font-bold text-slate-900 text-xs">
                              Desde ${lowestPrivatePrice} USD
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {transfer.vehiclePrices.length} vehículos config.
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No disponible</span>
                        )}
                      </td>

                      {/* Compartido */}
                      <td className="py-3 px-4">
                        {transfer.hasSharedService && transfer.sharedPrice ? (
                          <div className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md w-fit border border-emerald-200/60">
                            <span>${transfer.sharedPrice} USD</span>
                            <span className="text-[10px] text-emerald-600 font-normal">/ pax</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No disponible</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(transfer.id, transfer.isActive)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-colors ${
                            transfer.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {transfer.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Borrador</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/transporte/${transfer.id}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Editar ruta"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(transfer.id, transfer.title)}
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar ruta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
