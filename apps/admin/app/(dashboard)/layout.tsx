import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserNavDropdown } from '@/components/layout/user-nav-dropdown';
import { MobileSidebarDrawer } from '@/components/layout/mobile-sidebar-drawer';
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown';
import { TitleProvider } from '@/components/ui/title-context';
import { InactivityTimer } from '@/components/inactivity-timer';
import { getRecentNotificationsAction } from '@/app/actions/reservation';
import { verifyAdminSession } from '@/lib/auth-check';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifyAdminSession();
  const isMaster = session ? session.role === 'MASTER' : true;
  const userEmail = session?.email || (isMaster ? 'admin@incabound.com' : 'gestion@incabound.com');
  const userInitials = isMaster ? 'AD' : 'GE';
  const userName = isMaster ? 'Adriano Admin' : 'Gestión Inca Bound';
  const userRole = isMaster ? 'Administrador Master' : 'Gestor de Contenidos';

  // Cargar notificaciones iniciales desde el servidor
  const notifRes = await getRecentNotificationsAction();
  const initialNotifications = notifRes.notifications || [];

  return (
    <TitleProvider>
      <InactivityTimer />
      <div className="flex flex-col min-h-screen md:h-screen w-full md:overflow-hidden bg-[#EBEBEB] font-sans">
        
        {/* TOPBAR NEGRO SHOPIFY ADMIN (#0a0a0a) */}
        <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between bg-[#0a0a0a] text-white px-4 shrink-0 shadow-sm text-xs select-none">
          
          {/* Izquierda: Logo Incabound & Mobile Drawer */}
          <div className="flex items-center gap-2.5">
            <MobileSidebarDrawer isMaster={isMaster} userEmail={userEmail} />

            <Link href="/" className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight italic font-serif text-white">incabound</span>
            </Link>
          </div>

          {/* Derecha: Notificaciones y Dropdown de Usuario */}
          <div className="flex items-center gap-3">
            
            {/* Componente Interactivo de Notificaciones de Reservas */}
            <NotificationsDropdown initialNotifications={initialNotifications} />

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

        {/* BODY CONTAINER (Fluido en Mobile, Bloqueado a viewport en Desktop) */}
        <div className="flex w-full flex-1 min-h-0 pt-14 md:overflow-hidden">
          
          {/* SIDEBAR NAVEGACIÓN POLARIS (#EBEBEB) */}
          <div className="hidden md:flex md:w-[240px] lg:w-[240px] md:flex-col h-full shrink-0 shadow-xs z-20">
            <SidebarNav isMaster={isMaster} userEmail={userEmail} />
          </div>

          {/* CONTENIDO PRINCIPAL (#F1F1F1) */}
          <div className="flex-1 flex flex-col min-h-full min-w-0 md:h-full md:overflow-y-auto bg-[#F1F1F1]">
            <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 w-full max-w-full min-w-0">
              {children}
            </main>
          </div>

        </div>

      </div>
    </TitleProvider>
  );
}
