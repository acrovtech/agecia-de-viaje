import Link from 'next/link';
import Image from 'next/image';

export function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center z-50 shrink-0 my-auto">
      <Image
        src="/logo.svg"
        alt="Logo"
        width={90}
        height={90}
        className="w-[52px] h-[52px] md:w-[64px] md:h-[64px] object-contain transition-transform duration-300 hover:scale-105"
        priority
      />
    </Link>
  );
}
