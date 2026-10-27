import {
  buildMonthlyComparisonPeriod,
  buildRecentMonthlyPeriods,
  includesDate,
  monthKeyFromDate,
  type MonthKey,
  type MonthlyPeriod,
} from '@/domain/analytics-period';
import { toLocalISODate } from '@/domain/date';
import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type {
  AnalyticsProductRecord,
  AnalyticsRepository,
  PriceOccurrenceRecord,
} from '@/domain/repositories/analytics.repository';
import type { ISODate, UUID } from '@/domain/types';

export type SpendingComparisonState = 'comparable' | 'no_previous' | 'both_zero';

export type MonthlySpendingOverview = {
  period: MonthlyPeriod;
  previousPeriod: MonthlyPeriod;
  totalPriceCents: number;
  completedPurchaseCount: number;
  previousTotalPriceCents: number;
  differenceCents: number;
  percentageTenths: number | null;
  comparisonState: SpendingComparisonState;
};

export type MonthlySpendingPoint = {
  period: MonthlyPeriod;
  totalPriceCents: number;
};

export type CategorySpending = {
  categoryId: UUID | null;
  categoryName: string;
  totalPriceCents: number;
};

export type CategorySpendingAnalysis = {
  period: MonthlyPeriod;
  totalPriceCents: number;
  categories: CategorySpending[];
};

export type ProductSpending = {
  productId: UUID;
  productName: string;
  productBrand: string | null;
  totalPriceCents: number;
  purchaseCount: number;
};

export type ProductSpendingAnalysis = {
  period: MonthlyPeriod;
  totalPriceCents: number;
  products: ProductSpending[];
};

export type AnalyticPriceUnit = Extract<MeasurementUnit, 'UNIT' | 'KG' | 'L'>;

export type PriceHistoryOccurrence = {
  itemId: UUID;
  purchaseId: UUID;
  marketId: UUID;
  marketName: string;
  purchasedAt: ISODate;
  normalizedPriceCents: number;
};

export type ProductPriceHistory = {
  productId: UUID;
  productName: string;
  productBrand: string | null;
  unit: AnalyticPriceUnit;
  currentPriceCents: number | null;
  minimumPriceCents: number | null;
  maximumPriceCents: number | null;
  occurrences: PriceHistoryOccurrence[];
  incompatibleOccurrenceCount: number;
};

export type PriceVariation = {
  productId: UUID;
  productName: string;
  productBrand: string | null;
  unit: AnalyticPriceUnit;
  previousPriceCents: number;
  currentPriceCents: number;
  differenceCents: number;
  percentageTenths: number;
  latestPurchasedAt: ISODate;
};

export type PriceVariationAnalysis = {
  period: MonthlyPeriod;
  increases: PriceVariation[];
  decreases: PriceVariation[];
  zeroBaseCount: number;
};

export type AnalyticsService = {
  getMonthlyOverview(month?: MonthKey): Promise<MonthlySpendingOverview>;
  getRecentMonthlySpending(): Promise<MonthlySpendingPoint[]>;
  getCategorySpending(month?: MonthKey): Promise<CategorySpendingAnalysis>;
  getProductSpending(month?: MonthKey): Promise<ProductSpendingAnalysis>;
  getProductPriceHistory(productId: UUID): Promise<ProductPriceHistory | null>;
  getPriceVariations(month?: MonthKey): Promise<PriceVariationAnalysis>;
};

type AnalyticsServiceDependencies = {
  today?: () => ISODate;
};

type PriceRatio = {
  numerator: bigint;
  denominator: bigint;
  unit: AnalyticPriceUnit;
};

type NormalizedOccurrence = {
  source: PriceOccurrenceRecord;
  ratio: PriceRatio;
};

