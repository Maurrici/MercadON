import type { PurchaseItem, PurchaseItemPricing } from '@/domain/models/PurchaseItem';
import type { ISODateTime, UUID } from '@/domain/types';

type PurchaseItemValues = PurchaseItemPricing & {
  quantityMilli: number;
  totalPriceCents: number;
};

export type HistoricalPurchaseItem = PurchaseItem & {
  purchasedAt: ISODateTime;
};

export type SavePurchaseItemRecord = PurchaseItemValues & {
  id: UUID;
  purchaseId: UUID;
  productId: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type UpdatePurchaseItemRecord = PurchaseItemValues & {
  id: UUID;
  updatedAt: ISODateTime;
};

export type PurchaseItemRepository = {
  listActiveByPurchaseId(purchaseId: UUID): Promise<PurchaseItem[]>;
  findById(id: UUID): Promise<PurchaseItem | null>;
  findActiveByProduct(purchaseId: UUID, productId: UUID): Promise<PurchaseItem | null>;
  findLatestCompletedByProduct(
    productId: UUID,
    excludePurchaseId?: UUID,
  ): Promise<HistoricalPurchaseItem | null>;
  countActiveByPurchaseId(purchaseId: UUID): Promise<number>;
  sumActiveTotalByPurchaseId(purchaseId: UUID): Promise<number>;
  create(input: SavePurchaseItemRecord): Promise<PurchaseItem>;
  update(input: UpdatePurchaseItemRecord): Promise<PurchaseItem>;
  softDelete(id: UUID, deletedAt: ISODateTime): Promise<void>;
  softDeleteActiveByPurchaseId(purchaseId: UUID, deletedAt: ISODateTime): Promise<number>;
  hardDeleteByPurchaseId(purchaseId: UUID): Promise<number>;
};
