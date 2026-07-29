'use client';

import Link from 'next/link';
import { useState, useTransition, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ExternalLink, BookOpen, ChevronRight } from 'lucide-react';
import { createBlog, updateBlog, deleteBlog } from '../../app/actions/blog';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SubmitSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-3 md:px-3.5 py-1 rounded-lg bg-[#008060] hover:bg-[#006e52] text-white font-[600] text-[11px] md:text-[12px] leading-[16px] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
    >
      {pending ? 'Guardando...' : 'Guardar'}
    </button>
  );
}

function AutoResizeTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [props.value, props.defaultValue]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    if (props.onInput) props.onInput(e);
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      onInput={handleInput}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 leading-relaxed overflow-hidden resize-none transition-[height] duration-75 ${props.className || ''}`}
    />
  );
}

export function BlogForm({ initialData }: { initialData?: any }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [status, setStatus] = useState<'Active' | 'Draft'>('Active');
  const [bannerImage, setBannerImage] = useState(initialData?.bannerImage || '');
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
  const [keywords, setKeywords] = useState(initialData?.keywords || '');
  
  const [paragraphs, setParagraphs] = useState<any[]>(
    initialData?.paragraphs?.length
      ? initialData.paragraphs.map((p: any) => ({
          id: p.id || Date.now() + Math.random(),
          subtitle: p.subtitle || '',
          content: p.content || '',
          image: p.image || ''
        }))
      : [{ id: Date.now(), subtitle: '', content: '', image: '' }]
  );

  // Estado para el modal de confirmación de eliminación estilo Shopify
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Estado para detectar si hubo cambios en el formulario
  const [isDirty, setIsDirty] = useState(false);

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setTimeout(() => setIsModalAnimating(true), 10);
  };

  const closeDeleteModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => setShowDeleteModal(false), 200);
  };

  const handleDeleteBlog = () => {
    if (!initialData?.id) return;
    startDeleteTransition(async () => {
      const res = await deleteBlog(initialData.id);
      if (res.success) {
        window.location.href = '/blogs';
      } else {
        alert('Error al eliminar la publicación.');
        setShowDeleteModal(false);
      }
    });
  };

  // Auto-generar slug a partir del título
  const slug = initialData?.slug && title === initialData?.title
    ? initialData.slug
    : title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

  const addParagraph = () => {
    setParagraphs([...paragraphs, { id: Date.now(), subtitle: '', content: '', image: '' }]);
    setIsDirty(true);
  };

  const removeParagraph = (idToRemove: number) => {
    setParagraphs(paragraphs.filter(p => p.id !== idToRemove));
    setIsDirty(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  // Algoritmo de Inteligencia SEO estilo Yoast / RankMath (Google NLP Tokenization)
  const getSeoAnalysis = () => {
    let score = 0;
    const results: { text: string; type: 'good' | 'bad' }[] = [];
    const focusKeyphrase = keywords.split(',')[0] || title;
    
    if (!focusKeyphrase.trim()) {
      return {
        level: 'Pendiente',
        status: 'Sin clave',
        color: 'text-slate-400',
        badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
        results: [{ text: 'Ingresa palabras clave para activar el análisis SEO', type: 'bad' as const }]
      };
    }

    const STOP_WORDS = new Set(['tour', 'tours', 'de', 'del', 'el', 'la', 'los', 'las', 'en', 'para', 'por', 'un', 'una', 'y', 'a', 'con', 'dia', 'dias', 'full', 'day', 'guia']);

    const normalizeText = (text: string) => 
      text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '');

    const keyphraseNormalized = normalizeText(focusKeyphrase);
    const keyphraseTokens = keyphraseNormalized.split(/\s+/).filter(t => t.length > 0);
    const coreKeyTokens = keyphraseTokens.filter(t => !STOP_WORDS.has(t) && t.length > 1);
    const targetTokens = coreKeyTokens.length > 0 ? coreKeyTokens : keyphraseTokens;

    const titleNormalized = normalizeText(title);
    const descNormalized = normalizeText(metaDescription);
    const slugNormalized = normalizeText(slug);

    // 1. Análisis en el Título
    const titleMatchCount = targetTokens.filter(t => titleNormalized.includes(t)).length;
    const isTitleMatched = targetTokens.length > 0 && titleMatchCount >= Math.ceil(targetTokens.length * 0.7);

    if (isTitleMatched) {
      results.push({ text: 'Palabra clave presente en el Título del artículo', type: 'good' });
      score += 2;
    } else {
      results.push({ text: 'Falta la palabra clave o sus términos principales en el Título', type: 'bad' });
    }

    // 2. Análisis en la Meta Descripción
    const descMatchCount = targetTokens.filter(t => descNormalized.includes(t)).length;
    const isDescMatched = targetTokens.length > 0 && descMatchCount >= Math.ceil(targetTokens.length * 0.7);

    if (isDescMatched) {
      results.push({ text: 'Palabra clave presente en la Meta Descripción', type: 'good' });
      score += 2;
    } else {
      results.push({ text: 'Falta la palabra clave o sus términos principales en la Meta Descripción', type: 'bad' });
    }

    // 3. Análisis en el Slug / URL
    const isSlugMatched = targetTokens.length > 0 && targetTokens.some(t => slugNormalized.includes(t));
    if (isSlugMatched) {
      results.push({ text: 'Términos clave presentes en la URL (Slug)', type: 'good' });
      score += 1;
    }

    // 4. Longitud de la Meta Descripción (Yoast Standard: 110 - 160 caracteres)
    if (metaDescription.length >= 110 && metaDescription.length <= 160) {
      results.push({ text: `Longitud de Meta Descripción óptima (${metaDescription.length}/160)`, type: 'good' });
      score += 2;
    } else if (metaDescription.length > 160) {
      results.push({ text: `Meta Descripción muy larga (${metaDescription.length}/160). Google la recortará`, type: 'bad' });
    } else if (metaDescription.length > 0) {
      results.push({ text: `Meta Descripción corta (${metaDescription.length}/160). Ideal: 110-160`, type: 'bad' });
    } else {
      results.push({ text: 'Falta ingresar la Meta Descripción', type: 'bad' });
    }

    const badCount = results.filter(r => r.type === 'bad').length;

    let level: 'Bajo' | 'Aceptable' | 'Excelente' = 'Bajo';
    let badgeClass = 'bg-rose-50 text-rose-600 border border-rose-200';
    let color = 'text-rose-600';

    if (score >= 5 && badCount === 0) {
      level = 'Excelente';
      badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      color = 'text-emerald-600';
    } else if (score >= 3 || (score >= 2 && badCount <= 1)) {
      level = 'Aceptable';
      badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
      color = 'text-amber-600';
    }

    return { level, status: level, color, badgeClass, results };
  };

  const seoAnalysis = getSeoAnalysis();

  return (
    <form 
      action={initialData?.id ? updateBlog : createBlog} 
      onChange={() => setIsDirty(true)}
      onInput={() => setIsDirty(true)}
      className="flex-1 w-full max-w-[1150px] mx-auto px-0 pb-6 select-none font-sans"
    >
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
      
      {/* BARRA CONTEXTUAL FLOTANTE SHOPIFY POLARIS (Alineada al fondo en Mobile y al centro del Topbar en Desktop) */}
      {(isDirty || !initialData?.id) && (
        <div className="fixed bottom-4 left-3 right-3 md:bottom-auto md:top-2 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[60] flex items-center justify-between gap-2 md:gap-8 md:min-w-[620px] bg-[#222222] text-white py-1.5 px-3 md:py-1 md:pr-1 md:pb-1 md:pl-3.5 rounded-xl shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-4 h-4 fill-[#EEEEEE] shrink-0">
              <path d="M8 4a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75"></path>
              <path d="M8 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
              <path fillRule="evenodd" d="M1.5 6.25a4.75 4.75 0 0 1 4.75-4.75h3.5a4.75 4.75 0 0 1 4.75 4.75v2.5a4.75 4.75 0 0 1-4.573 4.747l-1.335 1.714a.75.75 0 0 1-1.189-.007l-1.3-1.706a4.75 4.75 0 0 1-4.603-4.748zm4.75-3.25a3.25 3.25 0 0 0-3.25 3.25v2.5a3.25 3.25 0 0 0 3.25 3.25h.226c.234 0 .455.11.597.296l.934 1.225.96-1.232a.75.75 0 0 1 .591-.289h.192a3.25 3.25 0 0 0 3.25-3.25z"></path>
            </svg>
            <h2 className="text-[11px] md:text-[12px] leading-[16px] font-[450] text-[#EEEEEE] tracking-tight truncate">
              {initialData?.id ? 'Cambios no guardados' : 'Blog no guardado'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              type="button"
              onClick={() => {
                if (initialData?.id) {
                  setIsDirty(false);
                } else {
                  window.location.href = '/blogs';
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

      {/* Header Título de la página estilo Tours */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link href="/blogs" className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors shrink-0" title="Volver a Blogs">
            <BookOpen className="w-4 h-4 text-slate-700 shrink-0" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <h1 className="text-[1rem] font-semibold text-[#303030] tracking-tight truncate">
            {initialData?.id ? initialData.title : 'Agregar blog'}
          </h1>
        </div>

        {/* Acciones de Blog en Modo Edición (Ver blog + Eliminar blog) */}
        {initialData?.id && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a 
              href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${slug || initialData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-semibold text-xs px-3.5 py-1.5 h-auto rounded-lg shadow-2xs transition-all select-none"
              title="Ver blog en la web"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver blog</span>
            </a>

            <Button 
              type="button" 
              disabled={isDeleting}
              onClick={openDeleteModal}
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-semibold text-xs px-3.5 py-1.5 h-auto rounded-lg shadow-2xs transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Eliminar blog</span>
            </Button>
          </div>
        )}
      </div>

      {/* Grid Principal Shopify Admin (70% Contenido / 30% Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ==========================================
            COLUMNA PRINCIPAL (70%): Contenido del Blog
        ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Título */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-slate-700">Título</Label>
              <Input 
                id="title" name="title" required placeholder="Ej. Guía Completa para Visitar la Laguna Humantay" 
                className="text-sm bg-white border-slate-300 focus:border-slate-900 font-medium text-slate-900 rounded-lg"
                value={title} onChange={handleTitleChange}
              />
            </div>

            <input type="hidden" name="slug" value={slug} />
          </div>

          {/* Card 2: Párrafos Dinámicos por Bloques */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-sm text-slate-800">Contenido por Bloques</h3>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{paragraphs.length} bloques</span>
            </div>

            <div className="space-y-4">
              {paragraphs.map((p, index) => (
                <div key={p.id || index} className="relative rounded-xl border border-slate-200/90 p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs text-slate-900">Bloque {index + 1}</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => removeParagraph(p.id)}
                      disabled={paragraphs.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Subtítulo del Bloque (Opcional)</Label>
                      <Input 
                        name={`paragraph_subtitle_${index}`} 
                        defaultValue={p.subtitle || ''}
                        placeholder="Ej. Consejos de aclimatación" 
                        className="bg-white border-slate-300 text-xs h-8"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-10 gap-3 items-stretch">
                      <div className="md:col-span-7 flex flex-col space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Texto del Párrafo *</Label>
                        <textarea 
                          name={`paragraph_content_${index}`}
                          required
                          defaultValue={p.content || ''}
                          className="w-full flex-1 min-h-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 resize-y"
                          placeholder="Escribe el contenido de este bloque..."
                        />
                      </div>
                      <div className="md:col-span-3 flex flex-col space-y-1">
                        <ImageDropzone name={`paragraph_image_${index}`} initialUrl={p.image || ''} folder={`blogs/${slug || 'nuevo'}`} label="Imagen Adjunta" className="h-full flex-1" buttonLayout="vertical" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                type="button" 
                variant="outline" 
                onClick={addParagraph} 
                className="w-full border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-9 font-semibold"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Añadir Bloque de Párrafo
              </Button>
            </div>
          </div>

        </div>

        {/* ==========================================
            COLUMNA SECUNDARIA (30%): Sidebar Shopify
        ========================================== */}
        <div className="space-y-6">
          
          {/* Card 1: Estado (Activo / Desactivado) */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Estado</Label>
            <Select value={status} onValueChange={(v: any) => { setStatus(v); setIsDirty(true); }}>
              <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full text-xs">
                <SelectItem value="Active">Activo</SelectItem>
                <SelectItem value="Draft">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card 2: Imagen Principal del Banner */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
            <h3 className="font-semibold text-xs text-slate-800 border-b border-slate-100 pb-2">Imagen Principal (Banner)</h3>
            <ImageDropzone name="bannerImage" initialUrl={bannerImage} folder={`blogs/${slug || 'nuevo'}`} label="Subir imagen principal" />
          </div>

          {/* Card 3: Panel SEO Inteligente Estilo Yoast */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-semibold text-xs text-slate-800">Optimización SEO</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${seoAnalysis.badgeClass}`}>
                SEO: {seoAnalysis.level}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="keywords" className="text-xs font-semibold text-slate-700">Palabras Clave (Keywords)</Label>
                <AutoResizeTextarea 
                  id="keywords" 
                  name="keywords" 
                  rows={1}
                  placeholder="Ej. Laguna Humantay, Tour Humantay Cusco" 
                  value={keywords} 
                  onChange={(e) => setKeywords(e.target.value)} 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="metaTitle" className="text-xs font-semibold text-slate-700">Meta Título</Label>
                <AutoResizeTextarea 
                  id="metaTitle" 
                  name="metaTitle" 
                  rows={1}
                  placeholder="Título para buscadores..." 
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="metaDescription" className="text-xs font-semibold text-slate-700">Meta Descripción</Label>
                  <span className="text-[10px] text-slate-400">{metaDescription.length}/160</span>
                </div>
                <AutoResizeTextarea 
                  id="metaDescription" 
                  name="metaDescription" 
                  rows={2}
                  placeholder="Descripción corta para Google (110-160 caracteres)..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </div>

              {/* Diagnóstico SEO */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Diagnóstico SEO:</span>
                  <span className={`font-bold ${seoAnalysis.color}`}>{seoAnalysis.status}</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {seoAnalysis.results.map((res, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className={res.type === 'good' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                        {res.type === 'good' ? '✓' : '✗'}
                      </span>
                      <span className={res.type === 'good' ? 'text-slate-700' : 'text-slate-600'}>
                        {res.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ESTILO SHOPIFY POLARIS */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200 select-none">
          <div 
            className={`bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 transition-all duration-200 ${
              isModalAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">¿Eliminar artículo de blog?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente el artículo <span className="font-bold text-slate-900">"{initialData?.title}"</span>? Esta acción quitará la publicación del sitio web y no se podrá deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteBlog}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar blog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
