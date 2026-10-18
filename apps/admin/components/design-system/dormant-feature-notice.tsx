import React from 'react';
import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';
import { PageHeader } from './page-header';

export interface DormantFeatureNoticeProps {
  title: string;
  description?: string;
}

export function DormantFeatureNotice({
  title,
  description = 'Esta funcionalidad de transporte / despacho operativo no forma parte del producto activo v1.',
}: DormantFeatureNoticeProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={title}
        description="Capacidad inactiva en el catálogo del SaaS v1."
      />

      <div className="product-card-surface p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#f3f4f6] text-[#6b7280] flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-semibold text-[#111111]">
            Módulo no disponible en el producto activo
          </h3>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            {description} El SaaS está optimizado exclusivamente para la comercialización y gestión de <strong>Tours</strong>, <strong>Reservas</strong> y <strong>Reportes</strong>.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/catalog/tours"
            className="product-button-primary inline-flex items-center gap-2"
          >
            <span>Ir al catálogo de Tours</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard"
            className="product-button-secondary inline-flex items-center gap-2"
          >
            <span>Volver a Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
