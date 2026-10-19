'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PLATFORM_SESSION_COOKIE } from '../../lib/admin-mode';
import { platformLogin, platformLogout } from '../../lib/platform-api';
import { CentralApiError } from '../../lib/central-api';

const platformLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingrese un correo electrónico válido').max(254),
  password: z.string().min(1, 'La contraseña es requerida').refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'La contraseña excede el límite permitido',
  }),
});

export async function platformLoginAction(_prevState: any, formData: FormData) {
  const parsed = platformLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Credenciales inválidas' };
  }

  try {
    const session = await platformLogin(parsed.data.email, parsed.data.password);
    const store = await cookies();
    store.set(PLATFORM_SESSION_COOKIE, session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(session.expiresAt),
    });
  } catch (error) {
    return {
      error:
        error instanceof CentralApiError && error.status === 401
          ? 'Credenciales incorrectas o cuenta de plataforma no autorizada.'
          : error instanceof CentralApiError && error.status === 403
            ? 'Acceso denegado a la consola de plataforma.'
            : 'No pudimos iniciar sesión en este momento. Inténtalo más tarde.',
    };
  }

  redirect('/platform');
}

export async function platformLogoutAction() {
  const store = await cookies();
  const token = store.get(PLATFORM_SESSION_COOKIE)?.value;
  if (token) {
    try {
      await platformLogout(token);
    } catch {}
  }
  store.delete(PLATFORM_SESSION_COOKIE);
  redirect('/platform/login');
}
