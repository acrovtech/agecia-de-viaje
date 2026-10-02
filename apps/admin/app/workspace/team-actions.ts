'use server';

import { revalidatePath } from 'next/cache';
import { centralRequest, centralSession, CentralApiError } from '../../lib/central-api';

export type TeamActionState = {
  success?: boolean;
  error?: string;
  deliveryStatus?: string;
  deliveryMessage?: string;
};

export async function createInvitationAction(
  _prevState: TeamActionState | null,
  formData: FormData
): Promise<TeamActionState> {
  try {
    const { token, identity } = await centralSession();
    if (!['OWNER', 'ADMIN'].includes(identity.role)) {
      return { error: 'No tienes permiso para invitar miembros.' };
    }

    const email = formData.get('email')?.toString().trim();
    const role = formData.get('role')?.toString().trim();

    if (!email || !role) {
      return { error: 'El correo electrónico y el rol son obligatorios.' };
    }

    if (identity.role === 'ADMIN' && role === 'ADMIN') {
      return { error: 'Los administradores no pueden invitar a otros administradores.' };
    }

    const res = await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/invitations`,
      token,
      { email, role },
      'POST'
    );

    revalidatePath('/team');
    revalidatePath('/dashboard');
    revalidatePath('/workspace');

    return {
      success: true,
      deliveryStatus: res.deliveryStatus,
      deliveryMessage: 'Invitación creada. El envío por correo electrónico aún no está configurado.',
    };
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 409) {
        return { error: 'El usuario ya cuenta con una membresía activa en la agencia.' };
      }
      if (error.status === 403) {
        return { error: 'No tienes autorización para realizar esta invitación.' };
      }
      if (error.status === 400) {
        return { error: 'Datos de invitación inválidos.' };
      }
    }
    return { error: 'Ocurrió un error al crear la invitación.' };
  }
}

export async function revokeInvitationAction(invitationId: string): Promise<TeamActionState> {
  try {
    const { token, identity } = await centralSession();
    if (!['OWNER', 'ADMIN'].includes(identity.role)) {
      return { error: 'No tienes permiso para revocar invitaciones.' };
    }

    await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/invitations/${encodeURIComponent(invitationId)}`,
      token,
      undefined,
      'DELETE'
    );

    revalidatePath('/team');
    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true };
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 403) return { error: 'No tienes permiso para revocar esta invitación.' };
      if (error.status === 404) return { error: 'Invitación no encontrada.' };
    }
    return { error: 'Error al revocar la invitación.' };
  }
}

export async function updateMembershipAction(
  membershipId: string,
  payload: { role?: string; isActive?: boolean }
): Promise<TeamActionState> {
  try {
    const { token, identity } = await centralSession();
    if (!['OWNER', 'ADMIN'].includes(identity.role)) {
      return { error: 'No tienes permiso para gestionar miembros.' };
    }

    await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/memberships/${encodeURIComponent(membershipId)}`,
      token,
      payload,
      'PATCH'
    );

    revalidatePath('/team');
    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true };
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 409) {
        return { error: 'No se puede modificar ni desactivar al único propietario activo de la agencia.' };
      }
      if (error.status === 403) {
        return { error: 'No tienes autorización para modificar este miembro o asignar este rol.' };
      }
      if (error.status === 400) {
        return { error: 'Datos de actualización inválidos.' };
      }
      if (error.status === 404) {
        return { error: 'Membresía no encontrada.' };
      }
    }
    return { error: 'Error al actualizar el miembro.' };
  }
}

export async function deleteMembershipAction(membershipId: string): Promise<TeamActionState> {
  try {
    const { token, identity } = await centralSession();
    if (identity.role !== 'OWNER') {
      return { error: 'Solo el propietario de la agencia puede eliminar miembros.' };
    }

    await centralRequest(
      `/v1/agencies/${encodeURIComponent(identity.agencyId)}/memberships/${encodeURIComponent(membershipId)}`,
      token,
      undefined,
      'DELETE'
    );

    revalidatePath('/team');
    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true };
  } catch (error) {
    if (error instanceof CentralApiError) {
      if (error.status === 409) {
        return { error: 'No se puede eliminar al único propietario activo de la agencia.' };
      }
      if (error.status === 403) {
        return { error: 'No tienes permiso para eliminar este miembro.' };
      }
      if (error.status === 404) {
        return { error: 'Membresía no encontrada.' };
      }
    }
    return { error: 'Error al eliminar el miembro.' };
  }
}
