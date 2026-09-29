'use server';

import { centralSession, CentralApiError } from '../../lib/central-api';
import { isApiAdmin } from '../../lib/admin-mode';

export interface UploadMediaResult {
  success: boolean;
  url?: string;
  error?: string;
  asset?: {
    id: string;
    publicUrl: string;
    kind: string;
    byteSize: number;
    mimeType: string;
  };
}

const ALLOWED_UPLOAD_ROLES = ['OWNER', 'ADMIN', 'EDITOR'];

export async function uploadMediaAction(formData: FormData): Promise<UploadMediaResult> {
  if (!isApiAdmin()) {
    return { success: false, error: 'Acceso no autorizado al modo API.' };
  }

  try {
    const { token, identity } = await centralSession();
    if (!ALLOWED_UPLOAD_ROLES.includes(identity.role)) {
      return { success: false, error: 'Tu rol no tiene permiso para subir archivos.' };
    }

    const file = formData.get('file') as File | null;
    const kind = formData.get('kind') as string | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Debes seleccionar un archivo de imagen válido.' };
    }

    if (!kind) {
      return { success: false, error: 'Debes especificar el tipo de medio (kind).' };
    }

    const origin = process.env.ADMIN_API_URL;
    if (!origin) {
      return { success: false, error: 'Servicio de API central no disponible.' };
    }

    // Build upstream multipart form
    const upstreamForm = new FormData();
    upstreamForm.append('kind', kind);
    upstreamForm.append('file', file, file.name);

    const targetUrl = `${origin}/v1/agencies/${encodeURIComponent(identity.agencyId)}/media`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: upstreamForm,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const message = errJson?.message || `Error del servidor (${response.status})`;
      return { success: false, error: message };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.publicUrl,
      asset: {
        id: data.id,
        publicUrl: data.publicUrl,
        kind: data.kind,
        byteSize: data.byteSize,
        mimeType: data.mimeType,
      },
    };
  } catch (error: any) {
    if (error instanceof CentralApiError && error.status === 401) {
      return { success: false, error: 'Tu sesión ha expirado. Inicia sesión nuevamente.' };
    }
    return {
      success: false,
      error: error?.message || 'Error inesperado al subir el archivo.',
    };
  }
}
