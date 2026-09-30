'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { centralSession, centralRequest, CentralApiError } from '../../../lib/central-api';

function errorMessage(error: unknown) {
  const status = error instanceof CentralApiError ? error.status : 503;
  return (
    ({
      400: 'Revisa los datos ingresados: campos requeridos, formato de teléfono/correo y capacidad.',
      401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
      403: 'Tu rol no permite administrar recursos operativos de la agencia.',
      404: 'El recurso no fue encontrado.',
      409: 'Ya existe un recurso con ese identificador (ej: placa duplicada).',
    } as Record<number, string>)[status] ??
    'No pudimos completar la operación. Verifica los datos e inténtalo de nuevo.'
  );
}

async function requireAdminSession() {
  const auth = await centralSession();
  if (!['OWNER', 'ADMIN'].includes(auth.identity.role)) {
    throw new CentralApiError(403);
  }
  return {
    ...auth,
    base: `/v1/agencies/${encodeURIComponent(auth.identity.agencyId)}/operations`,
  };
}

export async function saveServiceResourceAction(
  _prev: { error?: string } | null,
  form: FormData,
): Promise<{ error?: string }> {
  const id = form.get('id');
  const isEdit = typeof id === 'string' && id.length > 0 && id !== 'new';
  const type = form.get('type');
  const displayName = String(form.get('displayName') || '').trim();
  const phone = form.get('phone') ? String(form.get('phone')).trim() : null;
  const email = form.get('email') ? String(form.get('email')).trim().toLowerCase() : null;
  const documentNumber = form.get('documentNumber') ? String(form.get('documentNumber')).trim() : null;
  const isActive = form.get('isActive') === 'true';

  try {
    const { token, base } = await requireAdminSession();
    if (isEdit) {
      await centralRequest(
        `${base}/resources/${encodeURIComponent(id)}`,
        token,
        { displayName, phone, email, documentNumber, isActive },
        'PUT',
      );
    } else {
      await centralRequest(
        `${base}/resources`,
        token,
        { type, displayName, phone, email, documentNumber, isActive },
        'POST',
      );
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath('/workspace/operations');
  redirect('/workspace/operations?view=personnel&saved=1');
}

export async function saveFleetVehicleAction(
  _prev: { error?: string } | null,
  form: FormData,
): Promise<{ error?: string }> {
  const id = form.get('id');
  const isEdit = typeof id === 'string' && id.length > 0 && id !== 'new';
  const vehicleTypeId = String(form.get('vehicleTypeId') || '').trim();
  const internalLabel = String(form.get('internalLabel') || '').trim();
  const plate = String(form.get('plate') || '').trim().toUpperCase();
  const capacityRaw = form.get('capacity');
  const capacity = capacityRaw && Number(capacityRaw) > 0 ? Number(capacityRaw) : null;
  const notes = form.get('notes') ? String(form.get('notes')).trim() : null;
  const isActive = form.get('isActive') === 'true';

  try {
    const { token, base } = await requireAdminSession();
    if (isEdit) {
      await centralRequest(
        `${base}/vehicles/${encodeURIComponent(id)}`,
        token,
        { vehicleTypeId, internalLabel, plate, capacity, notes, isActive },
        'PUT',
      );
    } else {
      await centralRequest(
        `${base}/vehicles`,
        token,
        { vehicleTypeId, internalLabel, plate, capacity, notes, isActive },
        'POST',
      );
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath('/workspace/operations');
  redirect('/workspace/operations?view=fleet&saved=1');
}
