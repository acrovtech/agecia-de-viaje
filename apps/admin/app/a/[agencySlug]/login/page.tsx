import React from 'react';
import Link from 'next/link';
import { fetchPublicAdminLoginContext } from '@/lib/central-api';
import { TenantLoginForm } from '@/components/auth/tenant-login-form';
import { tenantLoginAction } from '@/app/actions/auth';
import { EmptyState } from '@/components/design-system/empty-state';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    agencySlug: string;
  }>;
  searchParams: Promise<{
    expired?: string;
  }>;
}

export default async function TenantBrandedLoginPage({ params, searchParams }: PageProps) {
  const { agencySlug } = await params;
  const { expired } = await searchParams;

  const context = await fetchPublicAdminLoginContext(agencySlug);

  if (!context) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FA] p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <EmptyState
            title="Agencia no disponible"
            description="El enlace ingresado no corresponde a ninguna agencia activa en la plataforma."
            action={
              <Link
                href="/login"
                className="inline-block mt-4 text-xs font-semibold text-slate-700 hover:text-black underline"
              >
                Volver a la página de acceso general
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const boundLoginAction = tenantLoginAction.bind(null, agencySlug);

  return (
    <TenantLoginForm
      action={boundLoginAction}
      agencySlug={agencySlug}
      context={context}
      isExpired={expired === '1'}
    />
  );
}
