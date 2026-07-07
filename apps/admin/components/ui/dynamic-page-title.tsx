'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function DynamicPageTitle() {
  const pathname = usePathname();
  
  let title = 'Panel de Control';
  let showBack = false;
  let backUrl = '/';

  if (pathname === '/') {
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
  }
  
  return (
    <div className="flex items-center gap-2">
      {showBack && (
        <Link href={backUrl} className="hidden lg:inline-flex text-muted-foreground hover:text-foreground mr-2 p-1 rounded-md hover:bg-muted transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
      )}
      <span className="text-base font-medium">{title}</span>
    </div>
  );
}
