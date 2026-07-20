'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { createBlog } from '../../actions/blog';
import { ImageDropzone } from '@/components/ui/image-dropzone';

export default function NewBlogPage() {
  const [isPending, startTransition] = useTransition();
  const [paragraphs, setParagraphs] = useState([{ id: Date.now() }]);
  const [title, setTitle] = useState('');

  // Auto-generar slug a partir del título
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  const addParagraph = () => {
    setParagraphs([...paragraphs, { id: Date.now() }]);
  };

  const removeParagraph = (idToRemove: number) => {
    setParagraphs(paragraphs.filter(p => p.id !== idToRemove));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const paragraphsData = paragraphs.map((p, index) => {
      return {
        order: index,
        subtitle: (formData.get(`paragraph_subtitle_${index}`) as string) || null,
        content: formData.get(`paragraph_content_${index}`) as string,
        image: (formData.get(`paragraph_image_${index}`) as string) || null
      };
    });

    formData.set('paragraphsJSON', JSON.stringify(paragraphsData));

    startTransition(async () => {
      await createBlog(formData);
    });
  };

  return (
    <main className="flex flex-1 flex-col gap-4">
      <form onSubmit={handleSubmit} className="grid flex-1 auto-rows-max gap-4 w-full">
        {/* Layout WP-Style: 2 Columnas */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-8 items-start">
          
          {/* ====== COLUMNA IZQUIERDA (CONTENIDO PRINCIPAL) ====== */}
          <div className="grid auto-rows-max gap-4 lg:col-span-2 lg:gap-8">
            
            {/* Detalles Principales */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-lg">Título del Artículo</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    required 
                    placeholder="Ej. Los mejores lugares de Cusco" 
                    className="text-lg py-6"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                {/* El slug ahora se genera y envía de forma oculta */}
                <input type="hidden" name="slug" value={slug} />
                {title && (
                  <p className="text-sm text-muted-foreground">
                    URL generada: <span className="text-primary font-mono bg-muted px-1 py-0.5 rounded">/blog/{slug}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Párrafos Dinámicos */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5 pb-4 border-b mb-4">
                <h3 className="font-semibold leading-none tracking-tight">Contenido por Bloques</h3>
                <p className="text-sm text-muted-foreground">Agrega párrafos y opcionalmente imágenes para estructurar tu artículo.</p>
              </div>
              <div className="grid gap-6">
                
                {/* Input oculto para saber cuántos hay */}
                <input type="hidden" name="paragraphsCount" value={paragraphs.length} />

                {paragraphs.map((p, index) => (
                  <div key={p.id} className="relative rounded-lg border p-4 bg-muted/20">
                    <div className="absolute right-2 top-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeParagraph(p.id)}
                        disabled={paragraphs.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Label className="font-semibold text-primary mb-3 block">Bloque {index + 1}</Label>
                    
                    <div className="grid gap-4 mt-2">
                      <div className="grid gap-2">
                        <Label>Subtítulo del Bloque (Opcional)</Label>
                        <Input 
                          name={`paragraph_subtitle_${index}`} 
                          placeholder="Ej. Descubriendo la magia escondida" 
                        />
                      </div>
                      <div className="grid grid-cols-10 gap-4">
                        <div className="col-span-7 grid gap-2 h-full flex-col">
                          <Label>Texto del Párrafo *</Label>
                          <textarea 
                            name={`paragraph_content_${index}`}
                            required
                            className="flex-1 w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                            placeholder="Escribe el contenido aquí..."
                          />
                        </div>
                        <div className="col-span-3 grid gap-2 h-full">
                          <ImageDropzone name={`paragraph_image_${index}`} label="Imagen Adjunta (Opcional)" className="h-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="secondary" onClick={addParagraph} className="w-full border-dashed border-2 bg-transparent hover:bg-muted">
                  <Plus className="mr-2 h-4 w-4" /> Añadir Párrafo
                </Button>

              </div>
            </div>

          </div>

          {/* ====== COLUMNA DERECHA (SIDEBAR CMS) ====== */}
          <div className="grid auto-rows-max gap-4 lg:gap-6">
            
            {/* Acciones de Publicación */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5 pb-4">
                <h3 className="font-semibold leading-none tracking-tight">Publicar</h3>
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isPending} className="w-full font-bold">
                  {isPending ? 'Publicando...' : 'Publicar Artículo'}
                </Button>
                <Button type="button" variant="outline" className="w-full">Guardar Borrador</Button>
              </div>
            </div>

            {/* Imagen Principal */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5 pb-4 border-b mb-4">
                <h3 className="font-semibold leading-none tracking-tight">Imagen Principal</h3>
              </div>
              <ImageDropzone name="bannerImage" label="Banner del Artículo" />
            </div>

            {/* SEO Section */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-col space-y-1.5 pb-4 border-b mb-4">
                <h3 className="font-semibold leading-none tracking-tight">SEO & Meta</h3>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="metaTitle" className="text-xs">Meta Título</Label>
                  <Input id="metaTitle" name="metaTitle" placeholder="Mejores Lugares..." className="h-8" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="metaDescription" className="text-xs">Meta Descripción</Label>
                  <textarea 
                    id="metaDescription" 
                    name="metaDescription" 
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Breve resumen para Google..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="keywords" className="text-xs">Palabras Clave (Keywords)</Label>
                  <Input id="keywords" name="keywords" placeholder="cusco, viaje, blog, turismo" className="h-8 text-xs" />
                  <p className="text-[10px] text-muted-foreground">Separadas por comas. Muy importante para el SEO.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </main>
  );
}
