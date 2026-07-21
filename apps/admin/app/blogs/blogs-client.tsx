'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Blog } from '@repo/db';
import { deleteBlog } from '../actions/blog';
import { Plus, Trash2, Calendar, FileText } from 'lucide-react';

export function BlogsClient({ initialBlogs }: { initialBlogs: Blog[] }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, title: string) => {
    if (confirm(`¿Está seguro de que desea eliminar la publicación "${title}"?`)) {
      setDeletingId(id);
      startTransition(async () => {
        const res = await deleteBlog(id);
        if (res.success) {
          setBlogs(blogs.filter(b => b.id !== id));
        } else {
          alert("Error al eliminar la publicación.");
        }
        setDeletingId(null);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Blogs</h1>
          <p className="text-sm text-slate-500 mt-1">Publica artículos, guías de viaje y noticias de interés para tus clientes.</p>
        </div>
        <Link
          href="/blogs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B4354] hover:bg-[#083340] text-white font-semibold text-xs rounded-xl shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Publicación</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {blogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="font-medium">No hay publicaciones de blog creadas aún.</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Nueva Publicación" para publicar tu primer artículo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Artículo</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Fecha Publicación</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {blog.bannerImage ? (
                          <img src={blog.bannerImage} alt="" className="w-12 h-9 rounded-xl object-cover border border-slate-200" />
                        ) : (
                          <div className="w-12 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                            <FileText className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <span className="line-clamp-1">{blog.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      /{blog.slug}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(blog.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={isPending && deletingId === blog.id}
                        onClick={() => handleDelete(blog.id, blog.title)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Eliminar artículo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
