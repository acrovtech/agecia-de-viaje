'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import bcrypt from 'bcryptjs';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor complete todos los campos' };
  }

  // 1. Check if user exists in DB
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (!user) {
    return { error: 'Credenciales incorrectas. Verifique su correo y contraseña.' };
  }

  // 2. Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: 'Credenciales incorrectas. Verifique su correo y contraseña.' };
  }

  // 3. Set Session Cookie with Role
  const cookieStore = await cookies();
  cookieStore.set('admin_session', user.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  redirect('/');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/login');
}
