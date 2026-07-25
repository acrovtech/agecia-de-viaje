import Link from 'next/link';
import Image from 'next/image';

export function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center z-50 shrink-0">
      <Image
        src="/logo.svg"
        alt="Inca Bound Logo"
        width={90}
        height={90}
        className="w-[60px] h-[60px] md:w-[76px] md:h-[76px] object-contain transition-transform duration-300 hover:scale-105"
        priority
      />
    </Link>
  );
}
