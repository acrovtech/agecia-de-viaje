import Image from 'next/image';
import Link from 'next/link';

export function TourHero({ tour }: { tour: any }) {
  const hasImage = Boolean(tour.image);

  return (
    <div className="relative pt-20 w-full bg-slate-950 flex flex-col justify-end min-h-[80dvh] overflow-hidden">
      {/* Background Image if uploaded */}
      {hasImage ? (
        <div className="absolute inset-0">
          <Image src={tour.image} alt={tour.title} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-black/40" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
      )}

      <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-24 pb-12 flex flex-col items-center md:items-start">
        <div className="max-w-4xl text-center md:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg leading-tight font-heading mb-4">
            {tour.title}
          </h1>
          {/* Breadcrumb Navegable */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs md:text-sm text-white/80 mb-2 font-medium">
            <Link href="/" className="hover:text-white transition-colors underline decoration-white/30 underline-offset-2">
              Inicio
            </Link>
            <span className="text-white/40">/</span>
            <Link href="/tours" className="hover:text-white transition-colors underline decoration-white/30 underline-offset-2">
              Tours
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-white font-semibold">{tour.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
