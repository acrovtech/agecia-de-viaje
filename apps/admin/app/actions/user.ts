'use server';

import { revalidatePath } from 'next/cache';
import { 
  prisma, 
  Role, 
  SharedCreateUserSchema, 
  SharedUpdateUserSchema, 
  hashPassword, 
  createAuditEntry,
  revokeAllUserSessions,
  handlePrismaError
} from '@repo/db';
import { requireMasterRole } from '@/lib/auth-check';

/**
 * Obtiene la lista completa de usuarios con su estado de seguridad y telemetría de login.
 * Protegido estrictamente con requireMasterRole().
 */
export async function getUsersAction() {
  try {
    await requireMasterRole();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, users };
  } catch (error: any) {
    console.error('Error in getUsersAction:', error);
    return { success: false, error: error.message || 'Error al obtener usuarios' };
  }
}

/**
 * Registra un nuevo usuario administrativo con hash de contraseña bcrypt y rol asignado.
 */
export async function createUserAction(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive?: boolean;
}) {
  try {
    const session = await requireMasterRole();

    const parsed = SharedCreateUserSchema.safeParse(data);
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message || 'Datos de usuario inválidos' 
      };
    }

    const { name, email, password, role, isActive } = parsed.data;

    // Solo un SuperAdmin puede crear otro SuperAdmin
    if (role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return { success: false, error: 'Permisos insuficientes. Solo un SuperAdmin puede crear usuarios con rol SuperAdmin.' };
    }

    // Verificar unicidad de correo
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { success: false, error: 'Ya existe un usuario con este correo electrónico.' };
    }

    // Hash criptográfico de contraseña
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await createAuditEntry({
      userId: session.id ?? null,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
    });

    revalidatePath('/usuarios');
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Error in createUserAction:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}

/**
 * Actualiza los datos, rol y opcionalmente la contraseña de un usuario administrativo.
 */
export async function updateUserAction(data: {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}) {
  try {
    const session = await requireMasterRole();

    const parsed = SharedUpdateUserSchema.safeParse(data);
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message || 'Datos de actualización inválidos' 
      };
    }

    const { id, name, email, password, role, isActive } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    // Solo un SuperAdmin puede modificar a otro SuperAdmin o promover a SuperAdmin
    if (user.role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return { success: false, error: 'Permisos insuficientes. Solo un SuperAdmin puede modificar cuentas SuperAdmin.' };
    }
    if (role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return { success: false, error: 'Permisos insuficientes. Solo un SuperAdmin puede promover usuarios al rol SuperAdmin.' };
    }

    // Salvaguarda: No permitir que el usuario actual se degrade o desactive a sí mismo
    const isSelf = session.id === user.id || session.email === user.email;
    if (isSelf) {
      if (isActive === false) {
        return { success: false, error: 'Por seguridad, no puede desactivar su propia cuenta en uso.' };
      }
      if (role && role !== session.role) {
        return { success: false, error: 'Por seguridad, no puede alterar su propio nivel de rol administrativo.' };
      }
    }

    // Verificar duplicado de email si cambió
    if (email && email !== user.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email } });
      if (emailConflict) {
        return { success: false, error: 'El correo electrónico ya está registrado por otro usuario.' };
      }
    }

    // Datos a actualizar
    const updatePayload: Record<string, any> = {};
    if (name) updatePayload.name = name;
    if (email) updatePayload.email = email;
    if (role) updatePayload.role = role;
    if (typeof isActive === 'boolean') updatePayload.isActive = isActive;

    // Si se especificó nueva contraseña, se hashea y se invalida la sesión previa
    if (password && password.trim().length >= 8) {
      updatePayload.password = await hashPassword(password);
      updatePayload.passwordChangedAt = new Date();
      updatePayload.tokenVersion = { increment: 1 };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updatePayload,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await createAuditEntry({
      userId: session.id ?? null,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      details: { 
        updatedFields: Object.keys(updatePayload), 
        passwordReset: Boolean(password) 
      },
    });

    revalidatePath('/usuarios');
    return { success: true, user: updated };
  } catch (error: any) {
    console.error('Error in updateUserAction:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}

/**
 * Alterna el estado activo/inactivo de un usuario. Si se desactiva, revoca todas sus sesiones.
 */
export async function toggleUserStatusAction(userId: string) {
  try {
    const session = await requireMasterRole();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const isSelf = session.id === user.id || session.email === user.email;
    if (isSelf) {
      return { success: false, error: 'No puede desactivar su propia cuenta en uso.' };
    }

    const newStatus = !user.isActive;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: newStatus },
    });

    // Si se desactiva, invalidar tokens y sesiones inmediatamente
    if (!newStatus) {
      await revokeAllUserSessions(userId, session.id, 'Account deactivated by Master');
    }

    await createAuditEntry({
      userId: session.id ?? null,
      action: newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: userId,
      details: { newStatus },
    });

    revalidatePath('/usuarios');
    return { success: true, isActive: newStatus };
  } catch (error: any) {
    console.error('Error in toggleUserStatusAction:', error);
    return { success: false, error: error.message || 'Error al cambiar estado' };
  }
}

/**
 * Desbloquea una cuenta bloqueada por múltiples intentos fallidos de contraseña.
 */
export async function unlockUserAccountAction(userId: string) {
  try {
    const session = await requireMasterRole();

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await createAuditEntry({
      userId: session.id ?? null,
      action: 'USER_ACCOUNT_UNLOCKED',
      entity: 'User',
      entityId: userId,
    });

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error in unlockUserAccountAction:', error);
    return { success: false, error: error.message || 'Error al desbloquear cuenta' };
  }
}

/**
 * Elimina permanentemente a un usuario del sistema (con comprobación de auto-eliminación).
 */
export async function deleteUserAction(userId: string) {
  try {
    const session = await requireMasterRole();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const isSelf = session.id === user.id || session.email === user.email;
    if (isSelf) {
      return { success: false, error: 'No puede eliminar su propia cuenta de administrador.' };
    }

    if (user.role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return { success: false, error: 'Permisos insuficientes. Solo un SuperAdmin puede eliminar cuentas con este rol.' };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await createAuditEntry({
      userId: session.id ?? null,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: userId,
      details: { deletedEmail: user.email, role: user.role },
    });

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteUserAction:', error);
    return { success: false, error: handlePrismaError(error) };
  }
}
