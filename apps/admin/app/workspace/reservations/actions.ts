'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { centralSession, centralRequest, CentralApiError } from '../../../lib/central-api';
import { canOperateReservations, quoteSchema, reservationDetailSchema, type ReservationQuote } from '../../../lib/reservations';

function errorMessage(error: unknown) {
  const status = error instanceof CentralApiError ? error.status : 503;
  return ({ 400: 'Revisa fecha, pasajeros, modalidad, tarifa y capacidad del vehículo. El cambio de estado debe estar permitido y llevar un motivo.', 401: 'Tu sesión expiró. Vuelve a iniciar sesión.', 403: 'Tu rol no permite gestionar reservas.', 404: 'El servicio o reserva no está disponible en tu agencia.', 409: 'Los datos cambiaron o esta solicitud ya se utilizó. Revisa las reservas antes de volver a cotizar; para cambiar un estado, recarga la ficha.' } as Record<number, string>)[status] ?? 'No pudimos confirmar la operación. Puedes repetir el mismo envío sin duplicarlo; revisa las reservas antes de iniciar otra solicitud.';
}
function payload(form: FormData): unknown {
  const value = form.get('payload');
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > 90000) throw new CentralApiError(400);
  try { return JSON.parse(value); } catch { throw new CentralApiError(400); }
}
async function session() {
  const auth = await centralSession();
  if (!canOperateReservations(auth.identity.role)) throw new CentralApiError(403);
  return { ...auth, base: `/v1/agencies/${encodeURIComponent(auth.identity.agencyId)}/reservations` };
}
export async function quoteReservationAction(_prev: { error?: string; quote?: ReservationQuote } | null, form: FormData): Promise<{ error?: string; quote?: ReservationQuote }> {
  try {
    const { token, base } = await session();
    return { quote: quoteSchema.parse(await centralRequest(`${base}/quote`, token, payload(form))) };
  } catch (error) { return { error: errorMessage(error) }; }
}
export async function createReservationAction(_prev: { error: string } | null, form: FormData): Promise<{ error: string }> {
  let id: string;
  try {
    const { token, base } = await session();
    id = reservationDetailSchema.parse(await centralRequest(base, token, payload(form))).id;
  } catch (error) { return { error: errorMessage(error) }; }
  revalidatePath('/workspace/reservations');
  redirect(`/workspace/reservations?id=${encodeURIComponent(id)}&saved=1`);
}
export async function transitionReservationAction(_prev: { error: string } | null, form: FormData): Promise<{ error: string }> {
  const id = form.get('id');
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return { error: 'Reserva inválida.' };
  try {
    const { token, base } = await session();
    await centralRequest(`${base}/${id}/status`, token, { expectedUpdatedAt: form.get('expectedUpdatedAt'), status: form.get('status'), note: form.get('note') }, 'PUT');
  } catch (error) { return { error: errorMessage(error) }; }
  revalidatePath('/workspace/reservations');
  redirect(`/workspace/reservations?id=${id}&saved=1`);
}
