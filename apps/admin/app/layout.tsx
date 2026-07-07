import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Compass, Menu, Bell, CircleUser } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title';
import { SidebarNav } from '@/components/layout/sidebar-nav';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Incabound Admin",
  description: "Panel de administración de tours",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} overflow-hidden h-screen bg-muted/20`}>
        {/* Layout de H-Screen para que el Sidebar sea fijo */}
        <div className="flex h-screen w-full">
          
          {/* SIDEBAR COMPLETO (FIJO) */}
          <div className="hidden border-r bg-muted/40 md:flex md:w-[176px] lg:w-[176px] xl:w-[280px] md:flex-col h-screen shrink-0">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 shrink-0">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Compass className="h-6 w-6 text-primary" />
                <span className="text-lg">Incabound</span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <SidebarNav />
            </div>
          </div>

          {/* MAIN CONTENT AREA (SCROLLABLE) */}
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            
            {/* TOPBAR */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 shrink-0">
              {/* Botón de menú móvil */}
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

              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notificaciones</span>
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </div>
            </header>
            
            {/* DYNAMIC CONTENT */}
            <main className="flex-1 flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
