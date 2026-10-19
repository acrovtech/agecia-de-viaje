import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { TENANT_HINT_COOKIE } from '../../lib/admin-mode';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{
    expired?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { expired } = await searchParams;
  const cookieStore = await cookies();
  const hint = cookieStore.get(TENANT_HINT_COOKIE)?.value;

  if (hint && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hint)) {
    redirect(`/a/${hint}/login${expired === '1' ? '?expired=1' : ''}`);
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FA] p-4 sm:p-6 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 flex flex-col items-center">
          <Image
            src="/icon.svg"
            alt="Logo"
            width={64}
            height={64}
            className="object-contain mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-[#111111] tracking-tight">
            Acceso para Agencias
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Plataforma de Gestión SaaS
          </p>
        </div>

        <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {expired === '1' && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Tu sesión expiró. Por favor, ingresa desde el enlace directo de tu agencia.</span>
            </div>
          )}

          <div className="space-y-4 text-slate-600 text-sm">
            <p className="font-medium text-slate-800">
              Accede desde el enlace de tu agencia.
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Cada agencia cuenta con un acceso exclusivo y seguro. Para iniciar sesión, ingresa a la dirección asignada a tu empresa:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 flex items-center justify-between">
              <span>/a/[tu-agencia]/login</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Si no conoces o has olvidado el enlace de acceso de tu empresa, comunícate con el administrador o propietario de tu agencia.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Acrov SaaS • Acceso restringido para personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
