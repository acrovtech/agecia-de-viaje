import { Menu, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { logoutAction } from '../actions/auth';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* SIDEBAR COMPLETO (FIJO CON BRAND COLOR #062918) */}
      <div className="hidden border-r border-emerald-950/20 bg-[#062918] md:flex md:w-[200px] lg:w-[220px] xl:w-[260px] md:flex-col h-screen shrink-0 text-slate-100 shadow-xl">
        <div className="flex h-16 items-center border-b border-emerald-900/50 px-5 shrink-0 bg-[#041d11]">
          <Link href="/" className="flex items-center gap-3 font-semibold group">
            <div className="bg-white/10 p-1.5 rounded-xl group-hover:bg-white/20 transition-colors">
              <Image src="/icon.svg" alt="Inca Bound Logo" width={26} height={26} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base text-white font-bold tracking-wide leading-none">Inca Bound</span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase mt-0.5">Admin Panel</span>
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        {/* Footer Sidebar Logout */}
        <div className="p-4 border-t border-emerald-900/50 bg-[#041d11]">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-300 hover:text-white hover:bg-red-900/30 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 text-red-400 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50">
        
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 shrink-0 shadow-sm">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menú</span>
          </Button>
          
          <div className="flex-1 flex items-center">
            <DynamicPageTitle />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">Sistema Conectado</span>
            </div>

            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit" className="gap-2 text-xs font-semibold text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </header>
        
        {/* DYNAMIC CONTENT */}
        <main className="flex-1 flex flex-col gap-6 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
