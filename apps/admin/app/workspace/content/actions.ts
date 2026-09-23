'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';
import { canEditCatalog } from '../../../lib/catalog-editor';

export async function catalogContentAction(_previous: { error: string } | null, form: FormData): Promise<{ error: string }> {
  const kind = form.get('kind');
  const operation = form.get('operation');
  const id = form.get('id');
  if (!['tours', 'transfers', 'categories', 'vehicles'].includes(String(kind)) || typeof id !== 'string' || (id && !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) return { error: 'Solicitud inválida.' };
  if (!['content', 'publication', 'resource'].includes(String(operation))) return { error: 'Solicitud inválida.' };
  if ((operation === 'resource') !== (kind === 'categories' || kind === 'vehicles') || (operation !== 'resource' && !id)) return { error: 'Solicitud inválida.' };
  try {
    const { token, identity } = await centralSession();
    const roleKind = kind === 'categories' || kind === 'tours' ? 'tours' : 'transfers';
    if (!canEditCatalog(identity.role, roleKind)) return { error: 'Tu rol no permite realizar esta operación.' };
    const payload = form.get('payload');
    if (typeof payload !== 'string' || Buffer.byteLength(payload, 'utf8') > 90000) return { error: 'El contenido es demasiado extenso o no es válido.' };
    let body: unknown;
    try { body = JSON.parse(payload); } catch { return { error: 'Contenido inválido.' }; }
    const suffix = operation === 'resource' ? (id ? `/${id}` : '') : `/${id}/${operation}`;
    await centralRequest(`/v1/agencies/${encodeURIComponent(identity.agencyId)}/catalog/${kind}${suffix}`, token, body, id ? 'PUT' : 'POST');
  } catch (error) {
    const status = error instanceof CentralApiError ? error.status : 503;
    return { error: ({
      400: 'Revisa los datos: imágenes, tarifas, categorías y vehículos deben ser válidos y pertenecer a tu agencia. Para publicar, activa al menos una modalidad con tarifa y activa el traslado.',
      401: 'Tu sesión expiró. Vuelve a iniciar sesión.', 403: 'No tienes permiso para realizar esta operación.',
      404: 'El recurso no pertenece a tu agencia o ya no existe.',
      409: 'El recurso cambió o su código ya existe. Recarga antes de guardar nuevamente.',
    } as Record<number, string>)[status] ?? 'No pudimos confirmar el guardado. Revisa el recurso antes de reintentar.' };
  }
  revalidatePath('/workspace');
  if (operation === 'resource') redirect(`/workspace/resources?kind=${kind}&saved=1`);
  redirect(`/workspace/content?kind=${kind}&id=${id}&saved=1`);
}
