/**
 * Utility formatters for Vietnamese Locale and DSS Metrics
 */

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number | null | undefined, maxDecimals: number = 0): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: maxDecimals,
  }).format(val);
}

export function formatPercent(val: number | null | undefined, decimals: number = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: decimals,
  }).format(val)}%`;
}

export function formatDate(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDaysOfSupply(dos: number | null | undefined): string {
  if (dos === null || dos === undefined || isNaN(dos)) return 'N/A';
  if (dos <= 0) return '0 ngày';
  if (dos > 999) return '> 999 ngày';
  return `${dos.toFixed(1)} ngày`;
}
