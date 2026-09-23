import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { canEditCatalog } from '../../../lib/catalog-editor';
import { tourContentSchema, transferContentSchema, categorySchema, vehicleSchema } from '../../../lib/catalog-content';
import { ContentForm, PublicationForm } from './content-form';

export const dynamic = 'force-dynamic';
async function choices<T>(path: string, token: string, schema: z.ZodType<T>) {
  const rows: T[] = [];
  let after: string | null = null;
  for (let page = 0; page < 100; page++) {
    const result = z.object({ data: z.array(schema), nextCursor: z.string().nullable() }).parse(await centralRequest(`${path}${after ? `?after=${encodeURIComponent(after)}` : ''}`, token));
    rows.push(...result.data);
    if (!result.nextCursor) return rows;
    if (result.nextCursor === after) throw new Error('Invalid pagination');
    after = result.nextCursor;
  }
  throw new Error('Resource selection limit');
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const kind = params.kind === 'transfers' ? 'transfers' : 'tours';
  const id = params.id;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) redirect(`/workspace?view=${kind}`);
  try {
    const { token, identity } = await centralSession();
    if (!canEditCatalog(identity.role, kind)) return <main className="p-8"><p>No tienes permiso para editar este catálogo.</p><Link href="/workspace" className="underline">Volver</Link></main>;
    const base = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog`;
    const data = await centralRequest(`${base}/${kind}/${id}/content`, token);
    const record = kind === 'tours' ? tourContentSchema.parse(data) : transferContentSchema.parse(data);
    const categories = kind === 'tours' ? await choices(`${base}/categories`, token, categorySchema) : [];
    const vehicles = kind === 'transfers' ? await choices(`${base}/vehicles`, token, vehicleSchema) : [];
    return <main className="max-w-4xl mx-auto p-5 space-y-6">
      <Link href={`/workspace?view=${kind}`} className="underline text-sm">Volver al catálogo</Link><h1 className="text-2xl font-semibold">{record.title}</h1>
      {params.saved === '1' && <p role="status" className="text-green-800 bg-green-50 p-3 rounded-lg">Cambios guardados.</p>}
      <PublicationForm key={`publish-${record.updatedAt}`} kind={kind} id={id} updatedAt={record.updatedAt} isPublished={record.isPublished} />
      <ContentForm key={record.updatedAt} kind={kind} record={record} categories={categories} vehicles={vehicles} />
    </main>;
  } catch (error) {
    if (error instanceof CentralApiError && error.status === 401) redirect('/login');
    return <main className="p-8"><p role="alert">No pudimos abrir el contenido. Verifica que el servicio pertenece a tu agencia y vuelve a intentarlo.</p><Link href={`/workspace?view=${kind}`} className="underline">Volver al catálogo</Link></main>;
  }
}
