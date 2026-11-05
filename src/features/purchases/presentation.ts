import type { Market } from '@/domain/models/Market';
import type { Purchase } from '@/domain/models/Purchase';
import type { PurchaseDraftDetails } from '@/services/purchase.service';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type { PurchaseItemFormValues } from '@/components/purchase';
import { isISODate } from '@/domain/date';
import type { ISODate } from '@/domain/types';
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

export function sortPurchaseItemsNewestFirst(items: readonly PurchaseItem[]): PurchaseItem[] {
  return [...items].sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
  );
}

export function shouldReturnToProductSelection(
  itemId: string | undefined,
  hasSelectedProduct: boolean,
): boolean {
  return !itemId && hasSelectedProduct;
}

export function formatPurchaseDate(value: ISODate): string {
  if (!isISODate(value)) throw new Error('Data de compra inválida.');
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function parsePurchaseDateInput(value: string): ISODate | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  return isISODate(iso) ? iso : null;
}
