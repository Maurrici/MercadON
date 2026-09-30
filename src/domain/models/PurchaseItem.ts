import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ISODateTime, UUID } from '@/domain/types';

export type PurchaseItem = {
  id: UUID;

  purchaseId: UUID;
  productId: UUID;

  quantityMilli: number;
  quantityUnit: MeasurementUnit;

  unitPriceCents: number | null;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};