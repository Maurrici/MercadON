import { isISODate } from '@/domain/date';
import type { ISODate } from '@/domain/types';

export type MonthKey = `${number}-${number}`;

export type DateRange = {
  startDate: ISODate;
  endExclusive: ISODate;
};

export type MonthlyPeriod = {
  month: MonthKey;
  range: DateRange;
  isPartial: boolean;
};

export type MonthlyComparisonPeriod = {
  current: MonthlyPeriod;
  previous: MonthlyPeriod;
};

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function isMonthKey(value: string): value is MonthKey {
  if (!MONTH_KEY_PATTERN.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function monthKeyFromDate(date: ISODate): MonthKey {
  return date.slice(0, 7) as MonthKey;
}

export function buildMonthlyComparisonPeriod(
  month: MonthKey,
  today: ISODate,
): MonthlyComparisonPeriod {
  requireMonthKey(month);
  requireISODate(today);

  const currentMonth = monthKeyFromDate(today);
  if (month > currentMonth) throw new Error('Não é possível analisar um mês futuro.');

  const isCurrent = month === currentMonth;
  const currentStart = firstDayOfMonth(month);
  const currentEnd = isCurrent ? addDays(today, 1) : firstDayOfNextMonth(month);
  const previousMonth = addMonths(month, -1);
  const previousStart = firstDayOfMonth(previousMonth);
  const previousEnd = isCurrent
    ? addDays(
        isoDate(
          yearOf(previousMonth),
          monthOf(previousMonth),
          Math.min(dayOf(today), daysInMonth(previousMonth)),
        ),
        1,
      )
    : firstDayOfMonth(month);

  return {
    current: {
      month,
      range: { startDate: currentStart, endExclusive: currentEnd },
      isPartial: isCurrent,
    },
    previous: {
      month: previousMonth,
      range: { startDate: previousStart, endExclusive: previousEnd },
      isPartial: isCurrent && previousEnd !== firstDayOfMonth(month),
    },
  };
}

export function buildRecentMonthlyPeriods(today: ISODate, count = 6): MonthlyPeriod[] {
  requireISODate(today);
  if (!Number.isInteger(count) || count <= 0) throw new Error('Quantidade de meses inválida.');

  const currentMonth = monthKeyFromDate(today);
  return Array.from({ length: count }, (_, index) =>
    addMonths(currentMonth, index - count + 1),
  ).map((month) => {
    const isCurrent = month === currentMonth;
    return {
      month,
      range: {
        startDate: firstDayOfMonth(month),
        endExclusive: isCurrent ? addDays(today, 1) : firstDayOfNextMonth(month),
      },
      isPartial: isCurrent,
    };
  });
}

export function includesDate(range: DateRange, date: ISODate): boolean {
  return date >= range.startDate && date < range.endExclusive;
}

function firstDayOfMonth(month: MonthKey): ISODate {
  return isoDate(yearOf(month), monthOf(month), 1);
}

function firstDayOfNextMonth(month: MonthKey): ISODate {
  return firstDayOfMonth(addMonths(month, 1));
}

function addMonths(month: MonthKey, delta: number): MonthKey {
  const date = new Date(Date.UTC(yearOf(month), monthOf(month) - 1 + delta, 1));
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, '0')}` as MonthKey;
}

function addDays(date: ISODate, days: number): ISODate {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10) as ISODate;
}

function daysInMonth(month: MonthKey): number {
  return new Date(Date.UTC(yearOf(month), monthOf(month), 0)).getUTCDate();
}

function yearOf(value: MonthKey): number {
  return Number(value.slice(0, 4));
}

function monthOf(value: MonthKey): number {
  return Number(value.slice(5, 7));
}

function dayOf(value: ISODate): number {
  return Number(value.slice(8, 10));
}

function isoDate(year: number, month: number, day: number): ISODate {
  const value = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
    day,
  ).padStart(2, '0')}`;
  if (!isISODate(value)) throw new Error('Data analítica inválida.');
  return value;
}

function requireMonthKey(value: string): asserts value is MonthKey {
  if (!isMonthKey(value)) throw new Error('Mês inválido.');
}

function requireISODate(value: string): asserts value is ISODate {
  if (!isISODate(value)) throw new Error('Data de referência inválida.');
}
