'use server';

import { prisma } from '@repo/db';

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  discountAmount?: number;
  newTotal?: number;
  error?: string;
}

/**
 * Valida un cupón comercial ingresado por el cliente en el checkout del e-commerce.
 * Comprueba:
 * 1. Existencia del código en mayúsculas
 * 2. Estado activo
 * 3. Fecha de caducidad
 * 4. Límite de usos máximos permitidos
 * 5. Importe mínimo de compra requerido
 */
export async function validateCouponAction(
  rawCode: string,
  currentTotal: number
): Promise<CouponValidationResult> {
  try {
    if (!rawCode || typeof rawCode !== 'string') {
      return { valid: false, error: 'Ingresa un código de cupón.' };
    }

    const cleanCode = rawCode.trim().toUpperCase();
    const total = Math.max(0, Number(currentTotal) || 0);

    const coupon = await (prisma as any).coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      return { valid: false, error: `El cupón "${cleanCode}" no es válido.` };
    }

    if (!coupon.isActive) {
      return { valid: false, error: `El cupón "${cleanCode}" ha expirado o se encuentra pausado.` };
    }

    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return { valid: false, error: `El cupón "${cleanCode}" expiró el ${new Date(coupon.expiresAt).toLocaleDateString('es-PE')}.` };
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return { valid: false, error: `El cupón "${cleanCode}" ha alcanzado su límite máximo de usos permitidos.` };
    }

    if (coupon.minSpend && total < coupon.minSpend) {
      return { 
        valid: false, 
        error: `Este cupón requiere una compra mínima de $${coupon.minSpend.toFixed(2)} USD (Subtotal actual: $${total.toFixed(2)} USD).` 
      };
    }

    // Calcular importe de descuento
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (total * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // Monto fijo
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, total);
    discountAmount = Math.round(discountAmount * 100) / 100;
    const newTotal = Math.max(0, Math.round((total - discountAmount) * 100) / 100);

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      newTotal,
    };
  } catch (error: any) {
    console.error('Error in validateCouponAction:', error);
    return { valid: false, error: 'Ocurrió un error al validar el cupón.' };
  }
}
