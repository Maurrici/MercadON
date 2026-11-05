import type { DateRange } from '@/domain/analytics-period';
import type {
  AnalyticsProductRecord,
  AnalyticsRepository,
  PriceOccurrenceRecord,
} from '@/domain/repositories/analytics.repository';
import { compareCents, createAnalyticsService } from '@/services/analytics.service';
import { describe, expect, it } from '@jest/globals';

const TODAY = '2026-10-26' as const;

function createRepository(overrides: Partial<AnalyticsRepository> = {}): AnalyticsRepository {
  return {
    getSpendingSummary: async () => ({ totalPriceCents: 0, completedPurchaseCount: 0 }),
    listCategorySpending: async () => [],
    listProductSpending: async () => [],
    findProduct: async () => null,
    listPriceOccurrences: async () => [],
    ...overrides,
  };
}

const VARIABLE_PRODUCT: AnalyticsProductRecord = {
  productId: 'product-meat',
  productName: 'Carne',
  productBrand: null,
  currentCommercializationType: 'VARIABLE',
  currentMeasurementUnit: 'KG',
};

function occurrence(overrides: Partial<PriceOccurrenceRecord> = {}): PriceOccurrenceRecord {
  return {
    itemId: 'item-1',
    purchaseId: 'purchase-1',
    productId: VARIABLE_PRODUCT.productId,
    productName: VARIABLE_PRODUCT.productName,
    productBrand: VARIABLE_PRODUCT.productBrand,
    currentCommercializationType: VARIABLE_PRODUCT.currentCommercializationType,
    currentMeasurementUnit: VARIABLE_PRODUCT.currentMeasurementUnit,
    marketId: 'market-1',
    marketName: 'Mercado Central',
    purchasedAt: '2026-09-10',
    itemCreatedAt: '2026-09-10T12:00:00.000Z',
    commercializationType: 'VARIABLE',
    quantityMilli: 500_000,
    quantityUnit: 'G',
    unitPriceCents: null,
    totalPriceCents: 2000,
    ...overrides,
  };
}

