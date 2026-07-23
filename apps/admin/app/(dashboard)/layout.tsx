import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNavDropdown } from '@/components/layout/user-nav-dropdown';
import { MobileSidebarDrawer } from '@/components/layout/mobile-sidebar-drawer';
import { TitleProvider } from '@/components/ui/title-context';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get('admin_session')?.value || 'MASTER';
  
  const isMaster = sessionRole === 'MASTER';
  const userInitials = isMaster ? 'AD' : 'CL';
  const userName = isMaster ? 'Adriano Admin' : 'Cliente Operador';
  const userEmail = isMaster ? 'master@incabound.com' : 'cliente@incabound.com';
  const userRole = isMaster ? 'Administrador Master' : 'Operador Cliente';

  return (
    <TitleProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#EBEBEB] font-sans">
        
        {/* TOPBAR NEGRO SHOPIFY ADMIN (#0a0a0a) */}
        <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-[#0a0a0a] text-white px-4 shrink-0 shadow-sm text-xs select-none">
          
          {/* Izquierda: Logo Incabound & Mobile Drawer */}
          <div className="flex items-center gap-2.5">
            <MobileSidebarDrawer />

            <Link href="/" className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight italic font-serif text-white">incabound</span>
            </Link>
          </div>

          {/* Derecha: Notificaciones y Dropdown de Usuario */}
          <div className="flex items-center gap-3">
            
            {/* Notificaciones (Para reservas y alertas) */}
            <button 
              type="button" 
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative" 
              title="Notificaciones de Reservas"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>

            <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

            {/* Componente Dropdown de Usuario */}
            <UserNavDropdown 
              userName={userName}
              userEmail={userEmail}
              userInitials={userInitials}
              userRole={userRole}
            />
          </div>

        </header>

        {/* BODY CONTAINER (debajo del header fijo) */}
        <div className="flex w-full h-full pt-14">
          
          {/* SIDEBAR NAVEGACIÓN POLARIS (#EBEBEB) */}
          <div className="hidden md:flex md:w-[240px] lg:w-[240px] md:flex-col h-full shrink-0 shadow-xs z-20">
            <SidebarNav />
          </div>

          {/* CONTENIDO PRINCIPAL (#F1F1F1) */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F1F1F1]">
            <main className="flex-1 px-6 py-6 w-full max-w-full">
              {children}
            </main>
          </div>

        </div>

      </div>
    </TitleProvider>
  );
}