export function createAnalyticsService(
  repository: AnalyticsRepository,
  { today = () => toLocalISODate() }: AnalyticsServiceDependencies = {},
): AnalyticsService {
  const selectedPeriod = (month?: MonthKey) => {
    const referenceDate = today();
    return buildMonthlyComparisonPeriod(month ?? monthKeyFromDate(referenceDate), referenceDate);
  };

  return {
    async getMonthlyOverview(month) {
      const periods = selectedPeriod(month);
      const [current, previous] = await Promise.all([
        repository.getSpendingSummary(periods.current.range),
        repository.getSpendingSummary(periods.previous.range),
      ]);
      const comparison = compareCents(current.totalPriceCents, previous.totalPriceCents);

      return {
        period: periods.current,
        previousPeriod: periods.previous,
        totalPriceCents: current.totalPriceCents,
        completedPurchaseCount: current.completedPurchaseCount,
        previousTotalPriceCents: previous.totalPriceCents,
        ...comparison,
      };
    },

    async getRecentMonthlySpending() {
      const periods = buildRecentMonthlyPeriods(today());
      const summaries = await Promise.all(
        periods.map((period) => repository.getSpendingSummary(period.range)),
      );
      return periods.map((period, index) => ({
        period,
        totalPriceCents: summaries[index].totalPriceCents,
      }));
    },

    async getCategorySpending(month) {
      const { current } = selectedPeriod(month);
      const [summary, records] = await Promise.all([
        repository.getSpendingSummary(current.range),
        repository.listCategorySpending(current.range),
      ]);
      const categories = records
        .map((record) => ({
          categoryId: record.categoryId,
          categoryName: record.categoryName ?? 'Sem categoria',
          totalPriceCents: record.totalPriceCents,
        }))
        .sort(compareSpendingByName('categoryName'));
      ensureTotalsMatch(
        summary.totalPriceCents,
        categories.map((category) => category.totalPriceCents),
        'categorias',
      );
      return { period: current, totalPriceCents: summary.totalPriceCents, categories };
    },

    async getProductSpending(month) {
      const { current } = selectedPeriod(month);
      const [summary, records] = await Promise.all([
        repository.getSpendingSummary(current.range),
        repository.listProductSpending(current.range),
      ]);
      const products = [...records].sort(compareSpendingByName('productName'));
      ensureTotalsMatch(
        summary.totalPriceCents,
        products.map((product) => product.totalPriceCents),
        'produtos',
      );
      return { period: current, totalPriceCents: summary.totalPriceCents, products };
    },

    async getProductPriceHistory(productId) {
      const [product, records] = await Promise.all([
        repository.findProduct(productId),
        repository.listPriceOccurrences(productId),
      ]);
      if (!product) return null;

      const normalized = records.flatMap((record) => {
        const ratio = normalizeOccurrence(record, product);
        return ratio ? [{ source: record, ratio }] : [];
      });
      const occurrences = normalized.map(toHistoryOccurrence);
      const prices = normalized.map((occurrence) => occurrence.ratio);

      return {
        productId: product.productId,
        productName: product.productName,
        productBrand: product.productBrand,
        unit: analyticUnit(product),
        currentPriceCents: normalized.length > 0 ? roundPrice(normalized.at(-1)!.ratio) : null,
        minimumPriceCents: prices.length > 0 ? roundPrice(minimumRatio(prices)) : null,
        maximumPriceCents: prices.length > 0 ? roundPrice(maximumRatio(prices)) : null,
        occurrences,
        incompatibleOccurrenceCount: records.length - normalized.length,
      };
    },

    async getPriceVariations(month) {
      const { current } = selectedPeriod(month);
      const records = await repository.listPriceOccurrences();
      const byProduct = groupOccurrencesByProduct(records);
      const increases: PriceVariation[] = [];
      const decreases: PriceVariation[] = [];
      let zeroBaseCount = 0;

      for (const productRecords of byProduct.values()) {
        const product = productFromOccurrence(productRecords[0]);
        const normalized = productRecords.flatMap((record) => {
          const ratio = normalizeOccurrence(record, product);
          return ratio ? [{ source: record, ratio }] : [];
        });
        if (normalized.length < 2) continue;

        const latest = normalized.at(-1)!;
        const previous = normalized.at(-2)!;
        if (!includesDate(current.range, latest.source.purchasedAt)) continue;

        if (previous.ratio.numerator === 0n) {
          if (latest.ratio.numerator > 0n) zeroBaseCount += 1;
          continue;
        }

        const direction = compareRatios(latest.ratio, previous.ratio);
        const currentPriceCents = roundPrice(latest.ratio);
        const previousPriceCents = roundPrice(previous.ratio);
        if (direction === 0 || currentPriceCents === previousPriceCents) continue;

        const variation: PriceVariation = {
          productId: product.productId,
          productName: product.productName,
          productBrand: product.productBrand,
          unit: latest.ratio.unit,
          previousPriceCents,
          currentPriceCents,
          differenceCents: currentPriceCents - previousPriceCents,
          percentageTenths: percentageBetweenRatios(latest.ratio, previous.ratio),
          latestPurchasedAt: latest.source.purchasedAt,
        };
        (direction > 0 ? increases : decreases).push(variation);
      }

      increases.sort(compareVariations(false));
      decreases.sort(compareVariations(true));
      return { period: current, increases, decreases, zeroBaseCount };
    },
  };
}