describe('AnalyticsService - períodos e gastos', () => {
  it('compara o mesmo intervalo anterior e representa base zero sem percentual', async () => {
    const ranges: DateRange[] = [];
    const repository = createRepository({
      async getSpendingSummary(range) {
        ranges.push(range);
        return range.startDate === '2026-10-01'
          ? { totalPriceCents: 12_345, completedPurchaseCount: 3 }
          : { totalPriceCents: 0, completedPurchaseCount: 0 };
      },
    });

    const result = await createAnalyticsService(repository, {
      today: () => TODAY,
    }).getMonthlyOverview();

    expect(ranges).toEqual([
      { startDate: '2026-10-01', endExclusive: '2026-10-27' },
      { startDate: '2026-09-01', endExclusive: '2026-09-27' },
    ]);
    expect(result).toMatchObject({
      totalPriceCents: 12_345,
      completedPurchaseCount: 3,
      previousTotalPriceCents: 0,
      differenceCents: 12_345,
      percentageTenths: null,
      comparisonState: 'no_previous',
    });
  });

  it('calcula percentual com uma casa decimal e trata queda para zero', () => {
    expect(compareCents(1084, 1000)).toEqual({
      differenceCents: 84,
      percentageTenths: 84,
      comparisonState: 'comparable',
    });
    expect(compareCents(0, 1000)).toEqual({
      differenceCents: -1000,
      percentageTenths: -1000,
      comparisonState: 'comparable',
    });
    expect(compareCents(0, 0).comparisonState).toBe('both_zero');
  });

  it('mantém seis meses contínuos incluindo meses sem gasto', async () => {
    const service = createAnalyticsService(createRepository(), { today: () => TODAY });
    const points = await service.getRecentMonthlySpending();
    expect(points.map((point) => point.period.month)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(points.every((point) => point.totalPriceCents === 0)).toBe(true);
  });

  it('fecha categorias e produtos exatamente com o total mensal', async () => {
    const repository = createRepository({
      async getSpendingSummary() {
        return { totalPriceCents: 3000, completedPurchaseCount: 1 };
      },
      async listCategorySpending() {
        return [
          { categoryId: null, categoryName: null, totalPriceCents: 1000 },
          { categoryId: 'cat-1', categoryName: 'Bebidas', totalPriceCents: 2000 },
        ];
      },
      async listProductSpending() {
        return [
          {
            productId: 'product-1',
            productName: 'Café',
            productBrand: null,
            totalPriceCents: 3000,
            purchaseCount: 2,
          },
        ];
      },
    });
    const service = createAnalyticsService(repository, { today: () => TODAY });

    await expect(service.getCategorySpending()).resolves.toMatchObject({
      totalPriceCents: 3000,
      categories: [
        { categoryName: 'Bebidas', totalPriceCents: 2000 },
        { categoryName: 'Sem categoria', totalPriceCents: 1000 },
      ],
    });
    await expect(service.getProductSpending()).resolves.toMatchObject({
      totalPriceCents: 3000,
      products: [{ productId: 'product-1', totalPriceCents: 3000 }],
    });
  });

  it('interrompe quando a agregação não fecha com o total', async () => {
    const service = createAnalyticsService(
      createRepository({
        async getSpendingSummary() {
          return { totalPriceCents: 3000, completedPurchaseCount: 1 };
        },
        async listCategorySpending() {
          return [{ categoryId: 'cat-1', categoryName: 'Bebidas', totalPriceCents: 2999 }];
        },
      }),
      { today: () => TODAY },
    );
    await expect(service.getCategorySpending()).rejects.toThrow(
      'O total de categorias não corresponde ao total do período.',
    );
  });
});

describe('AnalyticsService - histórico e variações', () => {
  it('normaliza g/kg, ignora família incompatível e calcula mínimo/máximo', async () => {
    const records = [
      occurrence(),
      occurrence({
        itemId: 'item-2',
        purchaseId: 'purchase-2',
        purchasedAt: '2026-10-10',
        itemCreatedAt: '2026-10-10T12:00:00.000Z',
        quantityMilli: 1000,
        quantityUnit: 'KG',
        totalPriceCents: 3900,
      }),
      occurrence({
        itemId: 'item-incompatible',
        purchasedAt: '2026-10-20',
        quantityMilli: 1000,
        quantityUnit: 'L',
      }),
    ];
    const service = createAnalyticsService(
      createRepository({
        findProduct: async () => VARIABLE_PRODUCT,
        listPriceOccurrences: async () => records,
      }),
      { today: () => TODAY },
    );

    await expect(service.getProductPriceHistory(VARIABLE_PRODUCT.productId)).resolves.toEqual({
      productId: VARIABLE_PRODUCT.productId,
      productName: 'Carne',
      productBrand: null,
      unit: 'KG',
      currentPriceCents: 3900,
      minimumPriceCents: 3900,
      maximumPriceCents: 4000,
      occurrences: [
        expect.objectContaining({ itemId: 'item-1', normalizedPriceCents: 4000 }),
        expect.objectContaining({ itemId: 'item-2', normalizedPriceCents: 3900 }),
      ],
      incompatibleOccurrenceCount: 1,
    });
  });

  it('ordena altas/quedas, inclui queda para zero e exclui base zero', async () => {
    const fixedBase = occurrence({
      productId: 'product-coffee',
      productName: 'Café',
      currentCommercializationType: 'FIXED',
      currentMeasurementUnit: 'G',
      commercializationType: 'FIXED',
      quantityMilli: 1000,
      quantityUnit: 'UNIT',
      unitPriceCents: 1000,
      totalPriceCents: 1000,
    });
    const zeroBase = occurrence({
      productId: 'product-free',
      productName: 'Brinde',
      currentCommercializationType: 'FIXED',
      currentMeasurementUnit: null,
      commercializationType: 'FIXED',
      quantityMilli: 1000,
      quantityUnit: 'UNIT',
      unitPriceCents: 0,
      totalPriceCents: 0,
    });
    const dropBase = occurrence({
      productId: 'product-drop',
      productName: 'Desconto',
      currentCommercializationType: 'FIXED',
      currentMeasurementUnit: null,
      commercializationType: 'FIXED',
      quantityMilli: 1000,
      quantityUnit: 'UNIT',
      unitPriceCents: 500,
      totalPriceCents: 500,
    });
    const records = [
      fixedBase,
      { ...fixedBase, itemId: 'coffee-2', purchasedAt: '2026-10-10', unitPriceCents: 1200 },
      zeroBase,
      { ...zeroBase, itemId: 'free-2', purchasedAt: '2026-10-11', unitPriceCents: 100 },
      dropBase,
      { ...dropBase, itemId: 'drop-2', purchasedAt: '2026-10-12', unitPriceCents: 0 },
    ] as PriceOccurrenceRecord[];
    const service = createAnalyticsService(
      createRepository({ listPriceOccurrences: async () => records }),
      { today: () => TODAY },
    );

    await expect(service.getPriceVariations()).resolves.toMatchObject({
      zeroBaseCount: 1,
      increases: [
        {
          productId: 'product-coffee',
          previousPriceCents: 1000,
          currentPriceCents: 1200,
          percentageTenths: 200,
        },
      ],
      decreases: [
        {
          productId: 'product-drop',
          previousPriceCents: 500,
          currentPriceCents: 0,
          percentageTenths: -1000,
        },
      ],
    });
  });
});
