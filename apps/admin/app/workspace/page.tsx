import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isApiAdmin } from '../../lib/admin-mode';
import { centralRequest, centralSession, CentralApiError } from '../../lib/central-api';
import { logoutAction } from '../actions/auth';
import { canEditCatalog, catalogDetailSchema, type CatalogDetail } from '../../lib/catalog-editor';
import { CatalogForm } from './catalog-form';

export const dynamic = 'force-dynamic';

const memberSchema = z.object({
  data: z.array(z.object({ id: z.string(), role: z.string(), isActive: z.boolean(), user: z.object({ id: z.string(), name: z.string().nullable(), email: z.string() }) })),
  nextCursor: z.string().nullable(),
});
const catalogSchema = z.object({
  data: z.array(z.object({ id: z.string(), title: z.string(), slug: z.string(), hasSharedService: z.boolean(), sharedPrice: z.number().nullable(), isActive: z.boolean().optional(), isPublished: z.boolean() })),
  nextCursor: z.string().nullable(),
});
const roleLabels: Record<string, string> = { OWNER: 'Propietario', ADMIN: 'Administrador', EDITOR: 'Editor', OPERATOR: 'Operador', VIEWER: 'Consulta' };
const tabs = { tours: 'Tours', transfers: 'Traslados', members: 'Equipo' };

