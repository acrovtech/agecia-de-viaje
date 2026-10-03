'use client';

import React, { useState } from 'react';
import { Smartphone, MessageSquare } from 'lucide-react';
import type { AgencyProfileData } from '../types';

interface SocialSectionProps {
  initialProfile: AgencyProfileData;
}

export function SocialSection({ initialProfile }: SocialSectionProps) {
  const [socialBio, setSocialBio] = useState({
    title: initialProfile.name || 'Mi Agencia Travel',
    bio: initialProfile.description || 'Experiencias únicas y tours personalizados en Perú y el mundo.',
    whatsapp: '+51 987 654 321',
    whatsappMessage: '¡Hola! Quiero cotizar un tour para mis próximas vacaciones.',
    instagram: '@miagencia_viajes',
    tiktok: '@viajesconnosotros',
  });

  const labelClass = 'block text-xs font-semibold text-[#111111] mb-1.5';
  const inputClass =
    'block w-full rounded-lg border border-[#e5e7eb] p-2.5 text-xs text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111] transition-colors';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="product-card-surface p-4 bg-sky-50 border-sky-200 text-sky-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <Smartphone className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong>Página social móvil</strong> — Optimizada para Instagram, TikTok y WhatsApp. Tus clientes podrán cotizar tours y contactarte con 1 clic.
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200 text-sky-900 uppercase tracking-wider shrink-0">
          PRÓXIMAMENTE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="product-card-surface p-5 space-y-4">
            <h4 className="text-sm font-semibold text-[#111111]">
              Personalización de la página social
            </h4>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Enlace Público de tu Bio</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#6b7280] font-mono">travel.bio/</span>
                  <input
                    type="text"
                    value={initialProfile.slug}
                    readOnly
                    className={`${inputClass} mt-0 font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Título Principal de la Bio</label>
                <input
                  type="text"
                  value={socialBio.title}
                  onChange={(e) => setSocialBio({ ...socialBio, title: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Descripción / Subtítulo</label>
                <textarea
                  rows={2}
                  value={socialBio.bio}
                  onChange={(e) => setSocialBio({ ...socialBio, bio: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-[#e5e7eb] p-2.5 text-xs text-[#111111] bg-white shadow-product-card focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className={labelClass}>Botón Directo de WhatsApp</label>
                <input
                  type="text"
                  value={socialBio.whatsapp}
                  onChange={(e) => setSocialBio({ ...socialBio, whatsapp: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Mensaje Predeterminado de WhatsApp</label>
                <input
                  type="text"
                  value={socialBio.whatsappMessage}
                  onChange={(e) => setSocialBio({ ...socialBio, whatsappMessage: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div>
                  <label className={labelClass}>Instagram Handle</label>
                  <input
                    type="text"
                    value={socialBio.instagram}
                    onChange={(e) => setSocialBio({ ...socialBio, instagram: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>TikTok Handle</label>
                  <input
                    type="text"
                    value={socialBio.tiktok}
                    onChange={(e) => setSocialBio({ ...socialBio, tiktok: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => alert('Página social en fase de vista previa.')}
                className="product-button-primary"
              >
                Guardar página social (Vista preliminar)
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[300px] h-[580px] rounded-[38px] border-4 border-[#111111] bg-white shadow-2xl p-4 flex flex-col justify-between overflow-hidden relative">
            <div className="w-24 h-4 bg-[#111111] rounded-b-xl mx-auto -mt-4 mb-3"></div>

            <div className="text-center space-y-2 flex-1">
              <div className="w-16 h-16 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                {socialBio.title[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <h5 className="font-bold text-xs text-[#111111]">{socialBio.title}</h5>
                <p className="text-[10px] text-[#6b7280] leading-tight mt-0.5 max-w-[220px] mx-auto">
                  {socialBio.bio}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Escribir por WhatsApp</span>
                </button>
              </div>

              <div className="pt-3 space-y-2 text-left">
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">
                  Tours Destacados
                </span>
                <div className="p-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-[#111111] block">City Tour Cusco</span>
                    <span className="text-[10px] text-[#6b7280]">Medio día · Guía oficial</span>
                  </div>
                  <span className="font-bold text-[#111111]">$40</span>
                </div>
                <div className="p-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-[#111111] block">Valle Sagrado VIP</span>
                    <span className="text-[10px] text-[#6b7280]">Día completo · Almuerzo</span>
                  </div>
                  <span className="font-bold text-[#111111]">$85</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-center gap-3 text-xs text-[#6b7280]">
              <span>{socialBio.instagram}</span>
              <span>·</span>
              <span>{socialBio.tiktok}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
