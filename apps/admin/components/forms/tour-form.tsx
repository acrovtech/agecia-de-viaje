'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Map, Tag, Save, AlertCircle, X, Loader2, ExternalLink, Copy, ArrowDownToLine } from 'lucide-react';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTour, deleteTour } from '../../app/actions/tour';

type Category = {
  id: string;
  name: string;
};

interface ItineraryItem {
  id: number;
  title: string;
  content: string;
}

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

import { AutoResizeTextarea, SubmitSaveButton, getStorefrontUrl } from './shared/form-utils';
import { analyzeSeo } from './shared/seo-analysis';

export function TourForm({ categories, initialData }: { categories: Category[]; initialData?: any }) {
  const [groupSize, setGroupSize] = useState<number>(initialData?.groupSize || 12);
  const [status, setStatus] = useState<'Activo' | 'Desactivado'>(initialData?.status === 'Draft' ? 'Desactivado' : 'Activo');
  const [isFeatured, setIsFeatured] = useState<'Activo' | 'Desactivado'>(initialData?.isFeatured ? 'Activo' : 'Desactivado');
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [galleryImages, setGalleryImages] = useState<(string | null)[]>([
    initialData?.images?.[0]?.url || null,
    initialData?.images?.[1]?.url || null,
    initialData?.images?.[2]?.url || null,
    initialData?.images?.[3]?.url || null,
  ]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(
    initialData?.itinerary && initialData.itinerary.length > 0
      ? initialData.itinerary.map((it: any) => ({ id: it.id || Date.now() + Math.random(), title: it.title, content: it.content }))
      : [{ id: Date.now(), title: '', content: '' }]
  );
  const [faqs, setFaqs] = useState<FaqItem[]>(
    initialData?.faqs && initialData.faqs.length > 0
      ? initialData.faqs.map((f: any) => ({ id: f.id || Date.now() + Math.random(), question: f.question, answer: f.answer }))
      : [{ id: Date.now(), question: '', answer: '' }]
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [focusKeyphrase, setFocusKeyphrase] = useState(initialData?.title ? `Tour ${initialData.title}` : '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  const [hasPrivateService, setHasPrivateService] = useState<boolean>(
    Boolean(initialData?.hasPrivateService || initialData?.privatePricing?.length > 0)
  );

  // Precios privados por Pax dinámicos
  const [privatePrices, setPrivatePrices] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    if (initialData?.privatePricing && Array.isArray(initialData.privatePricing)) {
      initialData.privatePricing.forEach((p: any) => {
        if (p.pax && p.price !== undefined && p.price !== null) {
          map[p.pax] = String(p.price);
        }
      });
    }
    return map;
  });

  // Subida múltiple para la galería (hasta 4 fotos a la vez)
  const handleMultipleGalleryUpload = async (files: File[]) => {
    const filesToUpload = files.slice(0, 4);
    setIsDirty(true);

    const uploadPromises = filesToUpload.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `tours/${slug || 'nuevo'}`);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        return data.success && data.url ? data.url : null;
      } catch (e) {
        console.error('Error al subir imagen de galería:', e);
        return null;
      }
    });

    const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);

    setGalleryImages((prev) => {
      const next = [...prev];
      let uploadedIdx = 0;
      for (let i = 0; i < next.length && uploadedIdx < uploadedUrls.length; i++) {
        if (!next[i]) {
          next[i] = uploadedUrls[uploadedIdx++];
        }
      }
      for (let i = 0; i < next.length && uploadedIdx < uploadedUrls.length; i++) {
        next[i] = uploadedUrls[uploadedIdx++];
      }
      return next;
    });
  };

  const handlePrivatePriceChange = (pax: number, val: string) => {
    setPrivatePrices(prev => ({ ...prev, [pax]: val }));
    setIsDirty(true);
  };

  const copyPreviousPrice = (pax: number) => {
    if (pax <= 1) return;
    const prevPrice = privatePrices[pax - 1];
    if (prevPrice !== undefined) {
      setPrivatePrices(prev => ({ ...prev, [pax]: prevPrice }));
      setIsDirty(true);
    }
  };

  const fillRemainingPrices = () => {
    let lastPaxWithPrice = 0;
    let lastPrice = '';
    for (let p = 1; p <= groupSize; p++) {
      if (privatePrices[p] !== undefined && String(privatePrices[p]).trim() !== '') {
        lastPaxWithPrice = p;
        lastPrice = String(privatePrices[p]);
      }
    }
    if (!lastPrice) return;

    setPrivatePrices(prev => {
      const updated = { ...prev };
      for (let p = lastPaxWithPrice + 1; p <= groupSize; p++) {
        updated[p] = lastPrice;
      }
      return updated;
    });
    setIsDirty(true);
  };

  // Estado para el modal de confirmación de eliminación estilo Shopify
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setTimeout(() => setIsModalAnimating(true), 10);
  };

  const closeDeleteModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => setShowDeleteModal(false), 200);
  };

  // Estado para detectar si hubo cambios en el formulario
  const [isDirty, setIsDirty] = useState(false);

  const [isDeleting, startDeleteTransition] = useTransition();

  // Estado para acordeones en el Admin
  const [openItineraryDays, setOpenItineraryDays] = useState<Record<number, boolean>>({ 0: true });
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true });

  const toggleItineraryDay = (index: number) => {
    setOpenItineraryDays(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleFaqItem = (index: number) => {
    setOpenFaqs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleDeleteTour = () => {
    if (!initialData?.id) return;
    startDeleteTransition(async () => {
      const res = await deleteTour(initialData.id);
      if (res.success) {
        window.location.href = '/tours';
      } else {
        alert('Error al eliminar el tour.');
        setShowDeleteModal(false);
      }
    });
  };

  const seoAnalysis = analyzeSeo({
    title,
    metaTitle: `${title} - Incabound`,
    metaDescription,
    slug,
    focusKeyphrase,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(
      newTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  const handleGroupSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setGroupSize(isNaN(val) || val < 1 ? 1 : val);
  };

  const addItineraryDay = () => {
    const newIndex = itinerary.length;
    setItinerary([...itinerary, { id: Date.now(), title: '', content: '' }]);
    setOpenItineraryDays(prev => ({ ...prev, [newIndex]: true }));
    setIsDirty(true);
  };

  const removeItineraryDay = (idToRemove: number) => {
    setItinerary(itinerary.filter((d: ItineraryItem) => d.id !== idToRemove));
    setIsDirty(true);
  };

  const addFaq = () => {
    const newIndex = faqs.length;
    setFaqs([...faqs, { id: Date.now(), question: '', answer: '' }]);
    setOpenFaqs(prev => ({ ...prev, [newIndex]: true }));
    setIsDirty(true);
  };

  const removeFaq = (idToRemove: number) => {
    setFaqs(faqs.filter((d: FaqItem) => d.id !== idToRemove));
    setIsDirty(true);
  };

  return (
    <form 
      action={createTour} 
      onChange={() => setIsDirty(true)}
      onInput={() => setIsDirty(true)}
      className="flex-1 w-full max-w-[1150px] mx-auto px-0 pb-6 select-none"
    >
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="status" value={status === 'Activo' ? 'Active' : 'Draft'} />
      <input type="hidden" name="isFeatured" value={isFeatured === 'Activo' ? 'true' : 'false'} />
      
      {/* BARRA CONTEXTUAL FLOTANTE SHOPIFY POLARIS (Integrada al topbar) */}
      {(isDirty || !initialData?.id) && (
        <div className="fixed top-2 left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[60] flex items-center justify-between gap-2 md:gap-8 md:min-w-[620px] bg-[#222222] text-white py-1.5 px-3 md:py-1 md:pr-1 md:pb-1 md:pl-3.5 rounded-xl shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 fill-[#EEEEEE] shrink-0">
              <path d="M8 4a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75"></path>
              <path d="M8 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
              <path fillRule="evenodd" d="M1.5 6.25a4.75 4.75 0 0 1 4.75-4.75h3.5a4.75 4.75 0 0 1 4.75 4.75v2.5a4.75 4.75 0 0 1-4.573 4.747l-1.335 1.714a.75.75 0 0 1-1.189-.007l-1.3-1.706a4.75 4.75 0 0 1-4.603-4.748zm4.75-3.25a3.25 3.25 0 0 0-3.25 3.25v2.5a3.25 3.25 0 0 0 3.25 3.25h.226c.234 0 .455.11.597.296l.934 1.225.96-1.232a.75.75 0 0 1 .591-.289h.192a3.25 3.25 0 0 0 3.25-3.25v-2.5a3.25 3.25 0 0 0-3.25-3.25z"></path>
            </svg>
            <h2 className="text-[11px] md:text-[12px] leading-[16px] font-[450] text-[#EEEEEE] tracking-tight truncate">
              {initialData?.id ? 'Cambios no guardados' : 'Tour no guardado'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              type="button"
              onClick={() => {
                if (initialData?.id) {
                  setIsDirty(false);
                } else {
                  window.location.href = '/tours';
                }
              }}
              className="px-2.5 md:px-3 py-1 rounded-lg bg-[#383838] hover:bg-[#444444] text-[#EEEEEE] font-[550] text-[11px] md:text-[12px] leading-[16px] transition-colors"
            >
              Descartar
            </button>
            <SubmitSaveButton />
          </div>
        </div>
      )}

      {/* Header Titulo de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link href="/tours" className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors shrink-0" title="Volver a Tours">
            <Map className="w-4 h-4 text-slate-700 shrink-0" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <h1 className="text-[1rem] font-semibold text-[#303030] tracking-tight truncate">
            {initialData?.id ? initialData.title : 'Agregar tour'}
          </h1>
        </div>

        {/* Acciones de Tour en Modo Edición (Ver tour + Eliminar tour) */}
        {initialData?.id && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a 
              href={getStorefrontUrl(`/tours/${slug || initialData.slug}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-semibold text-xs px-3.5 py-1.5 h-auto rounded-lg shadow-2xs transition-all select-none"
              title="Ver tour en la web"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver tour</span>
            </a>

            <Button 
              type="button" 
              disabled={isDeleting}
              onClick={openDeleteModal}
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-semibold text-xs px-3.5 py-1.5 h-auto rounded-lg shadow-2xs transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Eliminar tour</span>
            </Button>
          </div>
        )}
      </div>

      {/* Grid Principal Shopify Admin (70% Contenido / 30% Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ==========================================
            COLUMNA PRINCIPAL (70%): Contenido del Tour
        ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Título y Descripción (Exacto a Shopify Admin) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-slate-700">Título</Label>
              <Input 
                id="title" name="title" required placeholder="Ej. Tour Valle Sagrado Cusco Full Day" 
                className="text-sm bg-white border-slate-300 focus:border-slate-900 font-medium text-slate-900 rounded-lg"
                value={title} onChange={handleTitleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">Descripción</Label>
              <AutoResizeTextarea 
                id="description" 
                name="description" 
                rows={5} 
                className="text-sm"
                placeholder="Escribe la descripción completa del tour..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: Multimedia */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-3">Multimedia</h3>
            
            <div className="space-y-6">
              {/* Row 1: Banner, Miniatura y Mapa */}
              <div>
                <Label className="text-xs font-semibold text-slate-700 mb-3 block">Imágenes Clave (Banner, Miniatura y Mapa)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ImageDropzone name="bannerImage" label="Banner Principal (Horizontal)" initialUrl={initialData?.bannerImage} folder={`tours/${slug || 'nuevo'}`} />
                  <ImageDropzone name="cardImage" label="Miniatura / Card (Cuadrada)" initialUrl={initialData?.cardImage} folder={`tours/${slug || 'nuevo'}`} />
                  <ImageDropzone name="mapImage" label="Mapa del Tour" initialUrl={initialData?.mapImage} folder={`tours/${slug || 'nuevo'}`} />
                </div>
              </div>

              {/* Row 2: Galería de 4 Fotos */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-semibold text-slate-700">Galería (Hasta 4 Fotos)</Label>
                  <span className="text-[11px] text-slate-400">Puedes seleccionar hasta 4 fotos a la vez</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.map((imgUrl, idx) => (
                    <ImageDropzone 
                      key={idx}
                      name={`galleryImage_${idx + 1}`} 
                      label={`Foto Galería ${idx + 1}`} 
                      labelPosition="bottom" 
                      initialUrl={imgUrl || undefined} 
                      folder={`tours/${slug || 'nuevo'}`} 
                      actionStyle="corner"
                      multiple={true}
                      onMultipleFiles={handleMultipleGalleryUpload}
                      onChange={(newUrl) => {
                        setGalleryImages((prev) => {
                          const next = [...prev];
                          next[idx] = newUrl;
                          return next;
                        });
                        setIsDirty(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Itinerario por Días (Acordeón con Animación) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-sm text-slate-800">Itinerario por Días</h3>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{itinerary.length} días</span>
            </div>
            
            <div className="space-y-3">
              <input type="hidden" name="itineraryCount" value={itinerary.length} />
              
              {itinerary.map((day: ItineraryItem, index: number) => {
                const isOpen = openItineraryDays[index] ?? (index === 0);
                return (
                  <div key={day.id} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all">
                    
                    <div 
                      onClick={() => toggleItineraryDay(index)}
                      className="flex items-center justify-between px-4 py-3 bg-slate-100/80 hover:bg-slate-100 cursor-pointer select-none transition-colors border-b border-slate-200/80"
                    >
                      <div className="flex items-center gap-3 font-semibold text-xs text-slate-900">
                        <span className="w-5 h-5 rounded-full bg-[#0B4354] text-white flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        <span>{day.title || `Día ${index + 1}`}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {itinerary.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeItineraryDay(day.id); }}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded transition-colors"
                            title="Eliminar este día"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Animación Suave Open / Close */}
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="p-4 space-y-3 bg-white border-t border-slate-100">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600">Título del Día</Label>
                            <Input 
                              name={`itinerary_title_${index}`} 
                              placeholder="Ej. Recepción en Cusco e Inka Jungle Tour" 
                              defaultValue={day.title}
                              className="bg-white border-slate-300 h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600">Descripción de las actividades</Label>
                            <AutoResizeTextarea 
                              name={`itinerary_content_${index}`} 
                              rows={3} 
                              placeholder="Detalla lo que incluye este día..."
                              defaultValue={day.content}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={addItineraryDay}
                className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-xs h-9 rounded-xl font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Agregar otro día al itinerario
              </Button>
            </div>
          </div>

          {/* Card 4: Inclusiones, Exclusiones y Recomendaciones (Cada uno en su propia Fila) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-3">Detalles y Especificaciones</h3>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="inclusions" className="text-xs font-semibold text-slate-700">Incluye (un ítem por línea)</Label>
                <AutoResizeTextarea 
                  id="inclusions" name="inclusions" rows={3} 
                  placeholder="✓ Guía profesional en español&#10;✓ Transporte privado turístico" 
                  defaultValue={initialData?.inclusions?.map((i: any) => i.content).join('\n')} 
                />
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <Label htmlFor="exclusions" className="text-xs font-semibold text-slate-700">No Incluye (un ítem por línea)</Label>
                <AutoResizeTextarea 
                  id="exclusions" name="exclusions" rows={3} 
                  placeholder="✗ Propinas voluntarias&#10;✗ Vuelos internacionales" 
                  defaultValue={initialData?.exclusions?.map((e: any) => e.content).join('\n')} 
                />
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <Label htmlFor="recommendations" className="text-xs font-semibold text-slate-700">Recomendaciones para el Viajero (un ítem por línea)</Label>
                <AutoResizeTextarea 
                  id="recommendations" name="recommendations" rows={3} 
                  placeholder="• Llevar bloqueador solar y repelente&#10;• Zapatillas cómodas de caminata" 
                  defaultValue={initialData?.recommendations?.map((r: any) => r.content).join('\n')} 
                />
              </div>
            </div>
          </div>

          {/* Card 5: Preguntas Frecuentes (FAQs Acordeón con Animación) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-sm text-slate-800">Preguntas Frecuentes (FAQs)</h3>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{faqs.length} preguntas</span>
            </div>

            <div className="space-y-3">
              <input type="hidden" name="faqsCount" value={faqs.length} />

              {faqs.map((faq: FaqItem, index: number) => {
                const isOpen = openFaqs[index] ?? (index === 0);
                return (
                  <div key={faq.id} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all">
                    
                    <div 
                      onClick={() => toggleFaqItem(index)}
                      className="flex items-center justify-between px-4 py-3 bg-slate-100/80 hover:bg-slate-100 cursor-pointer select-none transition-colors border-b border-slate-200/80"
                    >
                      <span className="font-semibold text-xs text-slate-900">
                        {faq.question || `Pregunta ${index + 1}`}
                      </span>

                      <div className="flex items-center gap-2">
                        {faqs.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFaq(faq.id); }}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded transition-colors"
                            title="Eliminar esta pregunta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Animación Suave Open / Close */}
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="p-4 space-y-3 bg-white border-t border-slate-100">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600">Pregunta</Label>
                            <Input 
                              name={`faq_question_${index}`} 
                              placeholder="Ej. ¿A qué hora empieza el tour?" 
                              defaultValue={faq.question}
                              className="bg-white border-slate-300 h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-slate-600">Respuesta</Label>
                            <AutoResizeTextarea 
                              name={`faq_answer_${index}`} 
                              rows={2} 
                              placeholder="Respuesta detallada..."
                              defaultValue={faq.answer}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={addFaq}
                className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-xs h-9 rounded-xl font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Agregar otra pregunta frecuente
              </Button>
            </div>
          </div>

        </div>

        {/* ==========================================
            SIDEBAR DERECHO (30% - COLUMNA 2): Estado, Recomendados, Organización, Categorización, Precios y SEO
        {/* ==========================================
            SIDEBAR DERECHO (30% - COLUMNA 2): Estado, Recomendados, Organización, Categorización, Precios y SEO
        ========================================== */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card 1: Estado del Producto */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <Label className="text-xs font-semibold text-slate-700">Estado</Label>
            <Select value={status} onValueChange={(val: any) => { setStatus(val); setIsDirty(true); }}>
              <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs">
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Desactivado">Desactivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card 2: Sección recomendados (Home) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <Label className="text-xs font-semibold text-slate-700">Sección recomendados (Home)</Label>
            <Select value={isFeatured} onValueChange={(val: any) => { setIsFeatured(val); setIsDirty(true); }}>
              <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs">
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Desactivado">Desactivado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400">Desactivado por defecto. Máximo 6 tours destacados en el Home.</p>
          </div>

          {/* Card 3: Destino (Filtro Catálogo) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <Label className="text-xs font-semibold text-slate-700">Destino (Filtro Catálogo)</Label>
            <Select name="region" defaultValue={initialData?.region || undefined} onValueChange={() => setIsDirty(true)}>
              <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs">
                <SelectItem value="Cusco">Cusco</SelectItem>
                <SelectItem value="Lima">Lima</SelectItem>
                <SelectItem value="Ica">Ica</SelectItem>
                <SelectItem value="Arequipa">Arequipa</SelectItem>
                <SelectItem value="Puno">Puno</SelectItem>
                <SelectItem value="Madre de Dios">Madre de Dios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card 3: Datos técnicos */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <h3 className="font-semibold text-xs text-slate-800 border-b border-slate-100 pb-2">Datos técnicos</h3>
            
            <div className="space-y-1">
              <Label htmlFor="duration" className="text-xs font-semibold text-slate-600">Duración</Label>
              <Input id="duration" name="duration" defaultValue={initialData?.duration} placeholder="Ej. 1 Día / Full Day" className="bg-white border-slate-300 h-8 text-xs" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="difficulty" className="text-xs font-semibold text-slate-600">Dificultad</Label>
              <Select name="difficulty" defaultValue={initialData?.difficulty || 'Moderada'} onValueChange={() => setIsDirty(true)}>
                <SelectTrigger className="w-full h-8 bg-white border-slate-300 text-xs font-semibold">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs font-medium">
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Fácil – Moderada">Fácil – Moderada</SelectItem>
                  <SelectItem value="Moderada">Moderada</SelectItem>
                  <SelectItem value="Moderada – Difícil">Moderada – Difícil</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="altitude" className="text-xs font-semibold text-slate-600">Altitud Máxima (m s. n. m.)</Label>
              <Input 
                id="altitude" 
                name="altitude" 
                defaultValue={initialData?.altitude?.replace(/\s*m\s*s\.\s*n\.\s*m\.\s*/gi, '').trim()} 
                placeholder="Ej. 4200 o 3900 - 4200" 
                className="bg-white border-slate-300 h-8 text-xs font-medium" 
              />
              <p className="text-[10px] text-slate-400">Ingresa la cifra o rango. La unidad 'm s. n. m.' se formatea automáticamente en la web.</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="groupSize" className="text-xs font-semibold text-slate-600">Tamaño de Grupo (Pax)</Label>
              <Input id="groupSize" name="groupSize" type="number" min="1" value={groupSize} onChange={handleGroupSizeChange} placeholder="12" className="bg-white border-slate-300 h-8 text-xs" />
            </div>
          </div>

          {/* Card 4: Categorización */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <h3 className="font-semibold text-xs text-slate-800 border-b border-slate-100 pb-2">Categorización</h3>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <p className="text-[11px] text-slate-400">Sin categorías.</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      id={`cat_${cat.id}`} 
                      name="categories" 
                      value={cat.id} 
                      defaultChecked={initialData?.categories?.some((c: any) => c.id === cat.id)}
                      onChange={() => setIsDirty(true)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900" 
                    />
                    <Label htmlFor={`cat_${cat.id}`} className="text-xs font-normal cursor-pointer text-slate-700 flex-1">{cat.name}</Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 4: Precios */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs px-4 py-3.5 space-y-3">
            {/* Servicio Compartido / Grupal (Siempre activo) */}
            <input type="hidden" name="hasSharedService" value="on" />
            <div className="space-y-1">
              <Label htmlFor="sharedPrice" className="text-xs font-semibold text-slate-700">Precio por Persona ($ USD)</Label>
              <Input 
                id="sharedPrice" 
                name="sharedPrice" 
                type="number" 
                step="0.01" 
                defaultValue={initialData?.sharedPrice} 
                placeholder="Ej. 45.00" 
                className="bg-white border-slate-300 h-8 text-xs font-medium" 
              />
            </div>

            {/* Servicio Privado (Opcional por botón) */}
            {hasPrivateService ? (
              <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                <input type="hidden" name="hasPrivateService" value="on" />
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">Precios Servicio Privado ($ por Pax)</Label>
                  <button 
                    type="button" 
                    onClick={() => { setHasPrivateService(false); setIsDirty(true); }} 
                    className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Quitar privado
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: groupSize }).map((_, i) => {
                    const pax = i + 1;
                    return (
                      <div key={pax} className="relative flex items-center">
                        <Input 
                          name={`privatePrice_${pax}`} 
                          type="number" 
                          step="0.01" 
                          value={privatePrices[pax] ?? ''}
                          onChange={(e) => handlePrivatePriceChange(pax, e.target.value)}
                          placeholder={`${pax} Pax $`} 
                          className="text-left pl-2.5 pr-7 bg-slate-50 border-slate-200 text-xs h-8 font-medium focus:bg-white" 
                        />
                        {pax > 1 && (
                          <button
                            type="button"
                            onClick={() => copyPreviousPrice(pax)}
                            title={`Copiar precio del Pax ${pax - 1}`}
                            className="absolute right-1 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botón de Copiar Último Precio al Resto */}
                <div className="pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={fillRemainingPrices}
                    title="Copiar el último precio ingresado a todos los siguientes pax"
                    className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-[11px] font-medium text-slate-700 hover:text-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiar último precio al resto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setHasPrivateService(true); setIsDirty(true); }}
                  className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-xs h-8 rounded-lg font-medium"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Añadir precio privado
                </Button>
              </div>
            )}
          </div>

          {/* Card 5: Optimización SEO */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Optimización SEO</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${seoAnalysis.badgeClass}`}>
                SEO: {seoAnalysis.level}
              </span>
            </div>
            
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="metaTitle" value={`${title} - Incabound`} />

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="focusKeyphrase" className="text-xs font-semibold text-slate-700">Palabra clave principal</Label>
                <AutoResizeTextarea id="focusKeyphrase" rows={1} placeholder="Ej. Tour Valle Sagrado Cusco" value={focusKeyphrase} onChange={(e) => setFocusKeyphrase(e.target.value)} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="metaDescription" className="text-xs font-semibold text-slate-700">Meta Descripción</Label>
                  <span className="text-[10px] text-slate-400">{metaDescription.length}/160</span>
                </div>
                <AutoResizeTextarea id="metaDescription" name="metaDescription" rows={3} placeholder="Descripción corta para aparecer en Google..." value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
              </div>

              {/* Panel de Análisis SEO */}
              {focusKeyphrase && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Diagnóstico SEO:</span>
                    <span className={`font-bold ${seoAnalysis.color}`}>{seoAnalysis.status}</span>
                  </div>
                  <ul className="space-y-1 text-[11px]">
                    {seoAnalysis.results.map((r, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className={r.type === 'good' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {r.type === 'good' ? '✓' : '✗'}
                        </span>
                        <span className="text-slate-600">{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL CONFIRMACION DE ELIMINACION EXACTO A SHOPIFY ADMIN CON ANIMACIÓN FLUIDA */}
      {showDeleteModal && (
        <div 
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ease-out select-none ${
            isModalAnimating ? 'bg-black/60 backdrop-blur-[3px] opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
          }`}
          onClick={closeDeleteModal}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-full max-w-[480px] rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-200 ease-out transform ${
              isModalAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-3'
            }`}
          >
            
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">
                ¿Eliminar {initialData?.title || title || 'este tour'}?
              </h3>
              <button 
                type="button" 
                onClick={closeDeleteModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Si eliminas <strong className="font-semibold text-slate-900">{initialData?.title || title}</strong>, esta acción no se puede deshacer. Se quitará el tour de la web y todos sus datos e itinerarios asociados se eliminarán permanentemente.
              </p>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50/60 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs h-8 px-3.5 rounded-lg shadow-2xs"
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                disabled={isDeleting}
                onClick={handleDeleteTour}
                className="bg-[#D82C0D] hover:bg-[#BC250B] text-white font-medium text-xs h-8 px-3.5 rounded-lg shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                <span>{isDeleting ? 'Eliminando...' : 'Eliminar tour'}</span>
              </Button>
            </div>

          </div>
        </div>
      )}
    </form>
  );
}
