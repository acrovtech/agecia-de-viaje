import Image from 'next/image';
import { Calendar, Mountain, Users, ArrowUp, PersonStanding } from 'lucide-react';
import Link from 'next/link';

export interface TourCardProps {
  title: string;
  imageSrc: string;
  duration: string;
  difficulty: string;
  altitude: string;
  groupSize: string;
  slug: string;
}

function formatAltitude(raw: string): string {
  if (!raw) return '3,400 m s. n. m.';
  // Limpiar cualquier variación de "m.s.n.m.", "m s n m", "msnm", "m", etc.
  const cleaned = raw.replace(/m\s*\.?\s*s\s*\.?\s*n\s*\.?\s*m\s*\.?/gi, '').replace(/\s*m\b/gi, '').trim();
  
  // Extraer el valor numérico
  const match = cleaned.match(/[\d.,]+/);
  if (!match) return `${raw} m s. n. m.`;

  let numStr = match[0];
  // Si son dígitos puros como 4200 o 3700, formatear con coma -> 4,200
  if (/^\d{4,}$/.test(numStr)) {
    numStr = parseInt(numStr, 10).toLocaleString('en-US');
  }

  return `${numStr} m s. n. m.`;
}

function formatGroupSize(raw: string): string {
  if (!raw) return 'Hasta 15';
  // Extraer sólo el número ingresado en el admin
  const match = raw.match(/\d+/);
  if (match) {
    return `Hasta ${match[0]}`;
  }
  return raw.startsWith('Hasta') ? raw : `Hasta ${raw}`;
}

export function TourCard({
  title,
  imageSrc,
  duration,
  difficulty,
  altitude,
  groupSize,
  slug,
}: TourCardProps) {
  const isValidImage = imageSrc && (imageSrc.startsWith('http') || imageSrc.startsWith('/uploads') || imageSrc.startsWith('data:image') || imageSrc.startsWith('/salkantay'));

  const formattedAltitude = formatAltitude(altitude);
  const formattedGroupSize = formatGroupSize(groupSize);

  return (
    <Link href={`/tours/${slug}`} scroll={true} className="group block h-full select-none">
      <div className="bg-white rounded-[20px] transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-200 hover:border-[#062918] hover:shadow-md">
        {/* Top Image */}
        <div className="relative w-full h-[240px] sm:h-[260px] overflow-hidden bg-slate-100 flex items-center justify-center">
          {isValidImage ? (
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized={true}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-100/90">
              <Mountain className="w-10 h-10 text-slate-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow justify-between">
          <div>
            {/* Title */}
            <h3 className="font-bold text-[17px] sm:text-[18px] text-center leading-snug text-gray-900 mb-3 line-clamp-2">
              {title}
            </h3>

            {/* Divider */}
            <hr className="border-gray-200/80 mb-3.5" />

            {/* Highlight Badge */}
            <div className="bg-gray-50 rounded-xl py-2 px-3.5 flex items-center justify-center gap-2 mb-4 border border-gray-200/80 shadow-2xs">
              <ArrowUp className="w-4 h-4 text-[#062918]" />
              <span className="text-[13px] font-semibold text-gray-900">
                Tour Recomendado
              </span>
            </div>
          </div>

          {/* Tech Specs Grid */}
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 pt-3.5 border-t border-gray-100 mt-auto">
            {/* Duration */}
            <div className="flex items-center gap-2 min-w-0" title={`Duración: ${duration}`}>
              <Calendar className="w-4 h-4 text-[#0A3D2A] shrink-0" />
              <span className="text-[12.5px] font-medium text-gray-700 truncate">{duration || '1 Día'}</span>
            </div>
            {/* Difficulty */}
            <div className="flex items-center gap-2 min-w-0" title={`Dificultad: ${difficulty}`}>
              <PersonStanding className="w-4 h-4 text-[#0A3D2A] shrink-0" />
              <span className="text-[12.5px] font-medium text-gray-700 truncate">{difficulty || 'Moderada'}</span>
            </div>
            {/* Altitude */}
            <div className="flex items-center gap-2 min-w-0" title={`Altitud: ${formattedAltitude}`}>
              <Mountain className="w-4 h-4 text-[#0A3D2A] shrink-0" />
              <span className="text-[12.5px] font-medium text-gray-700 truncate">{formattedAltitude}</span>
            </div>
            {/* Group Size */}
            <div className="flex items-center gap-2 min-w-0" title={`Grupo: ${formattedGroupSize}`}>
              <Users className="w-4 h-4 text-[#0A3D2A] shrink-0" />
              <span className="text-[12.5px] font-medium text-gray-700 truncate">{formattedGroupSize}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
