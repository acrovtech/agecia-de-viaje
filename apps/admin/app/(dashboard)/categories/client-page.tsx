'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Search, Tags, Tag } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '../../actions/category';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export function CategoryClientPage({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCat) {
      setSlug(
        val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '')
      );
    }
  };

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setSlug(cat.slug);
    } else {
      setEditingCat(null);
      setName('');
      setSlug('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCat) {
        const res = await updateCategory(editingCat.id, name, slug);
        if (res.success && res.category) {
          setCategories(categories.map(c => c.id === editingCat.id ? res.category : c));
          setIsModalOpen(false);
        } else {
          alert(res.error);
        }
      } else {
        const res = await createCategory(name, slug);
        if (res.success && res.category) {
          setCategories([res.category, ...categories]);
          setIsModalOpen(false);
        } else {
          alert(res.error);
        }
      }
    } catch (err) {
      alert("Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar esta categoría? Esto podría afectar a los tours enlazados.")) {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories(categories.filter(c => c.id !== id));
        setSelectedIds(prev => prev.filter(i => i !== id));
      } else {
        alert(res.error);
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredCategories.length > 0 && filteredCategories.every(c => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCategories.map(c => c.id));
    }
  };

  const toggleSelectCat = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Deseas eliminar las ${selectedIds.length} categorías seleccionadas?`)) {
      for (const id of selectedIds) {
        await deleteCategory(id);
      }
      setCategories(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      
      {/* 1. Header Estilo Shopify Admin Products Page */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f]">Categorías</h1>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar categoría</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda Principal */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 flex items-center text-xs">
        <div className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar categorías por nombre o slug..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <p className="font-semibold text-slate-600">No hay categorías registradas.</p>
          <p className="text-xs text-slate-400 mt-1">Haz clic en "Agregar categoría" para crear la primera.</p>
        </div>
      ) : (
        /* VISTA TABLA COMPLETA SHOPIFY POLARIS */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-12" />
                <col className="w-auto" />
                <col className="w-48" />
                <col className="w-44" />
                <col className="w-28" />
              </colgroup>
              <thead>
                {selectedIds.length > 0 ? (
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[#2f2f2f] text-xs font-medium animate-in fade-in duration-150">
                    <th colSpan={5} className="px-4 py-2.5">
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-900">{selectedIds.length} seleccionadas</span>
                        <div className="h-4 w-[1px] bg-slate-300" />
                        <button
                          onClick={handleBulkDelete}
                          className="text-red-600 hover:text-red-700 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar seleccionadas
                        </button>
                      </div>
                    </th>
                  </tr>
                ) : (
                  <tr className="bg-[#F7F7F7] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3 text-center">
                      <input 
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Nombre de Categoría</th>
                    <th className="px-4 py-3">Slug (URL)</th>
                    <th className="px-4 py-3">Fecha de Creación</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedIds.includes(cat.id);
                  return (
                    <tr 
                      key={cat.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCat(cat.id)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#2f2f2f] truncate">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                          /{cat.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {format(new Date(cat.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(cat)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Editar categoría"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / CREAR CATEGORÍA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#2f2f2f]">
              {editingCat ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-[#2f2f2f]">Nombre *</Label>
              <Input 
                id="name" 
                placeholder="Ej. Turismo de Aventura" 
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-semibold text-[#2f2f2f]">Slug (URL) *</Label>
              <Input 
                id="slug" 
                placeholder="turismo-de-aventura" 
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                required
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">Identificador amigable que aparecerá en la URL.</p>
            </div>
            
            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#008060] hover:bg-[#006e52] text-white font-semibold text-xs">
                {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
              </Button>
            </DialogFooter>
          </form>

        </DialogContent>
      </Dialog>

    </div>
  );
}
