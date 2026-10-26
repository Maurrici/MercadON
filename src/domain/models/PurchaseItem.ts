import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ProductCommercializationType } from '@/domain/enums/ProductCommercializationType';
import type { ISODateTime, UUID } from '@/domain/types';

type PurchaseItemBase = {
  id: UUID;

  purchaseId: UUID;
  productId: UUID;

  quantityMilli: number;
  totalPriceCents: number;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
};

export type PurchaseItemPricing =
  | {
      commercializationType: Extract<ProductCommercializationType, 'FIXED'>;
      quantityUnit: Extract<MeasurementUnit, 'UNIT'>;
      unitPriceCents: number;
    }
  | {
      commercializationType: Extract<ProductCommercializationType, 'VARIABLE'>;
      quantityUnit: MeasurementUnit;
      unitPriceCents: null;
    };

export type PurchaseItem = PurchaseItemBase & PurchaseItemPricing;
