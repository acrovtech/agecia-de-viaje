'use server';

import { revalidatePath } from 'next/cache';
import { platformSession, platformRequest } from '../../lib/platform-api';
import { CentralApiError } from '../../lib/central-api';

export type PlatformSettingsActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function updatePlatformSettingsAction(
  _prevState: PlatformSettingsActionState | null,
  formData: FormData
): Promise<PlatformSettingsActionState> {
  try {
    const { token, identity } = await platformSession();
    if (identity.role !== 'SUPERADMIN') {
      return { success: false, error: 'Se requiere rol SUPERADMIN para modificar la configuración de plataforma.' };
    }

    const productName = formData.get('productName')?.toString().trim();
    const logoUrl = formData.get('logoUrl')?.toString().trim() || null;
    const iconUrl = formData.get('iconUrl')?.toString().trim() || null;
    const coBrandingEnabled = formData.get('coBrandingEnabled') === 'true';
    const brandingRewardEnabled = formData.get('brandingRewardEnabled') === 'true';
    const rawCredits = formData.get('brandingRewardCredits')?.toString().trim();
    const brandingRewardCredits = Number.parseInt(rawCredits || '10', 10);

    if (!productName) {
      return { success: false, error: 'El nombre del producto es requerido.' };
    }

    if (Number.isNaN(brandingRewardCredits) || brandingRewardCredits < 0 || brandingRewardCredits > 100000) {
      return { success: false, error: 'La cantidad de créditos de recompensa debe ser un número entero entre 0 y 100,000.' };
    }

    await platformRequest(
      '/v1/platform/settings',
      token,
      {
        productName,
        logoUrl,
        iconUrl,
        coBrandingEnabled,
        brandingRewardEnabled,
        brandingRewardCredits,
      },
      'PUT'
    );

    revalidatePath('/platform/settings');
    revalidatePath('/platform');

    return {
      success: true,
      message: 'Configuración global de la plataforma actualizada exitosamente.',
    };
  } catch (error) {
    if (error instanceof CentralApiError) {
      return { success: false, error: error.message || 'No se pudo guardar la configuración de la plataforma.' };
    }
    return { success: false, error: 'Ocurrió un error inesperado al actualizar la configuración.' };
  }
}
