import type { MonthKey } from '@/domain/analytics-period';
import type { AnalyticPriceUnit, SpendingComparisonState } from '@/services/analytics.service';
import { formatCurrencyFromCents } from '@/utils/formatters';

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortMonthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatMonth(month: MonthKey): string {
  return capitalize(monthFormatter.format(toUTCMonthDate(month)));
}

export function formatShortMonth(month: MonthKey): string {
  return shortMonthFormatter.format(toUTCMonthDate(month)).replace('.', '');
}

export function formatCivilDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`)).replace('.', '');
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const date = toUTCMonthDate(month);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}` as MonthKey;
}

export function formatPercentageTenths(value: number): string {
  return `${value > 0 ? '+' : ''}${(value / 10).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatComparison(
  state: SpendingComparisonState,
  differenceCents: number,
  percentageTenths: number | null,
): string {
  if (state === 'both_zero') return 'Nenhum gasto nos dois períodos';
  if (state === 'no_previous') {
    return `${formatSignedCurrency(differenceCents)} · mês anterior sem gastos`;
  }
  return `${formatSignedCurrency(differenceCents)} · ${formatPercentageTenths(
    percentageTenths ?? 0,
  )} em relação ao período anterior`;
}

export function formatAnalyticUnit(unit: AnalyticPriceUnit): string {
  if (unit === 'UNIT') return 'un';
  if (unit === 'KG') return 'kg';
  return 'L';
}

export function formatNormalizedPrice(cents: number, unit: AnalyticPriceUnit): string {
  return `${formatCurrencyFromCents(cents)}/${formatAnalyticUnit(unit)}`;
}

export function truncateLabel(value: string, maximum = 18): string {
  return value.length <= maximum ? value : `${value.slice(0, maximum - 1).trimEnd()}…`;
}

function formatSignedCurrency(value: number): string {
  if (value === 0) return formatCurrencyFromCents(0);
  return `${value > 0 ? '+' : '−'}${formatCurrencyFromCents(Math.abs(value))}`;
}

function toUTCMonthDate(month: MonthKey): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