export default async function Workspace({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isApiAdmin()) redirect('/');
  let session;
  try { session = await centralSession(); }
  catch (error) {
    if (error instanceof CentralApiError && error.status === 401) redirect('/login?expired=1');
    return <main className="max-w-xl mx-auto p-8"><h1 className="text-2xl font-semibold">No pudimos verificar tu sesión</h1><p className="my-4">El servicio no está disponible en este momento. Tus datos no se han cargado.</p><Link href="/workspace" className="underline">Volver a intentar</Link></main>;
  }
  const { token, identity } = session;
  const params = await searchParams;
  const view = params.view === 'members' ? 'members' : params.view === 'transfers' ? 'transfers' : 'tours';
  const canSeeTeam = ['OWNER', 'ADMIN'].includes(identity.role);
  const canEdit = view !== 'members' && canEditCatalog(identity.role, view);
  const editing = view !== 'members' && typeof params.edit === 'string';
  let record: CatalogDetail | undefined;
  const cursor = typeof params.after === 'string' && params.after.length <= 128 ? params.after : undefined;
  let members: z.infer<typeof memberSchema> | undefined;
  let catalog: z.infer<typeof catalogSchema> | undefined;
  let errorMessage = '';
  if (editing) {
    if (!canEdit) errorMessage = 'Tu rol no permite modificar estos servicios.';
    else if (params.edit !== 'new') {
      try {
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(params.edit as string)) throw new CentralApiError(404);
        record = catalogDetailSchema.parse(await centralRequest(`/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${view}/${encodeURIComponent(params.edit as string)}`, token));
      } catch { errorMessage = 'No pudimos abrir este servicio. Verifica tu sesión y vuelve al catálogo.'; }
    }
  }
  else if (view === 'members' && !canSeeTeam) errorMessage = 'Tu rol no permite consultar el equipo.';
  else {
    try {
      const resource = view === 'members' ? 'memberships' : `catalog/${view}`;
      const suffix = cursor ? `?after=${encodeURIComponent(cursor)}` : '';
      const body = await centralRequest(`/v1/agencies/${encodeURIComponent(identity.agencyId)}/${resource}${suffix}`, token);
      if (view === 'members') members = memberSchema.parse(body);
      else catalog = catalogSchema.parse(body);
    } catch (error) {
      if (error instanceof CentralApiError && error.status === 401) redirect('/login?expired=1');
      errorMessage = error instanceof CentralApiError && error.status === 403
        ? 'Ya no tienes permiso para consultar esta sección.' : 'No pudimos cargar esta sección. Vuelve a intentarlo.';
    }
  }
  const nextCursor = members?.nextCursor ?? catalog?.nextCursor;
  return <main className="max-w-6xl mx-auto px-5 py-8 space-y-8">
    <header className="flex flex-wrap justify-between items-center gap-4">
      <div><p className="text-sm text-slate-500">Espacio de agencia</p><h1 className="text-3xl font-semibold text-[#062918]">{identity.agencyName}</h1><p className="text-sm text-slate-600 mt-2">{identity.email} · {roleLabels[identity.role]}</p></div>
      <form action={logoutAction}><button className="border rounded-lg bg-white px-4 py-2 text-sm">Cerrar sesión</button></form>
    </header>
    {params.logout === 'unavailable' && <p role="alert" className="p-4 bg-amber-50 border border-amber-200 rounded-lg">No pudimos cerrar tu sesión en el servicio. Inténtalo nuevamente.</p>}
    {params.saved === '1' && <p role="status" className="p-3 rounded-lg bg-green-50 text-green-800">Servicio guardado.</p>}
    <nav aria-label="Secciones de agencia" className="flex flex-wrap gap-2">
      {['OWNER', 'ADMIN', 'OPERATOR'].includes(identity.role) && <Link href="/workspace/reservations" className="px-4 py-2 rounded-lg text-sm bg-white border">Reservas</Link>}
      <Link href="/workspace/resources?kind=categories" className="px-4 py-2 rounded-lg text-sm bg-white border">Categorías</Link>
      <Link href="/workspace/resources?kind=vehicles" className="px-4 py-2 rounded-lg text-sm bg-white border">Vehículos</Link>
      {Object.entries(tabs).filter(([key]) => key !== 'members' || canSeeTeam).map(([key, label]) => <Link key={key} href={`/workspace?view=${key}`} aria-current={view === key ? 'page' : undefined} className={`px-4 py-2 rounded-lg text-sm ${view === key ? 'bg-[#062918] text-white' : 'bg-white border'}`}>{label}</Link>)}
    </nav>
    <section className="bg-white rounded-xl border p-5 space-y-4">
      <h2 className="text-xl font-semibold">{tabs[view]}</h2>
      {canEdit && !editing && <Link href={`/workspace?view=${view}&edit=new`} className="inline-block bg-[#062918] text-white rounded-lg px-4 py-2 text-sm">Crear {view === 'tours' ? 'tour' : 'traslado'}</Link>}
      {editing && canEdit && !errorMessage && <CatalogForm key={`${view}-${record?.id ?? 'new'}-${record?.updatedAt ?? ''}`} kind={view} record={record} />}
      {errorMessage && <p role="alert" className="text-red-700">{errorMessage}</p>}
      {members && <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="py-3">Persona</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{members.data.map((member) => <tr key={member.id} className="border-b"><td className="py-4">{member.user.name || member.user.email}<span className="block text-slate-500">{member.user.email}</span></td><td>{roleLabels[member.role] || member.role}</td><td>{member.isActive ? 'Activo' : 'Desactivado'}</td></tr>)}</tbody></table>{members.data.length === 0 && <p className="py-4">No hay miembros en esta página.</p>}</div>}
      {catalog && <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th className="py-3">Servicio</th><th>Tarifa compartida de referencia</th>{view === 'transfers' && <th>Estado</th>}</tr></thead><tbody>{catalog.data.map((item) => <tr key={item.id} className="border-b"><td className="py-4">{canEdit ? <Link className="underline" href={`/workspace?view=${view}&edit=${encodeURIComponent(item.id)}`}>{item.title}</Link> : item.title}<span className="block text-slate-500">{item.slug} · {item.isPublished ? "Publicado" : "Borrador"}</span>{canEdit && <Link className="block underline text-sm mt-1" href={`/workspace/content?kind=${view}&id=${item.id}`}>Contenido, tarifas y publicación</Link>}</td><td>{item.hasSharedService && item.sharedPrice !== null ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD' }).format(item.sharedPrice) : 'No disponible'}</td>{view === 'transfers' && <td>{item.isActive ? 'Activo' : 'Desactivado'}</td>}</tr>)}</tbody></table>{catalog.data.length === 0 && <p className="py-4">No hay servicios en esta página.</p>}</div>}
      <div className="flex gap-4 text-sm underline">{cursor && <Link href={`/workspace?view=${view}`}>Primera página</Link>}{nextCursor && <Link href={`/workspace?view=${view}&after=${encodeURIComponent(nextCursor)}`}>Siguiente página</Link>}</div>
    </section>
  </main>;
}
