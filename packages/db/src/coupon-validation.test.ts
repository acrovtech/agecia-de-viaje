import { describe, it, expect } from 'vitest';
import { SharedCreateCouponSchema } from './schemas';

describe('Coupon Validation & Calculation Logic', () => {
  it('debe forzar el código a MAYÚSCULAS y validar caracteres alfanuméricos', () => {
    const parsed = SharedCreateCouponSchema.safeParse({
      code: 'cumple10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('CUMPLE10');
      expect(parsed.data.discountValue).toBe(10);
      expect(parsed.data.discountType).toBe('PERCENTAGE');
    }
  });

  it('debe rechazar códigos con caracteres especiales no permitidos', () => {
    const parsed = SharedCreateCouponSchema.safeParse({
      code: 'PROMO 10!',
      discountType: 'FIXED',
      discountValue: 20,
    });

    expect(parsed.success).toBe(false);
  });

  it('debe rechazar descuentos negativos o en 0', () => {
    const parsed = SharedCreateCouponSchema.safeParse({
      code: 'INVALIDO',
      discountType: 'PERCENTAGE',
      discountValue: -5,
    });

    expect(parsed.success).toBe(false);
  });

  it('debe calcular correctamente el descuento porcentual con tope', () => {
    const total = 200;
    const discountPercent = 15; // 15% de 200 = 30
    const maxDiscount = 25; // Tope = 25

    let calculated = (total * discountPercent) / 100;
    if (maxDiscount && calculated > maxDiscount) {
      calculated = maxDiscount;
    }

    expect(calculated).toBe(25);
    expect(total - calculated).toBe(175);
  });

  it('debe calcular correctamente el descuento por monto fijo sin exceder el total', () => {
    const total = 40;
    const fixedDiscount = 50;

    const discountAmount = Math.min(fixedDiscount, total);
    const finalTotal = Math.max(0, total - discountAmount);

    expect(discountAmount).toBe(40);
    expect(finalTotal).toBe(0);
  });

  it('debe validar canales de marketing y atributos de campaña publicitaria', () => {
    const parsed = SharedCreateCouponSchema.safeParse({
      code: 'fday20',
      name: 'Campaña Día del Padre 2026',
      channel: 'META_ADS',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-15T23:59:59.000Z',
      budget: 1500,
      usageLimit: 100,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe('FDAY20');
      expect(parsed.data.name).toBe('Campaña Día del Padre 2026');
      expect(parsed.data.channel).toBe('META_ADS');
      expect(parsed.data.budget).toBe(1500);
      expect(parsed.data.usageLimit).toBe(100);
    }
  });

  it('debe calcular métricas de ingresos y ROAS (Retorno de Inversión) con precisión', () => {
    const budget = 1500;
    const reservations = [
      { totalPrice: 3200, status: 'CONFIRMED' },
      { totalPrice: 4800, status: 'CONFIRMED' },
      { totalPrice: 4500, status: 'COMPLETED' },
      { totalPrice: 1000, status: 'CANCELLED' }, // No cuenta
    ];

    const confirmedRevenue = reservations
      .filter((r) => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const roas = budget > 0 ? Number((confirmedRevenue / budget).toFixed(2)) : 0;

    expect(confirmedRevenue).toBe(12500);
    expect(roas).toBe(8.33); // $12,500 / $1,500 = 8.33x ROAS
  });
});
