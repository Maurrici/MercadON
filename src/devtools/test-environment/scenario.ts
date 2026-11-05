import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ProductCommercializationType } from '@/domain/enums/ProductCommercializationType';
import type { ISODate, ISODateTime, UUID } from '@/domain/types';

export type TestMarket = {
  id: UUID;
  name: string;
};

export type TestProduct = {
  id: UUID;
  name: string;
  brand: string | null;
  categoryId: UUID;
  commercializationType: ProductCommercializationType;
  packageQuantityMilli: number | null;
  packageUnit: MeasurementUnit | null;
};

export type TestPurchaseItem = {
  id: UUID;
  productId: UUID;
  commercializationType: ProductCommercializationType;
  quantityMilli: number;
  quantityUnit: MeasurementUnit;
  unitPriceCents: number | null;
  totalPriceCents: number;
};

export type TestPurchase = {
  id: UUID;
  marketId: UUID;
  purchasedAt: ISODate;
  createdAt: ISODateTime;
  items: TestPurchaseItem[];
};

export type TestEnvironmentScenario = {
  markets: TestMarket[];
  products: TestProduct[];
  purchases: TestPurchase[];
};

const CATEGORY = {
  grocery: '10000000-0000-4000-8000-000000000001',
  beverages: '10000000-0000-4000-8000-000000000002',
  cleaning: '10000000-0000-4000-8000-000000000004',
  produce: '10000000-0000-4000-8000-000000000006',
  meat: '10000000-0000-4000-8000-000000000007',
  dairy: '10000000-0000-4000-8000-000000000008',
} as const satisfies Record<string, UUID>;

const MARKET = {
  central: '91000000-0000-4000-8000-000000000001',
  neighborhood: '91000000-0000-4000-8000-000000000002',
  hypermarket: '91000000-0000-4000-8000-000000000003',
} as const satisfies Record<string, UUID>;

const PRODUCT = {
  rice: '92000000-0000-4000-8000-000000000001',
  coffee: '92000000-0000-4000-8000-000000000002',
  milk: '92000000-0000-4000-8000-000000000003',
  beef: '92000000-0000-4000-8000-000000000004',
  banana: '92000000-0000-4000-8000-000000000005',
  detergent: '92000000-0000-4000-8000-000000000006',
  soda: '92000000-0000-4000-8000-000000000007',
} as const satisfies Record<string, UUID>;

