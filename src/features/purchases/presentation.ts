import type { Market } from '@/domain/models/Market';
import type { Purchase } from '@/domain/models/Purchase';
import type { PurchaseDraftDetails } from '@/services/purchase.service';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type { PurchaseItemFormValues } from '@/components/purchase';
import { formatCentsInput, formatMilliInput } from '@/utils/formatters';

export type DraftSummary = {
  purchase: Extract<Purchase, { status: 'DRAFT' }>;
  marketName: string;
  itemCount: number;
  totalPriceCents: number;
};

export function toDraftSummary(details: PurchaseDraftDetails, markets: Market[]): DraftSummary {
  const market = markets.find((candidate) => candidate.id === details.purchase.marketId);
  return {
    purchase: details.purchase,
    marketName: market?.name ?? 'Mercado não disponível',
    itemCount: details.items.length,
    totalPriceCents: details.totalPriceCents,
  };
}

export function toPurchaseItemFormValues(item: PurchaseItem): PurchaseItemFormValues {
  return {
    quantity: formatMilliInput(item.quantityMilli),
    price: formatCentsInput(
      item.commercializationType === 'FIXED' ? item.unitPriceCents : item.totalPriceCents,
    ),
  };
}

export function formatPurchaseDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
}

export function parsePurchaseDateInput(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}T12:00:00.000Z`;
  const date = new Date(iso);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return iso;
}