export function compareCents(currentCents: number, previousCents: number) {
  requireSafeNonNegative(currentCents, 'total atual');
  requireSafeNonNegative(previousCents, 'total anterior');
  const differenceCents = safeBigIntToNumber(BigInt(currentCents) - BigInt(previousCents));

  if (previousCents === 0) {
    return {
      differenceCents,
      percentageTenths: null,
      comparisonState: (currentCents === 0
        ? 'both_zero'
        : 'no_previous') as SpendingComparisonState,
    };
  }

  return {
    differenceCents,
    percentageTenths: roundRatio(
      BigInt(currentCents - previousCents) * 1000n,
      BigInt(previousCents),
    ),
    comparisonState: 'comparable' as const,
  };
}

function normalizeOccurrence(
  occurrence: PriceOccurrenceRecord,
  product: AnalyticsProductRecord,
): PriceRatio | null {
  if (product.currentCommercializationType === 'FIXED') {
    if (occurrence.commercializationType !== 'FIXED' || occurrence.unitPriceCents === null) {
      return null;
    }
    return { numerator: BigInt(occurrence.unitPriceCents), denominator: 1n, unit: 'UNIT' };
  }

  if (
    occurrence.commercializationType !== 'VARIABLE' ||
    !product.currentMeasurementUnit ||
    unitFamily(occurrence.quantityUnit) !== unitFamily(product.currentMeasurementUnit)
  ) {
    return null;
  }

  const multiplier =
    occurrence.quantityUnit === 'G' || occurrence.quantityUnit === 'ML' ? 1_000_000n : 1_000n;
  return {
    numerator: BigInt(occurrence.totalPriceCents) * multiplier,
    denominator: BigInt(occurrence.quantityMilli),
    unit: analyticUnit(product),
  };
}

function productFromOccurrence(record: PriceOccurrenceRecord): AnalyticsProductRecord {
  return {
    productId: record.productId,
    productName: record.productName,
    productBrand: record.productBrand,
    currentCommercializationType: record.currentCommercializationType,
    currentMeasurementUnit: record.currentMeasurementUnit,
  };
}

function groupOccurrencesByProduct(
  records: PriceOccurrenceRecord[],
): Map<UUID, PriceOccurrenceRecord[]> {
  const grouped = new Map<UUID, PriceOccurrenceRecord[]>();
  records.forEach((record) => {
    const group = grouped.get(record.productId);
    if (group) group.push(record);
    else grouped.set(record.productId, [record]);
  });
  return grouped;
}

