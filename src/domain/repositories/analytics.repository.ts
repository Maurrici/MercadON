import type { DateRange } from '@/domain/analytics-period';
import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ProductCommercializationType } from '@/domain/enums/ProductCommercializationType';
import type { ISODate, ISODateTime, UUID } from '@/domain/types';

export type SpendingSummaryRecord = {
  totalPriceCents: number;
  completedPurchaseCount: number;
};

export type CategorySpendingRecord = {
  categoryId: UUID | null;
  categoryName: string | null;
  totalPriceCents: number;
};

export type ProductSpendingRecord = {
  productId: UUID;
  productName: string;
  productBrand: string | null;
  totalPriceCents: number;
  purchaseCount: number;
};

export type AnalyticsProductRecord = {
  productId: UUID;
  productName: string;
  productBrand: string | null;
  currentCommercializationType: ProductCommercializationType;
  currentMeasurementUnit: MeasurementUnit | null;
};

export type PriceOccurrenceRecord = {
  itemId: UUID;
  purchaseId: UUID;
  productId: UUID;
  productName: string;
  productBrand: string | null;
  currentCommercializationType: ProductCommercializationType;
  currentMeasurementUnit: MeasurementUnit | null;
  marketId: UUID;
  marketName: string;
  purchasedAt: ISODate;
  itemCreatedAt: ISODateTime;
  commercializationType: ProductCommercializationType;
  quantityMilli: number;
  quantityUnit: MeasurementUnit;
  unitPriceCents: number | null;
  totalPriceCents: number;
};

export type AnalyticsRepository = {
  getSpendingSummary(range: DateRange): Promise<SpendingSummaryRecord>;
  listCategorySpending(range: DateRange): Promise<CategorySpendingRecord[]>;
  listProductSpending(range: DateRange): Promise<ProductSpendingRecord[]>;
  findProduct(productId: UUID): Promise<AnalyticsProductRecord | null>;
  listPriceOccurrences(productId?: UUID): Promise<PriceOccurrenceRecord[]>;
};
