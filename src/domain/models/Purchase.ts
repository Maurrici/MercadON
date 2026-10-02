import type { ISODateTime, UUID } from '@/domain/types';

type PurchaseBase = {
  id: UUID;
  marketId: UUID;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
};

export type Purchase = PurchaseBase & (
  | {
      status: 'DRAFT';
      purchasedAt: null;
    }
  | {
      status: 'COMPLETED';
      purchasedAt: ISODateTime;
    }
);