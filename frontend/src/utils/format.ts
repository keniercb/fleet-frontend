import i18n from '@/i18n';

export type DateFormat = 'short' | 'long' | 'iso' | 'monthYear' | 'monthLong';

/**
 * Formatea una fecha según el locale activo de i18next.
 * @param date Fecha (Date, ISO string o null)
 * @param format Variante de formato: 'short' | 'long' | 'iso' | 'monthYear' | 'monthLong'
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: DateFormat = 'short'
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';

  const locale = i18n.language || 'es';

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    case 'long':
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    case 'iso':
      return d.toISOString().split('T')[0] ?? '';
    case 'monthYear':
      return new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
      }).format(d);
    case 'monthLong':
      return new Intl.DateTimeFormat(locale, { month: 'long' }).format(d);
    default:
      return new Intl.DateTimeFormat(locale).format(d);
  }
}

/**
 * Formatea un número según el locale activo.
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(i18n.language || 'es', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatea un número como moneda según el locale activo.
 */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD'
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(i18n.language || 'es', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)}`;
  }
}

/**
 * Formatea un porcentaje con signo según el locale activo.
 * Útil para badges de variación (positivo/negativo).
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(i18n.language || 'es', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: 'exceptZero',
  }).format(value / 100);
}

/**
 * Devuelve el nombre del mes (1-12) en el locale activo.
 */
export function getMonthName(monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) return '';
  const date = new Date(2024, monthNumber - 1, 1);
  return new Intl.DateTimeFormat(i18n.language || 'es', { month: 'long' }).format(date);
}

/**
 * Devuelve un array con los 12 meses en el locale activo.
 */
export function getMonthNames(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));
}
