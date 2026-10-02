'use server';

import { revalidatePath } from 'next/cache';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';

export type NotificationActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function retryNotificationAction(
  _prevState: NotificationActionState | null,
  formData: FormData,
): Promise<NotificationActionState> {
  try {
    const { token, identity } = await centralSession();
    if (!['OWNER', 'ADMIN'].includes(identity.role)) {
      return { error: 'No tienes permiso para reintentar notificaciones.' };
    }

    const notificationId = formData.get('notificationId')?.toString().trim();
    if (!notificationId) {
      return { error: 'ID de notificación requerido.' };
    }

    await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/notifications/${encodeURIComponent(notificationId)}/retry`,
      token,
      {},
      'POST',
    );

    revalidatePath('/notifications');
    revalidatePath('/workspace/notifications');
    return { success: true, message: 'Notificación reprogramada para reintento.' };
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 409) {
        return { error: error.message || 'No se puede reintentar una notificación enviada o en proceso.' };
      }
      if (error.status === 403) {
        return { error: 'No tienes autorización para esta acción.' };
      }
      if (error.status === 404) {
        return { error: 'Notificación no encontrada.' };
      }
    }
    return { error: 'Error al reintentar la notificación.' };
  }
}
