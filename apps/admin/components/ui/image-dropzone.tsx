'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Settings2, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageDropzoneProps {
  label?: string;
  labelPosition?: 'top' | 'bottom';
  name: string;
  className?: string;
  initialUrl?: string;
  folder?: string;
}

export function ImageDropzone({ label, labelPosition = 'top', name, className, initialUrl, folder }: ImageDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const isValidInitialUrl = Boolean(
    initialUrl && 
    typeof initialUrl === 'string' && 
    initialUrl.trim() !== '' && 
    !initialUrl.includes('default-') && 
    (initialUrl.startsWith('http') || initialUrl.startsWith('/uploads') || initialUrl.startsWith('data:image') || initialUrl.startsWith('/salkantay') || initialUrl.startsWith('/blogs') || initialUrl.startsWith('/tours'))
  );
  const [filePreview, setFilePreview] = useState<string | null>(isValidInitialUrl ? (initialUrl || null) : null);
  
  // Estados para el panel SEO
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [altText, setAltText] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageDesc, setImageDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar initialUrl si cambia dinámicamente
  useEffect(() => {
    if (isValidInitialUrl && initialUrl) {
      setFilePreview(initialUrl);
    }
  }, [initialUrl, isValidInitialUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    const tempUrl = URL.createObjectURL(file);
    setFilePreview(tempUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFilePreview(data.url);
      }
    } catch (e) {
      console.error("Error al subir la imagen a R2:", e);
    } finally {
      setIsUploading(false);
    }

    if (!imageTitle) {
      setImageTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const confirmRemoveImage = () => {
    setFilePreview(null);
    if (inputRef.current) inputRef.current.value = '';
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`flex flex-col flex-1 gap-1.5 w-full relative select-none ${className || ''}`}>
      {label && labelPosition === 'top' && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      
      <div className="flex-1 min-h-[130px] h-full w-full relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50/60 shadow-2xs group">
        {!filePreview ? (
          <div 
            className={`absolute inset-0 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-all duration-200 rounded-lg ${
              dragActive ? 'border-slate-900 bg-slate-100' : 'border-slate-300/80 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center py-3 px-2 pointer-events-none">
              <UploadCloud className="mb-1.5 h-5 w-5 text-slate-400" />
              <p className="text-[10px] text-slate-500 text-center font-normal">
                <span className="font-semibold text-slate-700">Haz clic o arrastra</span>
              </p>
            </div>
            
            <input 
              ref={inputRef}
              type="file" 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleChange}
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={filePreview} 
              alt="Preview" 
              onError={() => setFilePreview(null)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />

            {/* Spinner de carga durante subida a R2 */}
            {isUploading && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-2 text-white text-xs font-semibold z-20 animate-in fade-in duration-200">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Subiendo a R2...</span>
              </div>
            )}
            
            {/* Overlay animado de acciones (Ajustes SEO + Eliminar con confirmación) */}
            {!isUploading && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 z-10 p-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowSeoPanel(true)} 
                  className="gap-1.5 shadow-lg text-[11px] font-semibold h-8 bg-white/95 text-slate-800 hover:bg-white transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 rounded-[0.375rem]"
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ajustes SEO</span>
                </Button>
                
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="gap-1.5 shadow-lg text-[11px] font-semibold h-8 bg-rose-500 text-white hover:bg-rose-600 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 rounded-[0.375rem]"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                  <span>Eliminar</span>
                </Button>
              </div>
            )}

            {altText && (
              <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-md z-10">
                <CheckCircle2 className="w-3 h-3" /> SEO Ok
              </div>
            )}
          </div>
        )}
      </div>

      {label && labelPosition === 'bottom' && (
        <label className="text-[11px] font-medium text-slate-500 text-center block mt-0.5">{label}</label>
      )}

      {/* Inputs ocultos para enviar la URL y data SEO con el formulario */}
      <input type="hidden" name={name} value={filePreview || ''} />
      <input type="hidden" name={`${name}_alt`} value={altText} />
      <input type="hidden" name={`${name}_title`} value={imageTitle} />
      <input type="hidden" name={`${name}_description`} value={imageDesc} />

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">¿Eliminar esta imagen?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Se quitará del formulario. ¿Deseas continuar?</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)} 
                className="text-xs h-8 font-semibold rounded-[0.375rem]"
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={confirmRemoveImage} 
                className="text-xs h-8 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-[0.375rem]"
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Panel de Ajustes SEO (Estilo WordPress Media Library) */}
      {showSeoPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Detalles del adjunto</h3>
                <p className="text-xs text-slate-500">Optimiza la metadata de tu imagen para Google Images.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowSeoPanel(false)} className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Preview (Left) */}
              <div className="flex flex-col gap-3">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={filePreview!} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p><strong>Archivo:</strong> {imageTitle || 'imagen'}.webp</p>
                  <p><strong>Optimización:</strong> Escalado automático R2</p>
                </div>
              </div>

              {/* Form Fields (Right) */}
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Texto Alternativo (Alt Text) <span className="text-rose-500">*</span></Label>
                  <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Ej. Turistas en Laguna Humantay" className="text-xs h-8 bg-white border-slate-300" />
                  <p className="text-[10px] text-slate-400 leading-tight">Describe la imagen para SEO en Google Images.</p>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Título</Label>
                  <Input value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} placeholder="Título interno" className="text-xs h-8 bg-white border-slate-300" />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Descripción</Label>
                  <textarea 
                    rows={3}
                    className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
                    value={imageDesc} 
                    onChange={(e) => setImageDesc(e.target.value)} 
                    placeholder="Descripción adicional opcional..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSeoPanel(false)} className="text-xs h-8 font-semibold rounded-[0.375rem]">Cancelar</Button>
              <Button type="button" onClick={() => setShowSeoPanel(false)} className="px-6 text-xs h-8 font-bold bg-slate-900 text-white hover:bg-black rounded-[0.375rem]">Guardar Cambios</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
