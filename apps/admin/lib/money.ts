export function formatMoneyAmount(
  totalPrice: number,
  totalMinor?: number | null,
  currency?: string
): string {
  const amount =
    typeof totalMinor === 'number' && !isNaN(totalMinor)
      ? totalMinor / 100
      : typeof totalPrice === 'number' && !isNaN(totalPrice)
      ? totalPrice
      : 0;
  const curr = currency || 'USD';
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  } catch {
    return `${curr} ${amount.toFixed(2)}`;
  }
}
