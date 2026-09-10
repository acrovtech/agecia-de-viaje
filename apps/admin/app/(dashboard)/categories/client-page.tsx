'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Search, Tags, Tag } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '../../actions/category';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/confirm-modal';
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

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    id?: string;
    name?: string;
    count?: number;
  }>({ isOpen: false, type: 'bulk' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-generate slug function
  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
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
    const cleanName = name.trim();
    const cleanSlug = (slug || generateSlug(cleanName)).trim();
    if (!cleanName || !cleanSlug) return;

    setIsSubmitting(true);
    try {
      if (editingCat) {
        const res = await updateCategory(editingCat.id, cleanName, cleanSlug);
        if (res.success && res.category) {
          setCategories(categories.map(c => c.id === editingCat.id ? res.category! : c));
          setIsModalOpen(false);
        } else {
          alert(res.error || "Error al actualizar");
        }
      } else {
        const res = await createCategory(name, slug);
        if (res.success && res.category) {
          setCategories([res.category, ...categories]);
          setIsModalOpen(false);
        } else {
          alert(res.error || "Error al crear");
        }
      }
    } catch (err) {
      alert("Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDelete = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'single',
      id,
      name,
    });
  };

  const promptBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      type: 'bulk',
      count: selectedIds.length,
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (confirmModal.type === 'bulk') {
        for (const id of selectedIds) {
          await deleteCategory(id);
        }
        setCategories((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      } else if (confirmModal.type === 'single' && confirmModal.id) {
        const id = confirmModal.id;
        const res = await deleteCategory(id);
        if (res.success) {
          setCategories((prev) => prev.filter((c) => c.id !== id));
          setSelectedIds((prev) => prev.filter((i) => i !== id));
        } else {
          alert(res.error);
        }
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    } finally {
      setIsDeleting(false);
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
                        <div className="flex items-center gap-2 pr-2 border-r border-slate-300/80">
                          <input 
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                          />
                          <span className="font-semibold text-slate-900 text-xs">
                            {selectedIds.length} {selectedIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={promptBulkDelete}
                          disabled={isDeleting}
                          className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isDeleting ? 'Borrando...' : 'Borrar seleccionadas'}</span>
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
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Nombre de Categoría</th>
                    <th className="px-4 py-3">Slug (URL)</th>
                    <th className="px-4 py-3">Fecha de Creación</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedIds.includes(cat.id);
                  return (
                    <tr 
                      key={cat.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCat(cat.id)}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#2f2f2f] truncate">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                          /{cat.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {format(new Date(cat.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(cat)}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Editar categoría"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar</span>
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
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 gap-0">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingCat ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Nombre de la Categoría *
              </Label>
              <Input 
                id="name" 
                placeholder="Ej. Turismo de Aventura" 
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                className="text-xs h-9 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-slate-900"
              />
            </div>
            
            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                className="text-xs px-3.5 py-1.5 h-8 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !name.trim()} 
                className="bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs px-3.5 py-1.5 h-8 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR CATEGORÍAS */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={
          confirmModal.type === 'bulk'
            ? `¿Eliminar ${confirmModal.count || selectedIds.length} categorías seleccionadas?`
            : `¿Eliminar la categoría "${confirmModal.name}"?`
        }
        description="Esta acción eliminará la categoría. Podría afectar a los tours asociados."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
