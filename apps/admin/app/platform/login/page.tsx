import React from 'react';
import type { Metadata } from 'next';
import { PlatformLoginForm } from '../../../components/auth/platform-login-form';

export const metadata: Metadata = {
  title: 'Acceso Control de Plataforma | SaaS Admin',
  description: 'Panel de administración y control plane para SaaS multi-tenant.',
};

export const dynamic = 'force-dynamic';

export default async function PlatformLoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <PlatformLoginForm />
    </main>
  );
}
