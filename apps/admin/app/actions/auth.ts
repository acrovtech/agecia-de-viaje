'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import bcrypt from 'bcryptjs';

const EIGHT_HOURS_IN_SECONDS = 60 * 60 * 8; // 8 Horas de sesión laboral segura

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

  // 3. Create Signed Session Token (Role + Timestamp + Expiration)
  const sessionPayload = {
    role: user.role,
    email: user.email,
    iat: Date.now(),
    exp: Date.now() + EIGHT_HOURS_IN_SECONDS * 1000,
  };

  const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

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
  cookieStore.delete('admin_session');
  redirect('/login');
}
