import type { Product } from '@/domain/models/Product';
import type { HistoricalPurchaseItem } from '@/domain/repositories/purchase-item.repository';
import {
  createPurchaseItemService,
  PurchaseItemValidationError,
} from '@/services/purchase-item.service';
import { describe, expect, it } from '@jest/globals';
import { InMemoryMarketRepository } from '../helpers/in-memory-market.repository';
import { InMemoryProductRepository } from '../helpers/in-memory-product.repository';
import {
  createPurchaseTransactionRepositories,
  createSerialPurchaseTransactionRunner,
  InMemoryPurchaseItemRepository,
  InMemoryPurchaseRepository,
} from '../helpers/in-memory-purchase.repositories';

const NOW = '2026-10-23T12:00:00.000Z';
const PREVIOUS_DATE = '2026-10-22T18:00:00.000Z';

const FIXED_PRODUCT: Product = {
  id: 'product-coffee',
  name: 'Café',
  brand: 'MercadON',
  categoryId: null,
  commercializationType: 'FIXED',
  packageQuantityMilli: 500_000,
  packageUnit: 'G',
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

const VARIABLE_PRODUCT: Product = {
  id: 'product-meat',
  name: 'Carne bovina',
  brand: null,
  categoryId: null,
  commercializationType: 'VARIABLE',
  packageQuantityMilli: null,
  packageUnit: 'KG',
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

async function createHarness() {
  const markets = new InMemoryMarketRepository();
  const products = new InMemoryProductRepository();
  const purchaseItems = new InMemoryPurchaseItemRepository();
  const purchases = new InMemoryPurchaseRepository(
    async (purchaseId) => (await purchaseItems.countActiveByPurchaseId(purchaseId)) > 0,
  );
  let nextItemId = 1;

  await products.create(FIXED_PRODUCT);
  await products.create(VARIABLE_PRODUCT);
  const draft = await purchases.createDraft({
    id: 'purchase-current',
    marketId: 'market-1',
    createdAt: NOW,
    updatedAt: NOW,
  });

  const transactionRepositories = createPurchaseTransactionRepositories(
    markets,
    products,
    purchases,
    purchaseItems,
  );
  const service = createPurchaseItemService({
    purchases,
    purchaseItems,
    products,
    runInTransaction: createSerialPurchaseTransactionRunner(transactionRepositories),
    createId: () => `item-${nextItemId++}`,
    now: () => NOW,
  });

  return { draft, products, purchaseItems, service };
}

function historicalItem(overrides: Partial<HistoricalPurchaseItem> = {}): HistoricalPurchaseItem {
  return {
    id: 'historical-item',
    purchaseId: 'purchase-previous',
    productId: FIXED_PRODUCT.id,
    commercializationType: 'FIXED',
    quantityMilli: 1000,
    quantityUnit: 'UNIT',
    unitPriceCents: 1600,
    totalPriceCents: 1600,
    createdAt: PREVIOUS_DATE,
    updatedAt: PREVIOUS_DATE,
    deletedAt: null,
    purchasedAt: PREVIOUS_DATE,
    ...overrides,
  } as HistoricalPurchaseItem;
}

describe('PurchaseItemService - valores e persistência', () => {
  it('calcula item fixo em unidades comerciais e preço unitário', async () => {
    const { draft, service } = await createHarness();

    await expect(
      service.previewItem(draft.id, FIXED_PRODUCT.id, { quantity: '2', price: '14,90' }),
    ).resolves.toEqual({
      commercializationType: 'FIXED',
      quantityMilli: 2000,
      quantityUnit: 'UNIT',
      unitPriceCents: 1490,
      totalPriceCents: 2980,
      comparison: {
        status: 'no_history',
        currentNormalizedPriceCents: 1490,
        previousNormalizedPriceCents: null,
        differenceCents: null,
        unit: 'UNIT',
      },
    });
  });

  it('calcula item variável pelo total pago e normaliza para uma unidade de medida', async () => {
    const { draft, service } = await createHarness();

    await expect(
      service.previewItem(draft.id, VARIABLE_PRODUCT.id, {
        quantity: '1,275',
        price: '50,87',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        commercializationType: 'VARIABLE',
        quantityMilli: 1275,
        quantityUnit: 'KG',
        unitPriceCents: null,
        totalPriceCents: 5087,
        comparison: expect.objectContaining({
          status: 'no_history',
          currentNormalizedPriceCents: 3990,
          unit: 'KG',
        }),
      }),
    );
  });

  it('atualiza a linha existente sem duplicar o produto e recalcula o total', async () => {
    const { draft, purchaseItems, service } = await createHarness();

    const first = await service.saveItem(draft.id, FIXED_PRODUCT.id, {
      quantity: '1',
      price: '14,90',
    });
    const updated = await service.saveItem(draft.id, FIXED_PRODUCT.id, {
      quantity: '3',
      price: '15,00',
    });

    expect(updated.item.id).toBe(first.item.id);
    expect(updated.item).toEqual(
      expect.objectContaining({ quantityMilli: 3000, unitPriceCents: 1500, totalPriceCents: 4500 }),
    );
    await expect(purchaseItems.listActiveByPurchaseId(draft.id)).resolves.toHaveLength(1);
    expect(updated.purchaseTotalCents).toBe(4500);
  });

  it('incrementa somente item fixo preservando seu preço unitário', async () => {
    const { draft, service } = await createHarness();
    await service.saveItem(draft.id, FIXED_PRODUCT.id, { quantity: '2', price: '14,90' });

    const result = await service.incrementFixedItem(draft.id, FIXED_PRODUCT.id);

    expect(result.item).toEqual(
      expect.objectContaining({ quantityMilli: 3000, unitPriceCents: 1490, totalPriceCents: 4470 }),
    );
    expect(result.purchaseTotalCents).toBe(4470);
  });

  it('rejeita +1 para item de medida variável', async () => {
    const { draft, service } = await createHarness();
    await service.saveItem(draft.id, VARIABLE_PRODUCT.id, {
      quantity: '1,275',
      price: '50,87',
    });

    await expect(service.incrementFixedItem(draft.id, VARIABLE_PRODUCT.id)).rejects.toThrow(
      'Somente itens fixos já adicionados podem receber +1.',
    );
  });

  it('remove item e devolve o total recalculado dos itens restantes', async () => {
    const { draft, service } = await createHarness();
    const fixed = await service.saveItem(draft.id, FIXED_PRODUCT.id, {
      quantity: '2',
      price: '14,90',
    });
    await service.saveItem(draft.id, VARIABLE_PRODUCT.id, {
      quantity: '1,275',
      price: '50,87',
    });

    await expect(service.removeItem(draft.id, fixed.item.id)).resolves.toBe(5087);
  });
});

describe('PurchaseItemService - comparação histórica equivalente', () => {
  const comparisonCases: [number, string, 'cheaper' | 'more_expensive' | 'same_price', number][] = [
    [1600, '14,90', 'cheaper', 110],
    [1490, '16,00', 'more_expensive', 110],
    [1490, '14,90', 'same_price', 0],
  ];

  it.each(comparisonCases)(
    'compara item fixo anterior de %i centavos como %s',
    async (previousPrice, currentPrice, status, difference) => {
      const { draft, purchaseItems, service } = await createHarness();
      purchaseItems.addHistoricalItem(
        historicalItem({ unitPriceCents: previousPrice, totalPriceCents: previousPrice }),
      );

      const result = await service.previewItem(draft.id, FIXED_PRODUCT.id, {
        quantity: '4',
        price: currentPrice,
      });

      expect(result.comparison).toEqual({
        status,
        currentNormalizedPriceCents: Number(currentPrice.replace(',', '')),
        previousNormalizedPriceCents: previousPrice,
        differenceCents: difference,
        unit: 'UNIT',
      });
    },
  );

  it('não cria variação falsa quando muda apenas a quantidade variável', async () => {
    const { draft, purchaseItems, service } = await createHarness();
    purchaseItems.addHistoricalItem(
      historicalItem({
        productId: VARIABLE_PRODUCT.id,
        commercializationType: 'VARIABLE',
        quantityMilli: 1000,
        quantityUnit: 'KG',
        unitPriceCents: null,
        totalPriceCents: 3990,
      }),
    );

    const result = await service.previewItem(draft.id, VARIABLE_PRODUCT.id, {
      quantity: '1,275',
      price: '50,87',
    });

    expect(result.comparison).toEqual({
      status: 'same_price',
      currentNormalizedPriceCents: 3990,
      previousNormalizedPriceCents: 3990,
      differenceCents: 0,
      unit: 'KG',
    });
  });

  it('ignora histórico cuja base estrutural não seja equivalente', async () => {
    const { draft, purchaseItems, service } = await createHarness();
    purchaseItems.addHistoricalItem(
      historicalItem({ quantityUnit: 'KG' } as Partial<HistoricalPurchaseItem>),
    );

    const result = await service.previewItem(draft.id, FIXED_PRODUCT.id, {
      quantity: '1',
      price: '14,90',
    });

    expect(result.comparison.status).toBe('no_history');
    expect(result.comparison.previousNormalizedPriceCents).toBeNull();
  });
});

describe('PurchaseItemService - limites de entrada', () => {
  const invalidInputCases: [string, { quantity: string; price: string }, 'quantity' | 'price'][] = [
    [FIXED_PRODUCT.id, { quantity: '1,5', price: '10,00' }, 'quantity'],
    [FIXED_PRODUCT.id, { quantity: '0', price: '10,00' }, 'quantity'],
    [VARIABLE_PRODUCT.id, { quantity: '1,2345', price: '10,00' }, 'quantity'],
    [VARIABLE_PRODUCT.id, { quantity: '1', price: '10,001' }, 'price'],
    [VARIABLE_PRODUCT.id, { quantity: '', price: '10,00' }, 'quantity'],
    [VARIABLE_PRODUCT.id, { quantity: '1', price: '' }, 'price'],
  ];

  it.each(invalidInputCases)(
    'rejeita entrada inválida no campo %s',
    async (productId, input, field) => {
      const { draft, service } = await createHarness();

      try {
        await service.previewItem(draft.id, productId, input);
        throw new Error('A validação deveria ter falhado.');
      } catch (error) {
        expect(error).toBeInstanceOf(PurchaseItemValidationError);
        expect((error as PurchaseItemValidationError).errors[field]).toBeDefined();
      }
    },
  );

  it('rejeita quantidade que ultrapassa o limite inteiro seguro', async () => {
    const { draft, service } = await createHarness();

    await expect(
      service.previewItem(draft.id, FIXED_PRODUCT.id, {
        quantity: Number.MAX_SAFE_INTEGER.toString(),
        price: '1,00',
      }),
    ).rejects.toBeInstanceOf(PurchaseItemValidationError);
  });
});
