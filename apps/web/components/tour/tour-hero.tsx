import Image from 'next/image';

export function TourHero({ tour }: { tour: any }) {
  return (
    <div className="relative pt-20 w-full bg-gray-900 flex flex-col justify-end min-h-[80dvh]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image src={tour.image} alt={tour.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-black/30" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-32 pb-16 flex flex-col items-center md:items-start">
        <div className="max-w-4xl text-center md:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg leading-tight font-heading mb-4">
            {tour.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs md:text-sm text-white mb-6 font-medium">
            <span className="hover:text-gray-200 cursor-pointer transition-colors">Inicio</span>
            <span className="text-white/60">/</span>
            <span className="hover:text-gray-200 cursor-pointer transition-colors">Tours</span>
            <span className="text-white/60">/</span>
            <span className="text-white">{tour.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
