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
  id: string | number;
  title: string;
  content: string;
}

interface FaqItem {
  id: string | number;
  question: string;
  answer: string;
}

import { AutoResizeTextarea, SubmitSaveButton, getStorefrontUrl } from './shared/form-utils';
import { analyzeSeo } from './shared/seo-analysis';

export function TourForm({ 
  categories = [], 
  initialData,
  showCategories = true
}: { 
  categories?: Category[]; 
  initialData?: any;
  showCategories?: boolean;
}) {
  const [creationMode, setCreationMode] = useState<'completo' | 'asistido'>('completo');
  const [assistedStep, setAssistedStep] = useState<number>(1);
  const [groupSize, setGroupSize] = useState<string>(initialData?.groupSize !== undefined && initialData?.groupSize !== null ? String(initialData.groupSize) : '');
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
  const initialItineraryList = initialData?.itineraries || initialData?.itinerary || [];
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(
    initialItineraryList.length > 0
      ? initialItineraryList.map((it: any, idx: number) => ({ 
          id: it.id || Date.now() + idx + Math.random(), 
          title: it.title || '', 
          content: it.content || '' 
        }))
      : [{ id: Date.now(), title: '', content: '' }]
  );
  const initialFaqsList = initialData?.faqs || initialData?.faq || [];
  const [faqs, setFaqs] = useState<FaqItem[]>(
    initialFaqsList.length > 0
      ? initialFaqsList.map((f: any, idx: number) => ({ 
          id: f.id || Date.now() + idx + Math.random(), 
          question: f.question || '', 
          answer: f.answer || '' 
        }))
      : [{ id: Date.now(), question: '', answer: '' }]
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [focusKeyphrase, setFocusKeyphrase] = useState(initialData?.title ? `Tour ${initialData.title}` : '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  const [hasPrivateService, setHasPrivateService] = useState<boolean>(
    Boolean(initialData?.hasPrivateService || initialData?.privatePricing?.length > 0)
  );
  const [region, setRegion] = useState<string>(initialData?.region || '');
  const [duration, setDuration] = useState<string>(initialData?.duration || '');
  const [difficulty, setDifficulty] = useState<string>(initialData?.difficulty || 'Moderada');
  const [altitude, setAltitude] = useState<string>(
    initialData?.altitude?.replace(/\s*m\s*s\.\s*n\.\s*m\.\s*/gi, '').trim() || ''
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (!initialData?.categories || !Array.isArray(initialData.categories)) return [];
    return initialData.categories.map((c: any) => String(c.id || c.name));
  });
  const [sharedPrice, setSharedPrice] = useState<string>(
    initialData?.sharedPrice !== undefined && initialData?.sharedPrice !== null ? String(initialData.sharedPrice) : ''
  );
  const [fixedPrivatePrice, setFixedPrivatePrice] = useState<string>(
    initialData?.fixedPrivatePrice !== undefined && initialData?.fixedPrivatePrice !== null 
      ? String(initialData.fixedPrivatePrice) 
      : (initialData?.privatePricing?.[0]?.price ? String(initialData.privatePricing[0].price) : '')
  );

  const handleCategoryToggle = (catVal: string) => {
    setSelectedCategories(prev => 
      prev.includes(catVal) ? prev.filter(c => c !== catVal) : [...prev, catVal]
    );
    setIsDirty(true);
  };

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
    const numericGroupSize = parseInt(groupSize, 10) || 12;
    for (let p = 1; p <= numericGroupSize; p++) {
      if (privatePrices[p] !== undefined && String(privatePrices[p]).trim() !== '') {
        lastPaxWithPrice = p;
        lastPrice = String(privatePrices[p]);
      }
    }
    if (!lastPrice) return;

    setPrivatePrices(prev => {
      const updated = { ...prev };
      for (let p = lastPaxWithPrice + 1; p <= numericGroupSize; p++) {
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

  // Estado para detectar si hubo cambios en el formulario y modal de confirmación de salida
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isUnsavedAnimating, setIsUnsavedAnimating] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const openUnsavedModal = (targetUrl?: string) => {
    setPendingNavigationUrl(targetUrl || null);
    setShowUnsavedModal(true);
    setTimeout(() => setIsUnsavedAnimating(true), 10);
  };

  const closeUnsavedModal = () => {
    setIsUnsavedAnimating(false);
    setTimeout(() => {
      setShowUnsavedModal(false);
      setPendingNavigationUrl(null);
    }, 200);
  };

  // Comprobar si al menos un campo del formulario contiene datos ingresados
  const hasEnteredData = () => {
    if (!isDirty) return false;

    // Si es edición de tour existente y está sucio, se modificó algo
    if (initialData?.id) return true;

    // En tour nuevo: validar si al menos un input o campo tiene contenido real
    if (title.trim()) return true;
    if (description.trim()) return true;
    if (focusKeyphrase.trim()) return true;
    if (metaDescription.trim()) return true;
    if (galleryImages.some(Boolean)) return true;
    if (itinerary.some(it => it.title.trim() !== '' || it.content.trim() !== '')) return true;
    if (faqs.some(f => f.question.trim() !== '' || f.answer.trim() !== '')) return true;

    if (formRef.current) {
      const inputs = formRef.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]), textarea'
      );
      for (const input of inputs) {
        if (input instanceof HTMLInputElement && input.type === 'checkbox') {
          if (input.checked) return true;
        } else if (input.value && input.value.trim() !== '') {
          return true;
        }
      }
    }

    return false;
  };

  const shouldShowUnsavedPrompt = () => {
    return hasEnteredData();
  };

  const handleConfirmDiscard = () => {
    setIsDirty(false);
    closeUnsavedModal();
    const dest = pendingNavigationUrl || '/catalog/tours';
    window.location.href = dest;
  };

  const handleConfirmSave = () => {
    setIsDirty(false);
    closeUnsavedModal();
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  // El botón "Descartar" directo al lado de Guardar no requiere validación
  const handleDiscardClick = () => {
    setIsDirty(false);
    window.location.href = '/catalog/tours';
  };

  // Prevenir cerrar o recargar la pestaña del navegador si hay cambios con datos reales
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldShowUnsavedPrompt()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, title, description, galleryImages, itinerary, faqs]);

  // Interceptar navegación por enlaces (tabs, sidebar, breadcrumb) solo si se ingresaron datos
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!shouldShowUnsavedPrompt()) return;

      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      if (target.closest('[role="dialog"]')) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (target.getAttribute('target') === '_blank') return;

      e.preventDefault();
      e.stopPropagation();
      openUnsavedModal(href);
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, [isDirty, title, description, galleryImages, itinerary, faqs]);

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
    metaTitle: `${title} - Agencia de Viajes`,
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
    setGroupSize(e.target.value);
    setIsDirty(true);
  };

  const addItineraryDay = () => {
    const newIndex = itinerary.length;
    setItinerary([...itinerary, { id: Date.now(), title: '', content: '' }]);
    setOpenItineraryDays(prev => ({ ...prev, [newIndex]: true }));
    setIsDirty(true);
  };

  const removeItineraryDay = (idToRemove: string | number) => {
    setItinerary(itinerary.filter((d: ItineraryItem) => d.id !== idToRemove));
    setIsDirty(true);
  };

  const addFaq = () => {
    const newIndex = faqs.length;
    setFaqs([...faqs, { id: Date.now(), question: '', answer: '' }]);
    setOpenFaqs(prev => ({ ...prev, [newIndex]: true }));
    setIsDirty(true);
  };

  const removeFaq = (idToRemove: string | number) => {
    setFaqs(faqs.filter((d: FaqItem) => d.id !== idToRemove));
    setIsDirty(true);
  };

  return (
    <form 
      ref={formRef}
      action={createTour} 
      onSubmit={() => setIsDirty(false)}
      onChange={() => setIsDirty(true)}
      onInput={() => setIsDirty(true)}
      className="flex-1 w-full max-w-[1150px] mx-auto px-0 pb-6 select-none"
    >
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="status" value={status === 'Activo' ? 'Active' : 'Draft'} />
      <input type="hidden" name="isFeatured" value={isFeatured === 'Activo' ? 'true' : 'false'} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="metaTitle" value={`${title} - Agencia de Viajes`} />
      <input type="hidden" name="hasSharedService" value="on" />
      {hasPrivateService && <input type="hidden" name="hasPrivateService" value="on" />}
      
      {/* Header Fila de la página (Título + Acciones en la misma fila) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link 
            href="/catalog/tours" 
            onClick={(e) => {
              if (shouldShowUnsavedPrompt()) {
                e.preventDefault();
                openUnsavedModal('/catalog/tours');
              }
            }}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors shrink-0" 
            title="Volver a Tours"
          >
            <Map className="w-4 h-4 text-slate-700 shrink-0" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <h1 className="text-[1.125rem] font-semibold text-[#111111] tracking-tight truncate">
            {initialData?.id ? initialData.title : 'Agregar tour'}
          </h1>
        </div>

        {/* Acciones en la misma fila: Ver / Eliminar (si editando) + Modo (Completo | Asistido) + Descartar / Guardar */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 flex-wrap">
          {initialData?.id && (
            <>
              <a 
                href={getStorefrontUrl(`/tours/${slug || initialData.slug}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 font-semibold text-xs px-3.5 h-8 rounded-md shadow-2xs transition-all select-none shrink-0"
                title="Ver tour en la web"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Ver tour</span>
              </a>

              <Button 
                type="button" 
                disabled={isDeleting}
                onClick={openDeleteModal}
                className="bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-300 hover:border-rose-200 font-semibold text-xs px-3.5 h-8 rounded-md shadow-2xs transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Eliminar tour</span>
              </Button>
            </>
          )}

          {/* Selector de Modo: Completo | Asistido */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setCreationMode('completo')}
              className={`h-7 px-3 rounded-md text-xs transition-all cursor-pointer ${
                creationMode === 'completo'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Modo completo
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('asistido')}
              className={`h-7 px-3 rounded-md text-xs transition-all cursor-pointer ${
                creationMode === 'asistido'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Modo asistido
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleDiscardClick}
              className="h-8 px-3.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer shrink-0"
            >
              Descartar
            </button>

            <SubmitSaveButton />
          </div>
        </div>
      </div>

      {/* Banner de Modo Asistido si está activo */}
      {creationMode === 'asistido' && (
        <div className="mb-5 p-3.5 rounded-xl border border-sky-200 bg-sky-50/80 text-sky-900 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="font-medium">
              <strong>Modo Asistido:</strong> {assistedStep === 1 
                ? 'Parte 1 — Título y Descripción. Completa la información inicial del tour.' 
                : assistedStep === 2
                ? 'Parte 2 — Multimedia. Agrega el banner, miniatura y galería del tour.'
                : assistedStep === 3
                ? 'Parte 3 — Itinerario. Define los días y actividades del tour.'
                : assistedStep === 4
                ? 'Parte 4 — Detalles y Especificaciones. Inclusiones, exclusiones y recomendaciones.'
                : assistedStep === 5
                ? 'Parte 5 — Preguntas Frecuentes. Resuelve dudas habituales del viajero.'
                : assistedStep === 6
                ? 'Parte 6 — Destino y Datos Técnicos. Ubicación, categorías y ficha técnica.'
                : 'Parte 7 — Precios, SEO y Publicación. Tarifas, visibilidad y posicionamiento.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCreationMode('completo')}
            className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer shrink-0 ml-3"
          >
            Volver a modo completo
          </button>
        </div>
      )}

      {/* Grid Principal Shopify Admin (70% Contenido / 30% Sidebar en completo, ancho completo en asistido) */}
      <div className={creationMode === 'asistido' ? 'w-full space-y-6' : 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'}>
        
        {/* ==========================================
            COLUMNA PRINCIPAL (70%): Contenido del Tour
        ========================================== */}
        <div className={creationMode === 'asistido' ? 'w-full space-y-6' : 'lg:col-span-2 space-y-6'}>
          
          {/* Card 1: Título y Descripción (Exacto a Shopify Admin en completo, sin card en asistido) */}
          <div className={creationMode === 'asistido' ? (assistedStep === 1 ? 'space-y-4 pt-1' : 'hidden') : 'bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4'}>
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

            {/* En Modo Asistido: Botón Siguiente para ir a Multimedia */}
            {creationMode === 'asistido' && assistedStep === 1 && (
              <div className="flex justify-end pt-4 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim()) {
                      const el = document.getElementById('title');
                      el?.focus();
                      return;
                    }
                    setAssistedStep(2);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#0B4354] hover:bg-[#0B4354]/90 text-white font-semibold text-xs px-4 h-9 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Multimedia (En completo con card, en asistido sin card cuando assistedStep === 2) */}
          <div className={creationMode === 'asistido' ? (assistedStep === 2 ? 'space-y-6 pt-1' : 'hidden') : 'bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4'}>
            <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-200/80 pb-3">Multimedia</h3>
            
            <div className="space-y-6">
              {/* Row 1: Banner, Miniatura y Mapa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImageDropzone name="bannerImage" label="Banner Principal (Horizontal)" initialUrl={initialData?.bannerImage} folder={`tours/${slug || 'nuevo'}`} />
                <ImageDropzone name="cardImage" label="Miniatura / Card (Cuadrada)" initialUrl={initialData?.cardImage} folder={`tours/${slug || 'nuevo'}`} />
                <ImageDropzone name="mapImage" label="Mapa del Tour" initialUrl={initialData?.mapImage} folder={`tours/${slug || 'nuevo'}`} />
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

            {/* En Modo Asistido: Botones Anterior y Siguiente */}
            {creationMode === 'asistido' && assistedStep === 2 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAssistedStep(1)}
                  className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 h-9 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssistedStep(3)}
                  className="inline-flex items-center gap-1.5 bg-[#0B4354] hover:bg-[#0B4354]/90 text-white font-semibold text-xs px-4 h-9 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Itinerario por Días (En completo con card, en asistido sin card cuando assistedStep === 3) */}
          <div className={creationMode === 'asistido' ? (assistedStep === 3 ? 'space-y-4 pt-1' : 'hidden') : 'bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4'}>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h3 className="font-semibold text-sm text-slate-800">Itinerario por Días</h3>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{itinerary.length} días</span>
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
                              onChange={(e) => {
                                const val = e.target.value;
                                setItinerary(prev => prev.map((item, idx) => idx === index ? { ...item, title: val } : item));
                                setIsDirty(true);
                              }}
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
                              onChange={(e) => {
                                const val = e.target.value;
                                setItinerary(prev => prev.map((item, idx) => idx === index ? { ...item, content: val } : item));
                                setIsDirty(true);
                              }}
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

            {/* En Modo Asistido: Botones Anterior y Siguiente en Paso 3 */}
            {creationMode === 'asistido' && assistedStep === 3 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAssistedStep(2)}
                  className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 h-9 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssistedStep(4)}
                  className="inline-flex items-center gap-1.5 bg-[#0B4354] hover:bg-[#0B4354]/90 text-white font-semibold text-xs px-4 h-9 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Card 4: Detalles y Especificaciones (En completo con card, en asistido sin card cuando assistedStep === 4) */}
          <div className={creationMode === 'asistido' ? (assistedStep === 4 ? 'space-y-5 pt-1' : 'hidden') : 'bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4'}>
            <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-200/80 pb-3">Detalles y Especificaciones</h3>

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

            {/* En Modo Asistido: Botones Anterior y Siguiente en Paso 4 */}
            {creationMode === 'asistido' && assistedStep === 4 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAssistedStep(3)}
                  className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 h-9 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssistedStep(5)}
                  className="inline-flex items-center gap-1.5 bg-[#0B4354] hover:bg-[#0B4354]/90 text-white font-semibold text-xs px-4 h-9 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Card 5: Preguntas Frecuentes (En completo con card, en asistido sin card cuando assistedStep === 5) */}
          <div className={creationMode === 'asistido' ? (assistedStep === 5 ? 'space-y-4 pt-1' : 'hidden') : 'bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4'}>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
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
                              onChange={(e) => {
                                const val = e.target.value;
                                setFaqs(prev => prev.map((item, idx) => idx === index ? { ...item, question: val } : item));
                                setIsDirty(true);
                              }}
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
                              onChange={(e) => {
                                const val = e.target.value;
                                setFaqs(prev => prev.map((item, idx) => idx === index ? { ...item, answer: val } : item));
                                setIsDirty(true);
                              }}
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

            {/* En Modo Asistido: Botones Anterior y Siguiente en Paso 5 */}
            {creationMode === 'asistido' && assistedStep === 5 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAssistedStep(4)}
                  className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 h-9 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssistedStep(6)}
                  className="inline-flex items-center gap-1.5 bg-[#0B4354] hover:bg-[#0B4354]/90 text-white font-semibold text-xs px-4 h-9 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Card 6: Destino y Datos Técnicos (En Modo Asistido como Paso 6 sin card wrapper) */}
          {creationMode === 'asistido' && (
            <div className={assistedStep === 6 ? 'space-y-6 pt-1' : 'hidden'}>
              <div className="border-b border-slate-200/80 pb-3">
                <h3 className="font-semibold text-sm text-slate-800">Destino y Datos Técnicos</h3>
                <p className="text-xs text-slate-500">Define la ubicación, el tipo de experiencia y las exigencias físicas del viaje.</p>
              </div>

              {/* Grid 2 Columnas: Destino y Categorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Destino */}
                <div className="space-y-1.5">
                  <Label htmlFor="asistido_region" className="text-xs font-semibold text-slate-700">Destino (Filtro Catálogo)</Label>
                  <Select name="region" value={region} onValueChange={(val) => { setRegion(val || ''); setIsDirty(true); }}>
                    <SelectTrigger id="asistido_region" className="w-full h-9 bg-white border-slate-300 text-xs font-medium">
                      <SelectValue placeholder="Seleccionar región..." />
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

                {/* Categorización */}
                {showCategories && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Categorización</Label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                      {(categories && categories.length > 0 ? categories : [
                        { id: 'trekking', name: 'Trekking' },
                        { id: 'aventura', name: 'Aventura' },
                        { id: 'nacional', name: 'Nacional' },
                        { id: 'internacional', name: 'Internacional' },
                      ]).map(cat => (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900">
                          <input 
                            type="checkbox" 
                            name="categories" 
                            value={cat.id} 
                            checked={selectedCategories.includes(String(cat.id))}
                            onChange={() => handleCategoryToggle(String(cat.id))}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#0B4354] focus:ring-[#0B4354] cursor-pointer" 
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid 4 Columnas: Datos Técnicos */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-slate-700">Especificaciones Técnicas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="asistido_duration" className="text-[11px] font-medium text-slate-600">Duración</Label>
                    <Input 
                      id="asistido_duration" 
                      name="duration" 
                      value={duration} 
                      onChange={(e) => { setDuration(e.target.value); setIsDirty(true); }}
                      placeholder="Ej. 1 Día / Full Day" 
                      className="bg-white border-slate-300 h-9 text-xs font-medium" 
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="asistido_difficulty" className="text-[11px] font-medium text-slate-600">Dificultad</Label>
                    <Select name="difficulty" value={difficulty} onValueChange={(val) => { setDifficulty(val || 'Moderada'); setIsDirty(true); }}>
                      <SelectTrigger id="asistido_difficulty" className="w-full h-9 bg-white border-slate-300 text-xs font-medium">
                        <SelectValue />
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
                    <Label htmlFor="asistido_altitude" className="text-[11px] font-medium text-slate-600">Altitud Máxima (m s. n. m.)</Label>
                    <Input 
                      id="asistido_altitude" 
                      name="altitude" 
                      value={altitude} 
                      onChange={(e) => { setAltitude(e.target.value); setIsDirty(true); }}
                      placeholder="Ej. 4200 o 3900 - 4200" 
                      className="bg-white border-slate-300 h-9 text-xs font-medium" 
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="asistido_groupSize" className="text-[11px] font-medium text-slate-600">Tamaño Grupo (Pax)</Label>
                    <Input 
                      id="asistido_groupSize" 
                      name="groupSize" 
                      type="number" 
                      min="1" 
                      value={groupSize} 
                      onChange={handleGroupSizeChange} 
                      placeholder="Ej. 12" 
                      className="bg-white border-slate-300 h-9 text-xs font-medium" 
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">La unidad 'm s. n. m.' se formatea automáticamente en la web del catálogo.</p>
              </div>

              {/* Botones Anterior y Siguiente */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAssistedStep(5)}
                  className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 h-9 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssistedStep(7)}
                  className="inline-flex items-center gap-1.5 bg-[#0B4354] hover:bg-[#0B4354]/90 text-white font-semibold text-xs px-4 h-9 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span>Siguiente: Precios y Publicación</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Card 7: Precios, SEO y Publicación (En Modo Asistido como Paso 7 sin card wrapper) */}
          {creationMode === 'asistido' && (
            <div className={assistedStep === 7 ? 'space-y-6 pt-1' : 'hidden'}>
              <div className="border-b border-slate-200/80 pb-3">
                <h3 className="font-semibold text-sm text-slate-800">Precios, SEO y Publicación</h3>
                <p className="text-xs text-slate-500">Configura las tarifas de venta, el posicionamiento en Google y la visibilidad en el catálogo.</p>
              </div>

              {/* Fila 1: Precios (Grupal / Compartido y Privado) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="space-y-1.5">
                  <Label htmlFor="asistido_sharedPrice" className="text-xs font-semibold text-slate-700">Precio por Persona ($ USD) — Servicio Grupal</Label>
                  <Input 
                    id="asistido_sharedPrice" 
                    name="sharedPrice" 
                    type="number" 
                    step="0.01" 
                    value={sharedPrice} 
                    onChange={(e) => { setSharedPrice(e.target.value); setIsDirty(true); }}
                    placeholder="Ej. 45.00" 
                    className="bg-white border-slate-300 h-9 text-xs font-medium" 
                  />
                  <p className="text-[11px] text-slate-400">Tarifa compartida base que se muestra en las cards del catálogo.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">Servicio Privado</Label>
                    {hasPrivateService ? (
                      <button 
                        type="button" 
                        onClick={() => { setHasPrivateService(false); setIsDirty(true); }} 
                        className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Quitar privado
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => { setHasPrivateService(true); setIsDirty(true); }} 
                        className="text-[11px] font-medium text-[#0B4354] hover:underline cursor-pointer"
                      >
                        + Añadir servicio privado
                      </button>
                    )}
                  </div>

                  {hasPrivateService ? (
                    <div className="space-y-2">
                      <Input 
                        id="asistido_fixedPrivatePrice"
                        name="fixedPrivatePrice" 
                        type="number" 
                        step="0.01" 
                        value={fixedPrivatePrice}
                        onChange={(e) => { setFixedPrivatePrice(e.target.value); setIsDirty(true); }}
                        placeholder="Ej. 2000.00" 
                        className="bg-white border-slate-300 h-9 text-xs font-medium" 
                      />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Se cobra una sola vez por el grupo{groupSize ? `, hasta ${groupSize} pasajeros` : ''}.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-400">Sin servicio privado configurado para este tour.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fila 2: Visibilidad y Estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Estado de Publicación</Label>
                  <Select value={status} onValueChange={(val: any) => { setStatus(val); setIsDirty(true); }}>
                    <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs">
                      <SelectItem value="Activo">Activo (Visible en la tienda)</SelectItem>
                      <SelectItem value="Desactivado">Desactivado (Borrador)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Mostrar en recomendados del Inicio</Label>
                  <Select value={isFeatured} onValueChange={(val: any) => { setIsFeatured(val); setIsDirty(true); }}>
                    <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs">
                      <SelectItem value="Desactivado">Desactivado</SelectItem>
                      <SelectItem value="Activo">Activo (Destacado en Inicio)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Máximo 6 tours en esta sección del Inicio.</p>
                </div>
              </div>

              {/* Fila 3: Optimización SEO */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800">Optimización SEO</Label>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${seoAnalysis.badgeClass}`}>
                    SEO: {seoAnalysis.level}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="asistido_focusKeyphrase" className="text-[11px] font-semibold text-slate-700">Palabra clave principal</Label>
                    <AutoResizeTextarea id="asistido_focusKeyphrase" rows={1} placeholder="Ej. Tour Valle Sagrado Cusco" value={focusKeyphrase} onChange={(e) => setFocusKeyphrase(e.target.value)} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="asistido_metaDescription" className="text-[11px] font-semibold text-slate-700">Meta Descripción</Label>
                      <span className="text-[10px] text-slate-400">{metaDescription.length}/160</span>
                    </div>
                    <AutoResizeTextarea id="asistido_metaDescription" name="metaDescription" rows={2} placeholder="Descripción corta para aparecer en Google..." value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                  </div>
                </div>

                {focusKeyphrase && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 animate-in fade-in duration-200">
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

              {/* Botón Anterior y Guardar Tour */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setAssistedStep(6)}
                  className="inline-flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 h-9 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-3">
                  <SubmitSaveButton />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==========================================
            SIDEBAR DERECHO (30% - COLUMNA 2): Estado, Recomendados, Organización, Categorización, Precios y SEO
        ========================================== */}
        {creationMode === 'completo' && (
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

            {/* Card 2: Mostrar en recomendados del Inicio */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <Label className="text-xs font-semibold text-slate-700">Mostrar en recomendados del Inicio</Label>
              <Select value={isFeatured} onValueChange={(val: any) => { setIsFeatured(val); setIsDirty(true); }}>
                <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs">
                  <SelectItem value="Desactivado">Desactivado</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400">Máximo 6 tours en esta sección del Inicio. Esta opción no modifica el diseño de las tarjetas.</p>
            </div>

            {/* Card 3: Destino (Filtro Catálogo) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
              <Label className="text-xs font-semibold text-slate-700">Destino (Filtro Catálogo)</Label>
              <Select name="region" value={region} onValueChange={(val) => { setRegion(val || ''); setIsDirty(true); }}>
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

            {/* Card 4: Datos técnicos */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <h3 className="font-semibold text-xs text-slate-800 border-b border-slate-100 pb-3">Datos técnicos</h3>
              
              <div className="space-y-1">
                <Label htmlFor="duration" className="text-xs font-semibold text-slate-600">Duración</Label>
                <Input 
                  id="duration" 
                  name="duration" 
                  value={duration} 
                  onChange={(e) => { setDuration(e.target.value); setIsDirty(true); }} 
                  placeholder="Ej. 1 Día / Full Day" 
                  className="bg-white border-slate-300 h-8 text-xs font-medium" 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="difficulty" className="text-xs font-semibold text-slate-600">Dificultad</Label>
                <Select name="difficulty" value={difficulty} onValueChange={(val) => { setDifficulty(val || 'Moderada'); setIsDirty(true); }}>
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
                  value={altitude} 
                  onChange={(e) => { setAltitude(e.target.value); setIsDirty(true); }}
                  placeholder="Ej. 4200 o 3900 - 4200" 
                  className="bg-white border-slate-300 h-8 text-xs font-medium" 
                />
                <p className="text-[10px] text-slate-400">Ingresa la cifra o rango. La unidad 'm s. n. m.' se formatea automáticamente en la web.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="groupSize" className="text-xs font-semibold text-slate-600">Tamaño Máximo de Grupo (Pax)</Label>
                <Input id="groupSize" name="groupSize" type="number" min="1" value={groupSize} onChange={handleGroupSizeChange} placeholder="Ej. 12" className="bg-white border-slate-300 h-8 text-xs font-medium" />
              </div>
            </div>

            {/* Card 5: Categorización */}
            {showCategories ? (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
                <h3 className="font-semibold text-xs text-slate-800 border-b border-slate-100 pb-3">Categorización</h3>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1.5">
                  {categories && categories.length > 0 ? (
                    categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          id={`cat_${cat.id}`} 
                          name="categories" 
                          value={cat.id} 
                          checked={selectedCategories.includes(String(cat.id))}
                          onChange={() => handleCategoryToggle(String(cat.id))}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 cursor-pointer" 
                        />
                        <Label htmlFor={`cat_${cat.id}`} className="text-xs font-normal cursor-pointer text-slate-700 flex-1">{cat.name}</Label>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="cat_trekking" 
                          name="categories" 
                          value="trekking" 
                          checked={selectedCategories.includes('trekking')}
                          onChange={() => handleCategoryToggle('trekking')}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 cursor-pointer" 
                        />
                        <Label htmlFor="cat_trekking" className="text-xs font-normal cursor-pointer text-slate-700 flex-1">Trekking</Label>
                      </div>
                      <div className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="cat_aventura" 
                          name="categories" 
                          value="aventura" 
                          checked={selectedCategories.includes('aventura')}
                          onChange={() => handleCategoryToggle('aventura')}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 cursor-pointer" 
                        />
                        <Label htmlFor="cat_aventura" className="text-xs font-normal cursor-pointer text-slate-700 flex-1">Aventura</Label>
                      </div>
                      <div className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="cat_nacional" 
                          name="categories" 
                          value="nacional" 
                          checked={selectedCategories.includes('nacional')}
                          onChange={() => handleCategoryToggle('nacional')}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 cursor-pointer" 
                        />
                        <Label htmlFor="cat_nacional" className="text-xs font-normal cursor-pointer text-slate-700 flex-1">Nacional</Label>
                      </div>
                      <div className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          id="cat_internacional" 
                          name="categories" 
                          value="internacional" 
                          checked={selectedCategories.includes('internacional')}
                          onChange={() => handleCategoryToggle('internacional')}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 cursor-pointer" 
                        />
                        <Label htmlFor="cat_internacional" className="text-xs font-normal cursor-pointer text-slate-700 flex-1">Internacional</Label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Preservar categorías existentes si el usuario no tiene permisos para modificarlas
              initialData?.categories?.map((c: any) => (
                <input key={c.id} type="hidden" name="categories" value={c.id} />
              ))
            )}

            {/* Card 6: Precios */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="sharedPrice" className="text-xs font-semibold text-slate-700">Precio por Persona ($ USD)</Label>
                <Input 
                  id="sharedPrice" 
                  name="sharedPrice" 
                  type="number" 
                  step="0.01" 
                  value={sharedPrice} 
                  onChange={(e) => { setSharedPrice(e.target.value); setIsDirty(true); }}
                  placeholder="Ej. 45.00" 
                  className="bg-white border-slate-300 h-8 text-xs font-medium" 
                />
              </div>

              {/* Servicio Privado (Opcional por botón) */}
              {hasPrivateService ? (
                <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fixedPrivatePrice" className="text-xs font-semibold text-slate-700">Precio fijo del tour privado ($ USD)</Label>
                    <button 
                      type="button" 
                      onClick={() => { setHasPrivateService(false); setIsDirty(true); }} 
                      className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Quitar privado
                    </button>
                  </div>

                  <Input 
                    id="fixedPrivatePrice"
                    name="fixedPrivatePrice" 
                    type="number" 
                    step="0.01" 
                    value={fixedPrivatePrice} 
                    onChange={(e) => { setFixedPrivatePrice(e.target.value); setIsDirty(true); }}
                    placeholder="Ej. 2000.00" 
                    className="bg-white border-slate-300 h-8 text-xs font-medium" 
                  />

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Se cobra una sola vez por el grupo{groupSize ? `, hasta ${groupSize} pasajeros` : ''}. El importe por persona es solo una referencia.
                  </p>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setHasPrivateService(true); setIsDirty(true); }}
                    className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-xs h-8 rounded-lg font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Añadir precio privado
                  </Button>
                </div>
              )}
            </div>

            {/* Card 7: Optimización SEO */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-xs text-slate-800">Optimización SEO</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${seoAnalysis.badgeClass}`}>
                  SEO: {seoAnalysis.level}
                </span>
              </div>
              
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
        )}

      </div>

      {/* MODAL CONFIRMACION DE CAMBIOS NO GUARDADOS ESTILO SHOPIFY ADMIN */}
      {showUnsavedModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-modal-title"
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ease-out select-none ${
            isUnsavedAnimating ? 'bg-black/60 backdrop-blur-[3px] opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
          }`}
          onClick={closeUnsavedModal}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-full max-w-[480px] rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-200 ease-out transform ${
              isUnsavedAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-3'
            }`}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <h3 id="unsaved-modal-title" className="font-semibold text-sm text-slate-900">
                  Tour no guardado
                </h3>
              </div>
              <button 
                type="button" 
                onClick={closeUnsavedModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 space-y-2">
              <p className="text-xs font-semibold text-slate-800">
                Tienes modificaciones pendientes sin guardar.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si sales de la pestaña o te vas a otra sección sin guardar, se perderán todos los datos que ingresaste o modificaste. ¿Deseas guardar los cambios antes de salir?
              </p>
            </div>

            {/* Footer Modal */}
            <div className="grid grid-cols-3 gap-2.5 px-5 py-3.5 bg-slate-50/60 border-t border-slate-100">
              <button 
                type="button" 
                onClick={closeUnsavedModal}
                className="h-8 px-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center text-center"
              >
                Continuar editando
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDiscard}
                className="h-8 px-2 rounded-md border border-slate-300 hover:bg-rose-50 hover:border-rose-200 text-rose-600 font-semibold text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center text-center"
              >
                Descartar cambios
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSave}
                className="h-8 px-2 rounded-md bg-[#008060] hover:bg-[#006e52] text-white font-semibold text-xs transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>Guardar tour</span>
              </button>
            </div>

          </div>
        </div>
      )}

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
