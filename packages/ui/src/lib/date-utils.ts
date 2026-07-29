/**
 * Formatea fechas en español evitando TitleCase exagerado.
 * @param date - Objeto Date, string o null
 * @param format - 'short' (dd/mm/yyyy) | 'long' (28 de julio de 2026) | 'full' (martes, 28 de julio de 2026)
 */
export function formatSpanishDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'full' = 'long'
): string {
  if (!date) return 'Por confirmar';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Fecha inválida';

    if (format === 'short') {
      return dateObj.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    if (format === 'full') {
      return dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Por confirmar';
  }
}
