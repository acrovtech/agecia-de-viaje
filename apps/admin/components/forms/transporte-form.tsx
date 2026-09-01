'use client';

import { useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Car, 
  ArrowRight, 
  Loader2, 
  Save, 
  Trash2, 
  AlertCircle, 
  ChevronLeft, 
  Users, 
  Briefcase, 
  Check, 
  Clock, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';
import { createTransfer, updateTransfer, deleteTransfer } from '../../app/actions/transporte';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { SubmitSaveButton } from './shared/form-utils';

export interface VehicleTypeItem {
  id: string;
  code: string;
  name: string;
  subtitle?: string | null;
  maxPax: number;
  maxLuggage: number;
  image: string;
  features: string[];
}

export interface TransferFormProps {
  vehicles: VehicleTypeItem[];
  initialData?: any;
}

export function TransporteForm({ vehicles, initialData }: TransferFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [title, setTitle] = useState(
    initialData?.title || (origin && destination ? `${origin} a ${destination}` : '')
  );
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [duration, setDuration] = useState(initialData?.duration || '20-30 min');
  const [tripType, setTripType] = useState(initialData?.tripType || 'Solo ida');
  const [description, setDescription] = useState(initialData?.description || '');
  const [bannerImage, setBannerImage] = useState(initialData?.bannerImage || '');

  // Precios
  const [hasSharedService, setHasSharedService] = useState<boolean>(
    initialData ? Boolean(initialData.hasSharedService) : false
  );
  const [sharedPrice, setSharedPrice] = useState<number | string>(
    initialData?.sharedPrice ?? 8
  );

  const [hasPrivateService, setHasPrivateService] = useState<boolean>(
    initialData ? Boolean(initialData.hasPrivateService) : true
  );

  // Map of vehicleId -> price
  const [vehiclePrices, setVehiclePrices] = useState<Record<string, number | string>>(() => {
    const prices: Record<string, number | string> = {};
    if (initialData?.vehiclePrices && Array.isArray(initialData.vehiclePrices)) {
      for (const vp of initialData.vehiclePrices) {
        if (vp.vehicleId) {
          prices[vp.vehicleId] = vp.price;
        }
        if (vp.vehicle?.code) {
          prices[vp.vehicle.code] = vp.price;
        }
      }
    }
    vehicles.forEach((v) => {
      const codePrice = prices[v.code];
      if (prices[v.id] === undefined && codePrice !== undefined) {
        prices[v.id] = codePrice;
      }
      if (prices[v.id] === undefined) {
        if (v.code === 'sedan') prices[v.id] = 20;
        else if (v.code === 'minivan') prices[v.id] = 25;
        else if (v.code === 'benz-10') prices[v.id] = 30;
        else if (v.code === 'benz-15') prices[v.id] = 35;
        else prices[v.id] = 20;
      }
    });
    return prices;
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const generateSlugFromText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleOriginChange = (val: string) => {
    setOrigin(val);
    if (!initialData) {
      const newTitle = val && destination ? `${val} a ${destination}` : val;
      setTitle(newTitle);
      setSlug(generateSlugFromText(newTitle));
    }
  };

  const handleDestinationChange = (val: string) => {
    setDestination(val);
    if (!initialData) {
      const newTitle = origin && val ? `${origin} a ${val}` : val;
      setTitle(newTitle);
      setSlug(generateSlugFromText(newTitle));
    }
  };

  const handleVehiclePriceChange = (vehicleId: string, val: string) => {
    setVehiclePrices((prev) => ({
      ...prev,
      [vehicleId]: val,
    }));
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    startTransition(async () => {
      await deleteTransfer(initialData.id);
      router.push('/transporte');
    });
  };

  const formAction = initialData ? updateTransfer : createTransfer;

  return (
    <form action={formAction} className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      {/* Topbar flotante de guardado */}
      <div className="flex items-center justify-between bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl shadow-md sticky top-16 z-30">
        <div className="flex items-center gap-2">
          <Link
            href="/transporte"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold">
            {initialData ? 'Editar Ruta de Traslado' : 'Nueva Ruta de Traslado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {initialData && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/30 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          )}
          <SubmitSaveButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda / Principal (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Información de la Ruta */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Car className="w-4 h-4 text-slate-600" />
              <span>Información de la Ruta</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Punto de Origen *</Label>
                <Input
                  name="origin"
                  value={origin}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  placeholder="ej. Aeropuerto de Cusco"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Punto de Destino *</Label>
                <Input
                  name="destination"
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  placeholder="ej. Hotel / Centro Cusco / Ollantaytambo"
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nombre / Título de la Ruta *</Label>
              <Input
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!initialData) setSlug(generateSlugFromText(e.target.value));
                }}
                placeholder="ej. Aeropuerto de Cusco a Hotel / Centro Histórico"
                required
                className="text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Slug (URL)</Label>
                <Input
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="aeropuerto-cusco-centro"
                  required
                  className="text-xs font-mono bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Duración Estimada</Label>
                <Input
                  name="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="20-30 min / 1h 45min"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Tipo de Trayecto</Label>
                <Input
                  name="tripType"
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value)}
                  placeholder="Solo ida"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descripción o Detalles (Opcional)</Label>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalles sobre puntos de encuentro, paradas o recomendaciones..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Card: Tarifas de Servicio Privado por Vehículo */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-800">Servicio Privado por Vehículo</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="hasPrivateService" value={hasPrivateService ? 'true' : 'false'} />
                <input
                  type="checkbox"
                  checked={hasPrivateService}
                  onChange={(e) => setHasPrivateService(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-medium text-slate-600">
                  {hasPrivateService ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </label>
            </div>

            {hasPrivateService && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Define la tarifa total por vehículo (USD) para esta ruta específica.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {v.image ? (
                          <img
                            src={v.image}
                            alt={v.name}
                            className="w-12 h-8 object-contain rounded bg-white border border-slate-200 p-0.5"
                          />
                        ) : (
                          <div className="w-12 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-400">
                            <Car className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-800">{v.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-slate-400" /> {v.maxPax} pax
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Briefcase className="w-3 h-3 text-slate-400" /> {v.maxLuggage} maletas
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          name={`vehicle_price_${v.id}`}
                          value={vehiclePrices[v.id] ?? ''}
                          onChange={(e) => handleVehiclePriceChange(v.id, e.target.value)}
                          placeholder="20"
                          className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-right"
                        />
                        <span className="text-[11px] text-slate-500 font-medium">USD</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card: Tarifas de Servicio Compartido */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Servicio Compartido / Grupal</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="hasSharedService" value={hasSharedService ? 'true' : 'false'} />
                <input
                  type="checkbox"
                  checked={hasSharedService}
                  onChange={(e) => setHasSharedService(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-xs font-medium text-slate-600">
                  {hasSharedService ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </label>
            </div>

            {hasSharedService && (
              <div className="flex items-center gap-4 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                <div className="flex-1 text-xs text-blue-900">
                  Precio por pasajero individual en minibús compartido:
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">$</span>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    name="sharedPrice"
                    value={sharedPrice}
                    onChange={(e) => setSharedPrice(e.target.value)}
                    placeholder="8"
                    className="w-24 text-xs font-semibold bg-white text-right"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">USD / pax</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Columna Derecha / Ajustes (1 columna) */}
        <div className="space-y-6">

          {/* Card: Imagen de Portada / Banner */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span>Imagen de Portada (Opcional)</span>
            </h2>

            <ImageDropzone
              name="bannerImage"
              initialUrl={bannerImage}
              onChange={(url) => setBannerImage(url || '')}
            />
          </div>

          {/* Card: Orden de Presentación */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">
              Prioridad / Orden
            </h2>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Posición en la lista (Menor número = Más arriba)</Label>
              <Input
                type="number"
                name="order"
                defaultValue={initialData?.order ?? 0}
                className="text-xs"
              />
            </div>
          </div>

          {/* Enlace rápido a gestión de flota */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="font-semibold text-slate-800">¿Necesitas añadir otro tipo de vehículo?</div>
            <p className="text-slate-600 text-[11px]">
              Puedes administrar las categorías de vehículos y sus especificaciones desde la sección de Flota.
            </p>
            <Link
              href="/transporte/vehiculos"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 pt-1"
            >
              <span>Gestionar Tipos de Vehículo</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>

      </div>

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">¿Eliminar esta ruta?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Se eliminarán las tarifas asociadas a la ruta <span className="font-bold text-slate-800">"{title}"</span>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
