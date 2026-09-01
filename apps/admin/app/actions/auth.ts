'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createAdminToken } from '@/lib/jwt';

const EIGHT_HOURS_IN_SECONDS = 60 * 60 * 8; // 8 Horas de sesión laboral segura

const LoginSchema = z.object({
  email: z.string().email('Ingrese un correo electrónico válido').min(1, 'El correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function loginAction(prevState: any, formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Credenciales inválidas' };
  }

  const { email, password } = parsed.data;

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

  // 3. Create Signed JWT Token (role + email + 8-hour expiration signed with ADMIN_SESSION_SECRET)
  const sessionToken = await createAdminToken({
    role: user.role,
    email: user.email,
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
  cookieStore.delete('admin_session');
  redirect('/login');
}
