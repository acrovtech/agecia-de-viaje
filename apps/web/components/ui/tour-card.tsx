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

export function TourCard({
  title,
  imageSrc,
  duration,
  difficulty,
  altitude,
  groupSize,
  slug,
}: TourCardProps) {
  return (
    <Link href={`/tours/${slug}`} className="group block">
      <div className="bg-white rounded-[20px] transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-200 hover:border-[#062918]">
        {/* Top Image */}
        <div className="relative w-full h-[280px] overflow-hidden">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="font-bold text-[18px] text-center leading-snug text-gray-900 mb-3 line-clamp-2">
            {title}
          </h3>

          {/* Divider */}
          <hr className="border-gray-200 mb-4" />

          {/* Highlight Badge */}
          <div className="bg-gray-50 rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 mb-6 border border-gray-200">
            <ArrowUp className="w-4 h-4 text-[#062918]" />
            <span className="text-[14px] font-medium text-gray-900">
              Tour Recomendado
            </span>
          </div>

          {/* Tech Specs Grid - Match exactly with DB schema fields */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-auto">
            {/* Duration */}
            <div className="flex items-center gap-2">
              <Calendar className="w-[18px] h-[18px] text-[#0A3D2A]" />
              <span className="text-[13px] text-gray-700">{duration || '1 Día'}</span>
            </div>
            {/* Difficulty */}
            <div className="flex items-center gap-2">
              <PersonStanding className="w-[18px] h-[18px] text-[#0A3D2A]" />
              <span className="text-[13px] text-gray-700">{difficulty || 'Moderado'}</span>
            </div>
            {/* Altitude */}
            <div className="flex items-center gap-2">
              <Mountain className="w-[18px] h-[18px] text-[#0A3D2A]" />
              <span className="text-[13px] text-gray-700">{altitude || '3,400m'}</span>
            </div>
            {/* Group Size */}
            <div className="flex items-center gap-2">
              <Users className="w-[18px] h-[18px] text-[#0A3D2A]" />
              <span className="text-[13px] text-gray-700">{groupSize || 'Grupal'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