function analyticUnit(product: AnalyticsProductRecord): AnalyticPriceUnit {
  if (product.currentCommercializationType === 'FIXED') return 'UNIT';
  const family = product.currentMeasurementUnit && unitFamily(product.currentMeasurementUnit);
  if (family === 'mass') return 'KG';
  if (family === 'volume') return 'L';
  if (family === 'unit') return 'UNIT';
  throw new Error('Produto variável sem unidade analítica válida.');
}

function unitFamily(unit: MeasurementUnit): 'mass' | 'volume' | 'unit' {
  if (unit === 'G' || unit === 'KG') return 'mass';
  if (unit === 'ML' || unit === 'L') return 'volume';
  return 'unit';
}

function toHistoryOccurrence(occurrence: NormalizedOccurrence): PriceHistoryOccurrence {
  return {
    itemId: occurrence.source.itemId,
    purchaseId: occurrence.source.purchaseId,
    marketId: occurrence.source.marketId,
    marketName: occurrence.source.marketName,
    purchasedAt: occurrence.source.purchasedAt,
    normalizedPriceCents: roundPrice(occurrence.ratio),
  };
}

function minimumRatio(ratios: PriceRatio[]): PriceRatio {
  return ratios.reduce((minimum, ratio) => (compareRatios(ratio, minimum) < 0 ? ratio : minimum));
}

function maximumRatio(ratios: PriceRatio[]): PriceRatio {
  return ratios.reduce((maximum, ratio) => (compareRatios(ratio, maximum) > 0 ? ratio : maximum));
}

function compareRatios(left: PriceRatio, right: PriceRatio): number {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function roundPrice(ratio: PriceRatio): number {
  return roundRatio(ratio.numerator, ratio.denominator);
}

function percentageBetweenRatios(current: PriceRatio, previous: PriceRatio): number {
  const difference =
    current.numerator * previous.denominator - previous.numerator * current.denominator;
  const base = previous.numerator * current.denominator;
  return roundRatio(difference * 1000n, base);
}

function roundRatio(numerator: bigint, denominator: bigint): number {
  if (denominator <= 0n) throw new Error('Divisor analítico inválido.');
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return safeBigIntToNumber(sign * ((absolute * 2n + denominator) / (2n * denominator)));
}

function compareSpendingByName<NameKey extends 'categoryName' | 'productName'>(nameKey: NameKey) {
  return <Item extends { totalPriceCents: number } & Record<NameKey, string>>(
    left: Item,
    right: Item,
  ) =>
    right.totalPriceCents - left.totalPriceCents ||
    left[nameKey].localeCompare(right[nameKey], 'pt-BR', { sensitivity: 'base' }) ||
    stableId(left).localeCompare(stableId(right));
}

function stableId(value: unknown): string {
  if (typeof value !== 'object' || value === null) return '';
  const record = value as { categoryId?: string | null; productId?: string };
  return record.categoryId ?? record.productId ?? '';
}

function compareVariations(ascending: boolean) {
  return (left: PriceVariation, right: PriceVariation) =>
    (ascending
      ? left.percentageTenths - right.percentageTenths
      : right.percentageTenths - left.percentageTenths) ||
    left.productName.localeCompare(right.productName, 'pt-BR', { sensitivity: 'base' }) ||
    left.productId.localeCompare(right.productId);
}

function ensureTotalsMatch(expected: number, values: number[], label: string): void {
  const actual = values.reduce((total, value) => safeAdd(total, value), 0);
  if (actual !== expected) {
    throw new Error(`O total de ${label} não corresponde ao total do período.`);
  }
}

function safeAdd(left: number, right: number): number {
  return safeBigIntToNumber(BigInt(left) + BigInt(right));
}

function requireSafeNonNegative(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} inválido.`);
}

function safeBigIntToNumber(value: bigint): number {
  const converted = Number(value);
  if (!Number.isSafeInteger(converted))
    throw new Error('Cálculo analítico acima do limite seguro.');
  return converted;
}
