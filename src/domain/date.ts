import type { ISODate } from '@/domain/types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value: string): value is ISODate {
  if (!ISO_DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function toLocalISODate(date: Date = new Date()): ISODate {
  if (Number.isNaN(date.getTime())) throw new Error('Não foi possível determinar a data local.');

  const value = [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

  if (!isISODate(value)) throw new Error('A data local está fora do intervalo suportado.');
  return value;
}
