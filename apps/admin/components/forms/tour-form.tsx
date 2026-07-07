'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createTour } from '../../app/actions/tour';

type Category = {
  id: string;
  name: string;
};

export function TourForm({ categories }: { categories: Category[] }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [groupSize, setGroupSize] = useState(12);
  const [itinerary, setItinerary] = useState([{ id: Date.now(), title: '', content: '' }]);
  const [faqs, setFaqs] = useState([{ id: Date.now(), question: '', answer: '' }]);
  const [description, setDescription] = useState('');
  const [focusKeyphrase, setFocusKeyphrase] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const tabOrder = ['info', 'details', 'itinerary', 'media', 'publish'];

  // TODO: Recibir de los props si el tour ya está publicado o es edición
  const isPublished = false;

  // Analítica estilo RankMath (múltiples keywords)
  const getSeoAnalysis = () => {
    if (!focusKeyphrase) return { status: 'Sin frase clave', color: 'text-muted-foreground', results: [] };
    const results = [];
    let score = 0;
    
    const keywords = focusKeyphrase.split(',').map(k => k.toLowerCase().trim()).filter(k => k.length > 0);
    if (keywords.length === 0) return { status: 'Sin frase clave', color: 'text-muted-foreground', results: [] };

    const primaryKeyword = keywords[0];

    if (title.toLowerCase().includes(primaryKeyword)) { results.push({ text: 'Palabra clave principal en el Título', type: 'good' }); score++; }
    else { results.push({ text: 'Falta la palabra clave principal en el Título del tour', type: 'bad' }); }

    if (metaDescription.toLowerCase().includes(primaryKeyword)) { results.push({ text: 'Palabra clave principal en la Meta Descripción', type: 'good' }); score++; }
    else { results.push({ text: 'Falta la palabra clave principal en la Meta Descripción', type: 'bad' }); }

    if (keywords.length > 1) { results.push({ text: `Optimizando para ${keywords.length} palabras clave diferentes`, type: 'good' }); score++; }

    if (metaDescription.length >= 120 && metaDescription.length <= 160) { results.push({ text: 'Longitud de la Meta Descripción: ¡Excelente!', type: 'good' }); score++; }
    else { results.push({ text: 'Longitud de la descripción: Trata de mantenerla entre 120 y 160 caracteres', type: 'bad' }); }

    let status = score >= 3 ? 'Bueno' : score >= 2 ? 'Aceptable' : 'Por mejorar';
    let color = score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-destructive';
    return { status, color, results };
  };

  const getReadabilityAnalysis = () => {
    const allText = description;
    if (allText.trim().length === 0) return { status: 'Sin contenido', color: 'text-muted-foreground', results: [] };
    
    const results = [];
    let score = 0;
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = allText.split(/\s+/).filter(w => w.trim().length > 0);

    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20).length;
    if ((longSentences / Math.max(sentences.length, 1)) < 0.25) { results.push({ text: 'Longitud de las oraciones: ¡Genial!', type: 'good' }); score++; }
    else { results.push({ text: 'Demasiadas oraciones largas. Intenta acortarlas.', type: 'bad' }); }

    const longWords = words.filter(w => w.length > 10).length;
    if (longWords < words.length * 0.2) { results.push({ text: 'Complejidad: Vocabulario adecuado para audiencia general', type: 'good' }); score++; }
    else { results.push({ text: 'Vocabulario complejo. Usa palabras más sencillas.', type: 'bad' }); }

    if (words.length > 50) { results.push({ text: 'Cantidad de texto en la descripción: Suficiente', type: 'good' }); score++; }
    else { results.push({ text: 'Poco texto. Añade más detalles a la descripción.', type: 'bad' }); }

    let status = score >= 3 ? 'Óptimo' : score >= 2 ? 'Aceptable' : 'Por mejorar';
    let color = score >= 3 ? 'text-green-600' : score >= 2 ? 'text-yellow-600' : 'text-destructive';
    return { status, color, results };
  };

  const seoAnalysis = getSeoAnalysis();
  const readabilityAnalysis = getReadabilityAnalysis();

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

  const addItineraryDay = () => setItinerary([...itinerary, { id: Date.now(), title: '', content: '' }]);
  const removeItineraryDay = (idToRemove: number) => setItinerary(itinerary.filter((d) => d.id !== idToRemove));

  const addFaq = () => setFaqs([...faqs, { id: Date.now(), question: '', answer: '' }]);
  const removeFaq = (idToRemove: number) => setFaqs(faqs.filter((d) => d.id !== idToRemove));

  return (
    <form action={createTour} className="flex-1 w-full pb-20 lg:pb-0">
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navegación de Tabs */}
        <div className="mb-8">
          <TabsList className="flex w-full justify-start h-auto bg-transparent p-0 gap-2 md:gap-4 rounded-none border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsTrigger value="info" className="py-3 px-2 -mb-[1px] text-sm md:text-base rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent aria-selected:border-b-primary aria-selected:text-primary bg-transparent aria-selected:bg-transparent shadow-none aria-selected:shadow-none whitespace-nowrap">
              <span className="lg:hidden">{activeTab === 'info' ? '1. Info General' : '1'}</span>
              <span className="hidden lg:inline">1. Info General</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="py-3 px-2 -mb-[1px] text-sm md:text-base rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent aria-selected:border-b-primary aria-selected:text-primary bg-transparent aria-selected:bg-transparent shadow-none aria-selected:shadow-none whitespace-nowrap">
              <span className="lg:hidden">{activeTab === 'details' ? '2. Detalles' : '2'}</span>
              <span className="hidden lg:inline">2. Detalles</span>
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="py-3 px-2 -mb-[1px] text-sm md:text-base rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent aria-selected:border-b-primary aria-selected:text-primary bg-transparent aria-selected:bg-transparent shadow-none aria-selected:shadow-none whitespace-nowrap">
              <span className="lg:hidden">{activeTab === 'itinerary' ? '3. Itin. y FAQs' : '3'}</span>
              <span className="hidden lg:inline">3. Itin. y FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="py-3 px-2 -mb-[1px] text-sm md:text-base rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent aria-selected:border-b-primary aria-selected:text-primary bg-transparent aria-selected:bg-transparent shadow-none aria-selected:shadow-none whitespace-nowrap">
              <span className="lg:hidden">{activeTab === 'media' ? '4. Medios' : '4'}</span>
              <span className="hidden lg:inline">4. Medios</span>
            </TabsTrigger>
            <TabsTrigger value="publish" className="py-3 px-2 -mb-[1px] text-sm md:text-base rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent aria-selected:border-b-primary aria-selected:text-primary bg-transparent aria-selected:bg-transparent shadow-none aria-selected:shadow-none whitespace-nowrap">
              <span className="lg:hidden">{activeTab === 'publish' ? '5. Publicación' : '5'}</span>
              <span className="hidden lg:inline">5. Publicación</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =======================
            TAB 1: INFO GENERAL (2 Columnas 70/30)
        ======================== */}
        <div hidden={activeTab !== 'info'} className="focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-8 items-start">
            
            {/* Columna Izquierda (70%) */}
            <div className="grid auto-rows-max gap-6 lg:col-span-2">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
                <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Información Básica</h3>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-sm font-semibold">Título del Tour</Label>
                    <Input 
                      id="title" name="title" required placeholder="Ej. Tour Valle Sagrado Vip" 
                      className="text-base bg-muted/30"
                      value={title} onChange={handleTitleChange}
                    />
                  </div>
                  <div className="grid gap-3 pt-2">
                    <Label htmlFor="description" className="text-sm font-semibold">Descripción General</Label>
                    <textarea id="description" name="description" rows={6} className="flex w-full rounded-md border border-input bg-muted/30 px-3 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Escribe la descripción atractiva del tour..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                  </div>
                </div>
              </div>

              {/* Ficha Técnica */}
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
                <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Ficha Técnica</h3>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="duration" className="text-sm font-semibold">Duración</Label>
                    <Input id="duration" name="duration" placeholder="Ej. 1 Día" className="bg-muted/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="difficulty" className="text-sm font-semibold">Dificultad</Label>
                    <Select name="difficulty">
                      <SelectTrigger className="w-full h-9 bg-muted/30">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full">
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Moderado">Moderado</SelectItem>
                        <SelectItem value="Desafiante">Desafiante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="region" className="text-sm font-semibold">Región (Destino)</Label>
                    <Select name="region">
                      <SelectTrigger className="w-full h-9 bg-muted/30">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full">
                        <SelectItem value="CUSCO">Cusco</SelectItem>
                        <SelectItem value="AREQUIPA">Arequipa</SelectItem>
                        <SelectItem value="LIMA">Lima</SelectItem>
                        <SelectItem value="ICA">Ica</SelectItem>
                        <SelectItem value="PUNO">Puno</SelectItem>
                        <SelectItem value="MADRE DE DIOS">Madre de Dios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="menuGroup" className="text-sm font-semibold">Grupo de Menú</Label>
                    <Select name="menuGroup">
                      <SelectTrigger className="w-full h-9 bg-muted/30">
                        <SelectValue placeholder="Opcional..." />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="w-[--anchor-width] min-w-full">
                        <SelectItem value="none">No mostrar en Menú</SelectItem>
                        <SelectItem value="FULL DAY">Full Day</SelectItem>
                        <SelectItem value="MEDIO DÍA">Medio Día</SelectItem>
                        <SelectItem value="PAQUETES">Paquetes</SelectItem>
                        <SelectItem value="AVENTURA">Aventura</SelectItem>
                        <SelectItem value="CAMINATAS">Caminatas</SelectItem>
                        <SelectItem value="LIMA-CUSCO">Lima-Cusco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="altitude" className="text-sm font-semibold">Altitud</Label>
                    <Input id="altitude" name="altitude" placeholder="3800 msnm" className="bg-muted/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="groupSize" className="text-sm font-semibold">Grupo (Pax)</Label>
                    <Input id="groupSize" name="groupSize" type="number" min="1" value={groupSize} onChange={handleGroupSizeChange} placeholder="12" className="bg-muted/30" />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha (30%) */}
            <div className="grid auto-rows-max gap-6">
              {/* Categorías */}
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 md:p-6">
                <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Categorías</h3>
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay categorías en la BD.</p>
                  ) : (
                    categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors">
                        <input type="checkbox" id={`cat_${cat.id}`} name="categories" value={cat.id} className="h-4 w-4 rounded border-gray-300 text-primary" />
                        <Label htmlFor={`cat_${cat.id}`} className="font-medium cursor-pointer flex-1">{cat.name}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Gestión de Precios */}
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 md:p-6">
                <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Gestión de Precios</h3>
                
                {/* Servicio Compartido */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Label className="font-semibold text-sm">Servicio Compartido</Label>
                  </div>
                  <div className="grid gap-2">
                    <Input id="sharedPrice" name="sharedPrice" type="number" step="0.01" placeholder="Precio (USD)" className="bg-muted/30 h-9" />
                  </div>
                </div>

                <hr className="border-dashed my-6 border-muted-foreground/30" />

                {/* Servicio Privado */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Label className="font-semibold text-sm">Servicio Privado</Label>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                      {Array.from({ length: groupSize }).map((_, i) => (
                        <Input key={i} name={`privatePrice_${i + 1}`} type="number" step="0.01" placeholder={`${i + 1} Pax $`} className="text-center bg-muted/30 text-xs px-1 h-8" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* =======================
            TAB 2: DETALLES
        ======================== */}
        <div hidden={activeTab !== 'details'} className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
            <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Inclusiones y Exclusiones</h3>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="inclusions" className="text-base font-semibold text-green-700">Incluye</Label>
                <textarea id="inclusions" name="inclusions" rows={6} className="flex w-full rounded-md border border-green-200 bg-green-50/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2" placeholder="- Transporte turístico&#10;- Guía profesional..."></textarea>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="exclusions" className="text-base font-semibold text-red-700">No Incluye</Label>
                <textarea id="exclusions" name="exclusions" rows={6} className="flex w-full rounded-md border border-red-200 bg-red-50/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2" placeholder="- Propinas&#10;- Alimentación no mencionada..."></textarea>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
            <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Recomendaciones</h3>
            <textarea id="recommendations" name="recommendations" rows={4} className="flex w-full rounded-md border border-input bg-muted/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="- Llevar bloqueador&#10;- Dinero extra..."></textarea>
          </div>

        </div>

        {/* =======================
            TAB 3: ITINERARIO
        ======================== */}
        <div hidden={activeTab !== 'itinerary'} className="focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Columna Izquierda: Itinerario */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
              <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Itinerario Detallado</h3>
              <div className="grid gap-6">
                <input type="hidden" name="itineraryCount" value={itinerary.length} />
                
                {itinerary.map((day, index) => (
                  <div key={day.id} className="rounded-lg border p-5 bg-muted/10">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-primary">Día {index + 1}: Título</Label>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive -mr-2 -mt-2" onClick={() => removeItineraryDay(day.id)} disabled={itinerary.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input name={`itinerary_title_${index}`} placeholder="Ej. Llegada a Cusco y City Tour" required className="bg-background" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Actividades</Label>
                        <textarea name={`itinerary_content_${index}`} required rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Describa las actividades de este día..."/>
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addItineraryDay} className="w-full border-dashed border-2 py-4 mt-2">
                  <Plus className="mr-2 h-5 w-5" /> Añadir Día
                </Button>
              </div>
            </div>

            {/* Columna Derecha: FAQs */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
              <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Preguntas Frecuentes (FAQs)</h3>
              <div className="grid gap-6">
                <input type="hidden" name="faqsCount" value={faqs.length} />
                
                {faqs.map((faq, index) => (
                  <div key={faq.id} className="rounded-lg border p-5 bg-muted/10">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-primary">Pregunta {index + 1}</Label>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive -mr-2 -mt-2" onClick={() => removeFaq(faq.id)} disabled={faqs.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input name={`faq_question_${index}`} placeholder="Ej. ¿Hay oxígeno en el bus?" required className="bg-background" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Respuesta</Label>
                        <textarea name={`faq_answer_${index}`} required rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Sí, contamos con un balón de oxígeno..."/>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFaq} className="w-full border-dashed border-2 py-4 mt-2">
                  <Plus className="mr-2 h-5 w-5" /> Añadir FAQ
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* =======================
            TAB 4: MEDIOS
        ======================== */}
        <div hidden={activeTab !== 'media'} className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Columna Izquierda (Ocupa 2 espacios): Imágenes Clave */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 xl:col-span-2">
              <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Imágenes Clave</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <ImageDropzone name="bannerImage" label="Banner Principal (Horizontal)" />
                <ImageDropzone name="cardImage" label="Miniatura / Card (Cuadrada)" />
              </div>
            </div>
            
            {/* Columna Derecha (Ocupa 1 espacio): Mapa */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 xl:col-span-1">
              <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Mapa</h3>
              <div className="grid gap-6 h-full">
                <ImageDropzone name="mapImage" label="Subir imagen del mapa" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
            <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">Galería del Tour</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              <ImageDropzone name="galleryImage_1" label="Foto 1" />
              <ImageDropzone name="galleryImage_2" label="Foto 2" />
              <ImageDropzone name="galleryImage_3" label="Foto 3" />
              <ImageDropzone name="galleryImage_4" label="Foto 4" />
            </div>
          </div>

        </div>

        {/* =======================
            TAB 5: PUBLICACIÓN
        ======================== */}
        <div hidden={activeTab !== 'publish'} className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SEO & Meta (70%) */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8 lg:col-span-2 flex flex-col h-full">
              <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3 text-foreground">SEO (Search Engine Optimization)</h3>
              
              {/* Campos Ocultos Generados Automáticamente */}
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="metaTitle" value={`${title} - Incabound`} />

              <div className="grid gap-6">
                
                <div className="grid gap-2">
                  <Label htmlFor="focusKeyphrase" className="font-semibold text-primary">Palabras clave objetivo (separa con comas)</Label>
                  <Input id="focusKeyphrase" placeholder="Ej. Tour Termales de Arequipa, Baños termales Yura" className="bg-muted/30 border-primary/30" value={focusKeyphrase} onChange={(e) => setFocusKeyphrase(e.target.value)} />
                  <span className="text-xs text-muted-foreground">Escribe una o varias palabras clave por las que quieres posicionar este tour (estilo RankMath).</span>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="metaDescription" className="font-semibold">Meta Descripción</Label>
                    <span className="text-xs text-muted-foreground">{metaDescription.length}/160</span>
                  </div>
                  <textarea id="metaDescription" name="metaDescription" rows={4} className="flex w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Descripción corta para los buscadores..." value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                </div>

                {/* Resultados del Análisis SEO */}
                {focusKeyphrase && (
                  <div className="mt-4 border rounded-lg overflow-hidden bg-muted/5">
                    <div className="px-4 py-3 border-b bg-muted/10 font-semibold text-sm flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${seoAnalysis.color.replace('text-', 'bg-')}`}></span>
                      Análisis SEO: {focusKeyphrase}
                    </div>
                    <div className="p-4 space-y-3">
                      {seoAnalysis.results.map((res, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${res.type === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-muted-foreground">{res.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Resultados de Legibilidad */}
                <div className="mt-2 border rounded-lg overflow-hidden bg-muted/5">
                  <div className="px-4 py-3 border-b bg-muted/10 font-semibold text-sm flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${readabilityAnalysis.color.replace('text-', 'bg-')}`}></span>
                    Análisis de Legibilidad (Descripción General)
                  </div>
                  <div className="p-4 space-y-3">
                    {readabilityAnalysis.results.map((res, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${res.type === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-muted-foreground">{res.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Gestión de Publicado (30%) */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm lg:col-span-1 overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b bg-muted/10">
                <h3 className="font-bold text-lg tracking-tight text-foreground">Gestión de Publicado</h3>
              </div>
              
              <div className="p-6 space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Estatus:</span>
                  <span className="font-semibold flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {isPublished ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Fecha de pub.:</span>
                  <span className="font-semibold">{isPublished ? '12 Oct 2026' : 'Inmediatamente'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Analítica SEO:</span>
                  <span className={`font-semibold ${seoAnalysis.color}`}>{seoAnalysis.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Legibilidad:</span>
                  <span className={`font-semibold ${readabilityAnalysis.color}`}>{readabilityAnalysis.status}</span>
                </div>
              </div>
              
              <div className="p-6 border-t bg-muted/5 grid gap-3 mt-auto">
                {isPublished ? (
                  <>
                    <Button type="submit" className="w-full font-bold shadow-sm">
                      Actualizar
                    </Button>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <Button type="button" variant="outline" className="w-full">
                        Ver página
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                        Eliminar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="submit" className="w-full font-bold shadow-sm">
                      Publicar
                    </Button>
                    <Button type="button" variant="outline" className="w-full bg-background">
                      Borrador
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </Tabs>

      {/* Navegación Móvil (Wizard) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] lg:hidden flex justify-between gap-4 z-40">
        {activeTab === 'info' ? (
          <Button type="button" variant="outline" className="flex-1 font-bold shadow-sm" onClick={() => window.history.back()}>Cancelar</Button>
        ) : (
          <Button type="button" variant="outline" className="flex-1 font-bold shadow-sm" onClick={() => {
            const idx = tabOrder.indexOf(activeTab);
            if (idx > 0) {
              setActiveTab(tabOrder[idx - 1]);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}>Atrás</Button>
        )}

        {activeTab !== 'publish' ? (
          <Button type="button" className="flex-1 font-bold shadow-sm" onClick={() => {
            const idx = tabOrder.indexOf(activeTab);
            if (idx < tabOrder.length - 1) {
              setActiveTab(tabOrder[idx + 1]);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}>Siguiente</Button>
        ) : (
          <Button type="submit" className="flex-1 font-bold shadow-sm">Publicar</Button>
        )}
      </div>

    </form>
  );
}
