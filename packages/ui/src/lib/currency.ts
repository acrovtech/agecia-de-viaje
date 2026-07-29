/**
 * Formatea montos numéricos en formato de moneda (USD por defecto, o PEN).
 * @param amount - Monto numérico
 * @param currency - 'USD' | 'PEN'
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: 'USD' | 'PEN' = 'USD'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  const formattedNumber = isNaN(num) ? '0.00' : num.toFixed(2);

  if (currency === 'PEN') {
    return `S/ ${formattedNumber}`;
  }

  return `US$ ${formattedNumber}`;
}
