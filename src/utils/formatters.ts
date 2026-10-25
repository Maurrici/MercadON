import { getMeasurementUnitLabel, type MeasurementUnit } from '@/domain/enums/MeasurementUnit';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const quantityFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
});

export function formatCurrencyFromCents(value: number): string {
  return currencyFormatter.format(value / 100);
}

export function formatCentsInput(value: number): string {
  return (value / 100).toFixed(2).replace('.', ',');
}

export function formatQuantityMilli(value: number, unit: MeasurementUnit): string {
  return `${quantityFormatter.format(value / 1000)} ${getMeasurementUnitLabel(unit)}`;
}

export function formatMilliInput(value: number): string {
  return quantityFormatter.format(value / 1000);
}
