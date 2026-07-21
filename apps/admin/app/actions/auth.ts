'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validEmail = process.env.ADMIN_EMAIL || 'admin@incabound.com';
  const validPassword = process.env.ADMIN_PASSWORD || 'IncaBound2026!';

  if (!email || !password) {
    return { error: 'Por favor complete todos los campos' };
  }

  if (email.trim().toLowerCase() === validEmail.trim().toLowerCase() && password === validPassword) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    redirect('/');
  }

  return { error: 'Credenciales incorrectas. Verifique su correo y contraseña.' };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/login');
}
