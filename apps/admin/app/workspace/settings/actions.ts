'use server';

import { revalidatePath } from 'next/cache';
import { centralRequest, centralSession, CentralApiError } from '../../../lib/central-api';

export type SettingsActionState = {
  success?: boolean;
  error?: string;
  updatedAt?: string;
};

export async function updateAgencyProfileAction(
  _prevState: SettingsActionState | null,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const { token, identity } = await centralSession();
    if (!['OWNER', 'ADMIN'].includes(identity.role)) {
      return { error: 'No tienes permiso para modificar el perfil de la agencia.' };
    }

    const name = formData.get('name')?.toString().trim();
    if (!name) return { error: 'El nombre de la empresa es obligatorio.' };

    const phone = formData.get('phone')?.toString().trim() || null;
    const email = formData.get('email')?.toString().trim() || null;
    const address = formData.get('address')?.toString().trim() || null;
    const logoUrl = formData.get('logoUrl')?.toString().trim() || null;
    const iconUrl = formData.get('iconUrl')?.toString().trim() || null;
    const expectedUpdatedAt = formData.get('expectedUpdatedAt')?.toString()?.trim();
    if (!expectedUpdatedAt) {
      return { error: 'Fecha de versión requerida para control de concurrencia.' };
    }

    const payload = {
      name,
      phone,
      email,
      address,
      logoUrl,
      iconUrl,
      expectedUpdatedAt,
    };

    const res = await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/settings/profile`,
      token,
      payload,
      'PUT'
    );

    revalidatePath('/workspace/settings');
    revalidatePath('/workspace');

    return { success: true, updatedAt: res.updatedAt };
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 409) {
        return { error: 'El perfil fue modificado concurrentemente por otro usuario. Recarga la página para ver los cambios.' };
      }
      if (error.status === 403) {
        return { error: 'No tienes autorización para realizar esta acción o usar recursos de otra agencia.' };
      }
      if (error.status === 400) {
        return { error: 'Datos del perfil inválidos.' };
      }
    }
    return { error: 'Ocurrió un error inesperado al actualizar el perfil.' };
  }
}

export async function updateLegalProfileAction(
  _prevState: SettingsActionState | null,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const { token, identity } = await centralSession();
    if (!['OWNER', 'ADMIN'].includes(identity.role)) {
      return { error: 'No tienes permiso para modificar el perfil legal.' };
    }

    const ruc = formData.get('ruc')?.toString().trim();
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      return { error: 'El RUC debe tener exactamente 11 dígitos numéricos.' };
    }

    const legalName = formData.get('legalName')?.toString().trim();
    if (!legalName) return { error: 'La razón social es obligatoria.' };

    const tradeName = formData.get('tradeName')?.toString().trim() || null;
    const fiscalAddress = formData.get('fiscalAddress')?.toString().trim();
    if (!fiscalAddress) return { error: 'El domicilio fiscal es obligatorio.' };

    const legalRepresentative = formData.get('legalRepresentative')?.toString().trim() || null;
    const contactEmail = formData.get('contactEmail')?.toString().trim() || null;
    const contactPhone = formData.get('contactPhone')?.toString().trim() || null;
    const rawExpected = formData.get('expectedUpdatedAt')?.toString()?.trim();
    const expectedUpdatedAt = rawExpected ? rawExpected : null;

    const payload = {
      ruc,
      legalName,
      tradeName,
      fiscalAddress,
      legalRepresentative,
      contactEmail,
      contactPhone,
      expectedUpdatedAt,
    };

    const res = await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/settings/legal`,
      token,
      payload,
      'PUT'
    );

    revalidatePath('/workspace/settings');

    return { success: true, updatedAt: res.updatedAt };
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 409) {
        return { error: 'El perfil legal fue modificado concurrentemente por otro usuario. Recarga la página.' };
      }
      if (error.status === 403) {
        return { error: 'No tienes autorización para realizar esta acción.' };
      }
      if (error.status === 400) {
        return { error: 'Datos del perfil legal inválidos.' };
      }
    }
    return { error: 'Ocurrió un error al actualizar el perfil legal.' };
  }
}