export function buildEnvironment1(today: ISODate): TestEnvironmentScenario {
  const purchase = (
    sequence: number,
    monthOffset: number,
    targetDay: number,
    marketId: UUID,
    items: Omit<TestPurchaseItem, 'id'>[],
  ): TestPurchase => {
    const purchasedAt = dateInMonth(today, monthOffset, targetDay);
    return {
      id: id('purchase', sequence),
      marketId,
      purchasedAt,
      createdAt: `${purchasedAt}T12:${String(sequence).padStart(2, '0')}:00.000Z`,
      items: items.map((item, itemIndex) => ({
        ...item,
        id: id('item', sequence * 10 + itemIndex + 1),
      })),
    };
  };

  return {
    markets: [
      { id: MARKET.central, name: 'Atacadão Central' },
      { id: MARKET.neighborhood, name: 'Mercado do Bairro' },
      { id: MARKET.hypermarket, name: 'Hiper Bom Preço' },
    ],
    products: [
      fixedProduct(PRODUCT.rice, 'Arroz branco', 'Boa Mesa', CATEGORY.grocery, 5000, 'KG'),
      fixedProduct(PRODUCT.coffee, 'Café torrado', 'Serra Alta', CATEGORY.grocery, 500, 'G'),
      fixedProduct(PRODUCT.milk, 'Leite integral', 'Fazenda', CATEGORY.dairy, 1000, 'ML'),
      variableProduct(PRODUCT.beef, 'Carne bovina', null, CATEGORY.meat, 'KG'),
      variableProduct(PRODUCT.banana, 'Banana prata', null, CATEGORY.produce, 'KG'),
      fixedProduct(PRODUCT.detergent, 'Detergente', 'Limpol', CATEGORY.cleaning, 500, 'ML'),
      fixedProduct(PRODUCT.soda, 'Refrigerante cola', 'Refresca', CATEGORY.beverages, 2000, 'ML'),
    ],
    purchases: [
      purchase(1, -5, 6, MARKET.central, [
        fixedItem(PRODUCT.rice, 1, 2899),
        fixedItem(PRODUCT.coffee, 1, 1890),
        variableItem(PRODUCT.banana, 1000, 'KG', 799),
      ]),
      purchase(2, -4, 11, MARKET.neighborhood, [
        fixedItem(PRODUCT.rice, 1, 2999),
        fixedItem(PRODUCT.milk, 2, 499),
        variableItem(PRODUCT.beef, 1000, 'KG', 4000),
      ]),
      purchase(3, -3, 8, MARKET.central, [
        fixedItem(PRODUCT.coffee, 1, 2050),
        fixedItem(PRODUCT.detergent, 2, 325),
        variableItem(PRODUCT.banana, 1000, 'KG', 1050),
      ]),
      purchase(4, -2, 17, MARKET.hypermarket, [
        fixedItem(PRODUCT.rice, 1, 3199),
        fixedItem(PRODUCT.soda, 1, 999),
        variableItem(PRODUCT.beef, 1000, 'KG', 4600),
      ]),
      purchase(5, -1, 21, MARKET.neighborhood, [
        fixedItem(PRODUCT.coffee, 1, 2290),
        fixedItem(PRODUCT.milk, 3, 549),
        variableItem(PRODUCT.beef, 1000, 'KG', 5200),
      ]),
      purchase(6, 0, 3, MARKET.central, [
        fixedItem(PRODUCT.rice, 1, 3499),
        fixedItem(PRODUCT.milk, 2, 579),
        variableItem(PRODUCT.banana, 1500, 'KG', 1800),
      ]),
      purchase(7, 0, 12, MARKET.neighborhood, [
        fixedItem(PRODUCT.coffee, 1, 2590),
        fixedItem(PRODUCT.detergent, 2, 389),
        variableItem(PRODUCT.beef, 1250, 'KG', 7500),
      ]),
      purchase(8, 0, 20, MARKET.hypermarket, [
        fixedItem(PRODUCT.soda, 2, 1199),
        variableItem(PRODUCT.banana, 1000, 'KG', 890),
      ]),
    ],
  };
}

function fixedProduct(
  idValue: UUID,
  name: string,
  brand: string,
  categoryId: UUID,
  packageQuantityMilli: number,
  packageUnit: MeasurementUnit,
): TestProduct {
  return {
    id: idValue,
    name,
    brand,
    categoryId,
    commercializationType: 'FIXED',
    packageQuantityMilli,
    packageUnit,
  };
}

function variableProduct(
  idValue: UUID,
  name: string,
  brand: string | null,
  categoryId: UUID,
  packageUnit: MeasurementUnit,
): TestProduct {
  return {
    id: idValue,
    name,
    brand,
    categoryId,
    commercializationType: 'VARIABLE',
    packageQuantityMilli: null,
    packageUnit,
  };
}

function fixedItem(productId: UUID, quantity: number, unitPriceCents: number) {
  return {
    productId,
    commercializationType: 'FIXED' as const,
    quantityMilli: quantity * 1000,
    quantityUnit: 'UNIT' as const,
    unitPriceCents,
    totalPriceCents: quantity * unitPriceCents,
  };
}

function variableItem(
  productId: UUID,
  quantityMilli: number,
  quantityUnit: MeasurementUnit,
  totalPriceCents: number,
) {
  return {
    productId,
    commercializationType: 'VARIABLE' as const,
    quantityMilli,
    quantityUnit,
    unitPriceCents: null,
    totalPriceCents,
  };
}

function dateInMonth(today: ISODate, monthOffset: number, targetDay: number): ISODate {
  const currentYear = Number(today.slice(0, 4));
  const currentMonthIndex = Number(today.slice(5, 7)) - 1;
  const currentDay = Number(today.slice(8, 10));
  const firstDay = new Date(Date.UTC(currentYear, currentMonthIndex + monthOffset, 1));
  const year = firstDay.getUTCFullYear();
  const monthIndex = firstDay.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const maximumDay = monthOffset === 0 ? currentDay : lastDay;
  const day = Math.max(1, Math.min(targetDay, maximumDay, lastDay));
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(
    2,
    '0',
  )}` as ISODate;
}

function id(kind: 'purchase' | 'item', sequence: number): UUID {
  const prefix = kind === 'purchase' ? '93000000' : '94000000';
  return `${prefix}-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}
