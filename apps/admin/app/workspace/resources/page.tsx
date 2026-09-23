import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { categorySchema, vehicleSchema } from '../../../lib/catalog-content';
import { canEditCatalog } from '../../../lib/catalog-editor';
import { ResourceForm } from './resource-form';

export const dynamic = 'force-dynamic';
export default async function ResourcesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const kind = params.kind === 'vehicles' ? 'vehicles' : 'categories';
  try {
    const { token, identity } = await centralSession();
    const after = typeof params.after === 'string' && params.after.length <= 128 ? params.after : '';
    const body = await centralRequest(`/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${kind}${after ? `?after=${encodeURIComponent(after)}` : ''}`, token);
    const result = kind === 'categories' ? z.object({ data: z.array(categorySchema), nextCursor: z.string().nullable() }).parse(body) : z.object({ data: z.array(vehicleSchema), nextCursor: z.string().nullable() }).parse(body);
    const allowed = canEditCatalog(identity.role, kind === 'categories' ? 'tours' : 'transfers');
    const selected = result.data.find((row) => row.id === params.edit);
    const path = `/workspace/resources?kind=${kind}`;
    return <main className="max-w-4xl mx-auto p-5 space-y-6">
      <Link href="/workspace" className="underline text-sm">Volver al catálogo</Link><h1 className="text-2xl font-semibold">{kind === 'categories' ? 'Categorías' : 'Vehículos'} · {identity.agencyName}</h1>
      {params.saved === '1' && <p role="status" className="text-green-800">Recurso guardado.</p>}
      {allowed && <Link href={`${path}&edit=new`} className="inline-block bg-[#062918] text-white px-4 py-2 rounded-lg">Crear {kind === 'categories' ? 'categoría' : 'vehículo'}</Link>}
      {allowed && (selected || params.edit === 'new') && <ResourceForm key={`${selected?.id ?? 'new'}-${selected?.updatedAt ?? ''}`} kind={kind} record={selected} />}
      <ul className="bg-white border rounded-xl divide-y">{result.data.map((row) => <li key={row.id} className="p-4 flex justify-between gap-4"><div className="font-medium">{row.name}<span className="block text-sm text-slate-500">{'slug' in row ? row.slug : `${row.code} · ${row.maxPax} pasajeros · ${row.isActive ? 'Activo' : 'Desactivado'}`}</span></div>{allowed && <Link className="underline text-sm" href={`${path}&after=${encodeURIComponent(after)}&edit=${row.id}`}>Editar</Link>}</li>)}</ul>
      {!result.data.length && <p>No hay recursos en esta página.</p>}
      <div className="flex gap-4 text-sm underline">{after && <Link href={path}>Primera página</Link>}{result.nextCursor && <Link href={`${path}&after=${encodeURIComponent(result.nextCursor)}`}>Siguiente página</Link>}</div>
    </main>;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) redirect('/login');
    return <main className="p-8"><p role="alert">No pudimos cargar los recursos de tu agencia.</p><Link href="/workspace" className="underline">Volver</Link></main>;
  }
}
