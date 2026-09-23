'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createAdminToken } from '../../lib/jwt';
import { API_SESSION_COOKIE, isApiAdmin } from '../../lib/admin-mode';
import { centralLogin, centralLogout, CentralApiError } from '../../lib/central-api';

const EIGHT_HOURS_IN_SECONDS = 60 * 60 * 8; // 8 Horas de sesión laboral segura

const LoginSchema = z.object({
  email: z.string().email('Ingrese un correo electrónico válido').min(1, 'El correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function loginAction(prevState: any, formData: FormData) {
  if (isApiAdmin()) {
    const parsed = z.object({
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(1).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
      agencySlug: z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    }).safeParse({ email: formData.get('email'), password: formData.get('password'), agencySlug: formData.get('agencySlug') });
    if (!parsed.success) return { error: 'Revisa el correo, contraseña y código de agencia.' };
    try {
      const session = await centralLogin(parsed.data.email, parsed.data.password, parsed.data.agencySlug);
      const store = await cookies();
      store.set(API_SESSION_COOKIE, session.accessToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
        expires: new Date(session.expiresAt),
      });
      store.delete('admin_session');
    } catch (error) {
      return { error: error instanceof CentralApiError && error.status === 401
        ? 'No pudimos iniciar sesión. Revisa tus credenciales y el acceso a la agencia.'
        : 'No pudimos iniciar sesión en este momento. Inténtalo nuevamente en unos minutos.' };
    }
    redirect('/workspace');
  }
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Credenciales inválidas' };
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check if user exists in DB
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    // Audit attempt for unknown email
    await prisma.adminAuditLog.create({
      data: {
        action: 'LOGIN_FAILED_UNKNOWN_USER',
        entity: 'User',
        details: { email: normalizedEmail },
      }
    }).catch(() => null);
    return { error: 'Credenciales incorrectas. Verifique su correo y contraseña.' };
  }

  // 1.1 Check if account is temporarily locked (anti brute-force defense)
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / (60 * 1000));
    return {
      error: `Cuenta temporalmente bloqueada por exceso de intentos fallidos. Intente nuevamente en ${minutesLeft} minuto(s).`
    };
  }

  // 1.2 Check if account is active
  if (!user.isActive) {
    return { error: 'Esta cuenta se encuentra desactivada. Comuníquese con el Administrador Master.' };
  }

  // 2. Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= 5;
    const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        ...(shouldLock ? { lockedUntil } : {}),
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        userId: user.id,
        action: shouldLock ? 'ACCOUNT_LOCKED_BRUTE_FORCE' : 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        details: { failedAttempts: newFailedAttempts, shouldLock },
      }
    }).catch(() => null);

    if (shouldLock) {
      return {
        error: 'Demasiados intentos fallidos. La cuenta ha sido bloqueada temporalmente por 15 minutos.'
      };
    }

    const remaining = Math.max(0, 5 - newFailedAttempts);
    return {
      error: `Credenciales incorrectas. Verifique su correo y contraseña. (Intentos restantes: ${remaining})`
    };
  }

  // 2.1 Reset failure counter and update last login telemetry
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
    }
  }).catch(() => null);

  // 3. Create Signed JWT Token (id + name + role + email + tokenVersion + 8-hour expiration)
  const sessionToken = await createAdminToken({
    id: user.id,
    name: user.name || undefined,
    role: user.role,
    email: user.email,
    tokenVersion: user.tokenVersion,
  });

  // 4. Set Secure Session Cookie with 8-Hour Limit
  const cookieStore = await cookies();
  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EIGHT_HOURS_IN_SECONDS, // 8 horas
    path: '/',
  });

  redirect('/');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  if (isApiAdmin()) {
    const token = cookieStore.get(API_SESSION_COOKIE)?.value;
    if (token) {
      let failed = false;
      try { await centralLogout(token); } catch { failed = true; }
      if (failed) redirect('/workspace?logout=unavailable');
    }
    cookieStore.delete(API_SESSION_COOKIE);
  }
  cookieStore.delete('admin_session');
  redirect('/login');
}
