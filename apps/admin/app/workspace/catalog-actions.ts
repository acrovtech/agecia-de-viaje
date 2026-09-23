'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { centralRequest, centralSession, CentralApiError } from '../../lib/central-api';
import { canEditCatalog, catalogDetailSchema } from '../../lib/catalog-editor';

export async function saveCatalogAction(_previous: { error: string } | null, form: FormData): Promise<{ error: string }> {
  const kind = form.get('kind');
  if (kind !== 'tours' && kind !== 'transfers') return { error: 'Tipo de servicio inválido.' };
  const id = form.get('id');
  if (typeof id !== 'string' || (id && !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) return { error: 'Servicio inválido.' };
  try {
    const { token, identity } = await centralSession();
    if (!canEditCatalog(identity.role, kind)) return { error: 'Tu rol no permite modificar estos servicios.' };
    const str = (key: string) => { const value = form.get(key); return typeof value === 'string' ? value.trim() : ''; };
    const shared = form.get('hasSharedService') === 'on';
    const price = str('sharedPrice');
    if (shared && (!price || !/^\d+(\.\d{1,2})?$/.test(price))) return { error: 'Ingresa una tarifa positiva con hasta dos decimales.' };
    const common = {
      title: str('title'), slug: str('slug'), duration: str('duration'),
      hasSharedService: shared, sharedPrice: shared ? Number(price) : null,
    };
    const body = kind === 'tours' ? {
      ...common, description: str('description'), bannerImage: str('bannerImage'),
      cardImage: str('cardImage'), region: str('region') || null,
    } : {
      ...common, description: str('description') || null, bannerImage: str('bannerImage') || null,
      origin: str('origin'), destination: str('destination'), tripType: str('tripType'), isActive: form.get('isActive') === 'on',
    };
    const route = `/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${kind}${id ? `/${encodeURIComponent(id)}` : ''}`;
    const saved = await centralRequest(route, token, id ? { ...body, expectedUpdatedAt: str('updatedAt') } : body, id ? 'PUT' : 'POST');
    catalogDetailSchema.parse(saved);
  } catch (error) {
    const status = error instanceof CentralApiError ? error.status : 503;
    const errors: Record<number, string> = {
      400: 'Revisa los campos, las imágenes y la tarifa. Debe existir al menos una modalidad disponible.',
      401: 'Tu sesión expiró. Inicia sesión nuevamente antes de guardar.',
      403: 'Ya no tienes permiso para modificar este servicio.',
      404: 'El servicio no está disponible en tu agencia.',
      409: 'No se guardó: el enlace ya está en uso o alguien modificó este servicio. Recarga la ficha antes de volver a editar.',
    };
    return { error: errors[status] ?? 'No pudimos confirmar el guardado. Revisa el catálogo antes de reintentar.' };
  }
  revalidatePath('/workspace');
  redirect(`/workspace?view=${kind}&saved=1`);
}
