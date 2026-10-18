'use server';

import { centralRequest, centralSession } from '@/lib/central-api';
import { revalidatePath } from 'next/cache';

export interface FeedbackActionState {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function submitFeedbackAction(
  _prevState: FeedbackActionState | null,
  formData: FormData,
): Promise<FeedbackActionState> {
  try {
    const session = await centralSession();
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!type || !['BUG', 'IMPROVEMENT', 'FEATURE'].includes(type)) {
      return { error: 'Selecciona un tipo de comentario válido (error, mejora o función).' };
    }
    if (!title || title.trim().length < 3) {
      return { error: 'El título debe tener al menos 3 caracteres.' };
    }
    if (!description || description.trim().length < 5) {
      return { error: 'La descripción debe tener al menos 5 caracteres explicativos.' };
    }

    await centralRequest(
      `/v1/agencies/${encodeURIComponent(session.identity.agencyId)}/settings/feedback`,
      session.token,
      {
        type,
        title: title.trim(),
        description: description.trim(),
      },
      'POST',
    );

    revalidatePath('/settings/feedback');
    return {
      success: true,
      message: '¡Gracias! Tu comentario ha sido registrado con éxito. Será revisado por el equipo de producto.',
    };
  } catch (error: any) {
    return { error: error?.message || 'No se pudo enviar el comentario. Inténtalo nuevamente.' };
  }
}
