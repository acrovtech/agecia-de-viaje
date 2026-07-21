'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Master Admin (Tú)
  const masterEmail = process.env.MASTER_EMAIL || 'admin@incabound.com';
  const masterPassword = process.env.MASTER_PASSWORD || 'IncaBound2026!';
  
  // Client Admin (El cliente)
  const clientEmail = process.env.CLIENT_EMAIL || 'cliente@incabound.com';
  const clientPassword = process.env.CLIENT_PASSWORD || 'IncaBoundClient!';

  if (!email || !password) {
    return { error: 'Por favor complete todos los campos' };
  }

  const isMaster = email.trim().toLowerCase() === masterEmail.trim().toLowerCase() && password === masterPassword;
  const isClient = email.trim().toLowerCase() === clientEmail.trim().toLowerCase() && password === clientPassword;

  if (isMaster || isClient) {
    const role = isMaster ? 'master' : 'client';
    
    const cookieStore = await cookies();
    cookieStore.set('admin_session', role, {
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
