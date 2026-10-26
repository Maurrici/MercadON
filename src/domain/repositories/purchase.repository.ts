import type { Purchase } from '@/domain/models/Purchase';
import type { ISODateTime, UUID } from '@/domain/types';

export type PurchaseSummary = Extract<Purchase, { status: 'COMPLETED' }> & {
  marketName: string;
  itemCount: number;
  totalPriceCents: number;
};

export type SaveDraftPurchaseRecord = {
  id: UUID;
  marketId: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type PurchaseRepository = {
  findActiveDraft(): Promise<Purchase | null>;
  findById(id: UUID): Promise<Purchase | null>;
  listCompleted(): Promise<PurchaseSummary[]>;
  createDraft(input: SaveDraftPurchaseRecord): Promise<Purchase>;
  updateDraftMarket(id: UUID, marketId: UUID, updatedAt: ISODateTime): Promise<Purchase>;
  completeDraft(id: UUID, purchasedAt: ISODateTime, updatedAt: ISODateTime): Promise<Purchase>;
  softDeleteDraft(id: UUID, deletedAt: ISODateTime): Promise<void>;
  updateCompleted(
    id: UUID,
    marketId: UUID,
    purchasedAt: ISODateTime,
    updatedAt: ISODateTime,
  ): Promise<Purchase>;
  deleteCompleted(id: UUID): Promise<void>;
};
