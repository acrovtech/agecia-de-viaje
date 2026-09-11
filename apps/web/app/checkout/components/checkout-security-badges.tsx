import { ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export function CheckoutSecurityBadges() {
  return (
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 sm:p-5 mt-6">
      <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
        <span>Garantía y Seguridad Oficial</span>
      </div>
      <ul className="space-y-2 text-xs text-gray-700">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Pasarela de pagos encriptada con certificación internacional SSL de 256 bits.</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Confirmación y voucher de reserva emitido inmediatamente tras el pago.</span>
        </li>
        <li className="flex items-start gap-2">
          <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Asistencia personalizada de nuestro equipo en Cusco 24/7 vía WhatsApp.</span>
        </li>
      </ul>
    </div>
  );
}
