import Link from 'next/link';
import { prisma } from '@repo/db';
import { PenTool, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function BlogsList() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar artículos..."
            className="w-full appearance-none bg-background pl-8 shadow-sm"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/blogs/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <PenTool className="mr-2 h-4 w-4" />
            Crear Artículo
          </Link>
        </div>
      </div>
      <div className="rounded-md border bg-card p-6 shadow-sm">
        {blogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay artículos en el blog. Haz clic en "Crear Artículo" para empezar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>URL (Slug)</TableHead>
                <TableHead>Fecha de Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium">{blog.title}</TableCell>
                  <TableCell>{blog.slug}</TableCell>
                  <TableCell>{blog.createdAt.toLocaleDateString('es-PE')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
