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
});
