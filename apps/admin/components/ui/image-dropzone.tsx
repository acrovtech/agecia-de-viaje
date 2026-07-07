'use client';

import { UploadCloud, X, Edit, Settings2, CheckCircle2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';

interface ImageDropzoneProps {
  label?: string;
  name: string;
}

export function ImageDropzone({ label, name }: ImageDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Estados para el panel SEO
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [altText, setAltText] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageDesc, setImageDesc] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const processFile = (file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    // Autofill title from filename (sin la extensión)
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

  const removeImage = () => {
    setFilePreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2 w-full relative">
      {label && <label className="text-sm font-medium leading-none">{label}</label>}
      
      {!filePreview ? (
        <div 
          className={`relative flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/5 hover:border-primary/50 hover:bg-primary/5'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center pb-6 pt-5 pointer-events-none">
            <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="mb-1 text-sm text-muted-foreground text-center px-2">
              <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra tu archivo
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG o WEBP (Max. 5MB)</p>
          </div>
          
          <input 
            ref={inputRef}
            type="file" 
            name={name}
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="relative flex h-48 w-full flex-col items-center justify-center rounded-lg border overflow-hidden group bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={filePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowSeoPanel(true)} className="gap-2 shadow-xl">
              <Settings2 className="w-4 h-4" /> Ajustes SEO
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={removeImage} className="gap-2 shadow-xl text-red-600 hover:text-red-700 hover:bg-red-50">
              <X className="w-4 h-4" /> Eliminar
            </Button>
          </div>

          {/* Indicador visual si ya tiene alt text */}
          {altText && (
            <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3" /> SEO Ok
            </div>
          )}
        </div>
      )}

      {/* Inputs ocultos para enviar la data SEO con el formulario */}
      <input type="hidden" name={`${name}_alt`} value={altText} />
      <input type="hidden" name={`${name}_title`} value={imageTitle} />
      <input type="hidden" name={`${name}_description`} value={imageDesc} />

      {/* Modal / Panel de Ajustes SEO (Estilo WordPress Media Library) */}
      {showSeoPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Detalles del adjunto</h3>
                <p className="text-xs text-muted-foreground">Optimiza la metadata de tu imagen para Google Images.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowSeoPanel(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Preview (Left) */}
              <div className="flex flex-col gap-3">
                <div className="rounded-lg overflow-hidden border bg-muted/20 aspect-square flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={filePreview!} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Archivo original:</strong> {imageTitle}.jpg</p>
                  <p><strong>Dimensiones:</strong> Escalado automático</p>
                </div>
              </div>

              {/* Form Fields (Right) */}
              <div className="space-y-5">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Texto Alternativo (Alt Text) <span className="text-red-500">*</span></Label>
                  <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Ej. Turistas bañándose en Termales de Yura" />
                  <p className="text-[10px] text-muted-foreground leading-tight">Describe el propósito de la imagen. Déjalo vacío si la imagen es puramente decorativa. Fundamental para SEO y accesibilidad.</p>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Título</Label>
                  <Input value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} placeholder="Título interno de la imagen" />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Descripción</Label>
                  <textarea 
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={imageDesc} 
                    onChange={(e) => setImageDesc(e.target.value)} 
                    placeholder="Opcional. Descripción detallada del archivo adjunto..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowSeoPanel(false)}>Cancelar</Button>
              <Button type="button" onClick={() => setShowSeoPanel(false)} className="px-8 font-bold">Guardar Cambios</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
