'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePageTitle } from './title-context';

import { Slash } from 'lucide-react';

export function DynamicPageTitle() {
  const pathname = usePathname();
  const { title: customTitle } = usePageTitle();
  
  let title = 'Panel de Control';
  let showBack = false;
  let backUrl = '/';

  if (customTitle) {
    title = customTitle;
    if (pathname?.startsWith('/tours/')) {
      showBack = true;
      backUrl = '/tours';
    } else if (pathname?.startsWith('/blogs/')) {
      showBack = true;
      backUrl = '/blogs';
    }
  } else if (pathname === '/') {
    title = 'Dashboard';
  } else if (pathname === '/tours') {
    title = 'Listado de Tours';
  } else if (pathname === '/tours/new') {
    title = 'Crear Tour';
    showBack = true;
    backUrl = '/tours';
  } else if (pathname?.startsWith('/tours/')) {
    title = 'Editar Tour';
    showBack = true;
    backUrl = '/tours';
  } else if (pathname === '/blogs') {
    title = 'Gestión de Blogs';
  } else if (pathname === '/categories') {
    title = 'Gestión de Categorías';
  } else if (pathname === '/megamenus') {
    title = 'Gestión de Megamenús';
  } else if (pathname === '/blogs/new') {
    title = 'Nuevo Artículo de Blog';
    showBack = true;
    backUrl = '/blogs';
  } else if (pathname?.startsWith('/blogs/')) {
    title = 'Editar Artículo de Blog';
    showBack = true;
    backUrl = '/blogs';
  }
  
  const titleParts = title.split(' > ');
  
  return (
    <div className="flex items-center gap-2">
      {showBack && (
        <Link href={backUrl} className="hidden lg:inline-flex text-muted-foreground hover:text-foreground mr-2 p-1 rounded-md hover:bg-muted transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {titleParts.map((part, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className={`text-base ${index === titleParts.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              {part}
            </span>
            {index < titleParts.length - 1 && (
              <Slash className="w-4 h-4 text-muted-foreground/50 rotate-[-15deg]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
