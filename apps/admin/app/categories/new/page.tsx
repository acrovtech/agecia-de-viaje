'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCategory } from '../../actions/category';

export default function NewCategoryPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(
      newName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  return (
    <main className="flex flex-1 flex-col gap-4">
      <div className="max-w-2xl w-full mx-auto">
        <form action={createCategory} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 md:p-8">
          <h3 className="font-bold text-lg tracking-tight mb-6 border-b pb-3">Crear Nueva Categoría</h3>
          
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-semibold">Nombre de la Categoría</Label>
              <Input 
                id="name" name="name" required placeholder="Ej. Aventura" 
                className="bg-muted/30"
                value={name} onChange={handleNameChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug" className="text-sm font-semibold">Slug (URL amigable)</Label>
              <Input 
                id="slug" name="slug" required placeholder="ej-aventura" 
                className="bg-muted/30"
                value={slug} onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/categories">Cancelar</Link>
            </Button>
            <Button type="submit">Guardar Categoría</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
