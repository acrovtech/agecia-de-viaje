import Link from 'next/link';
import { prisma } from '@repo/db';
import { Search } from 'lucide-react';
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

export default async function ToursList() {
  const tours = await prisma.tour.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tours por nombre o ubicación..."
            className="w-full appearance-none bg-background pl-8 shadow-sm"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/tours/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Crear Tour
          </Link>
        </div>
      </div>
      <div className="rounded-md border bg-card p-6 shadow-sm">
        {tours.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay tours creados. Haz clic en "Crear Tour" para empezar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Dificultad</TableHead>
                <TableHead>Servicio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tours.map((tour) => (
                <TableRow key={tour.id}>
                  <TableCell className="font-medium">{tour.title}</TableCell>
                  <TableCell>{tour.region || '-'}</TableCell>
                  <TableCell>{tour.duration}</TableCell>
                  <TableCell>{tour.difficulty || '-'}</TableCell>
                  <TableCell>{tour.hasSharedService ? (tour.hasPrivateService ? 'Compartido / Privado' : 'Compartido') : 'Privado'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
}
