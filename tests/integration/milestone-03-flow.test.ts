import type { Product } from '@/domain/models/Product';
import { createCompletedPurchaseService } from '@/services/completed-purchase.service';
import { createPurchaseItemService } from '@/services/purchase-item.service';
import { createPurchaseService } from '@/services/purchase.service';
import { describe, expect, it } from '@jest/globals';
import { InMemoryMarketRepository } from '../helpers/in-memory-market.repository';
import { InMemoryProductRepository } from '../helpers/in-memory-product.repository';
import {
  createPurchaseTransactionRepositories,
  createSerialPurchaseTransactionRunner,
  InMemoryPurchaseItemRepository,
  InMemoryPurchaseRepository,
} from '../helpers/in-memory-purchase.repositories';

const FIRST_DATE = '2026-10-20T12:00:00.000Z';
const SECOND_DATE = '2026-10-24T12:00:00.000Z';

const FIXED_PRODUCT: Product = {
  id: 'product-coffee',
  name: 'Café',
  brand: 'Marca A',
  categoryId: 'pantry',
  commercializationType: 'FIXED',
  packageQuantityMilli: 500_000,
  packageUnit: 'G',
  createdAt: FIRST_DATE,
  updatedAt: FIRST_DATE,
  deletedAt: null,
};

const VARIABLE_PRODUCT: Product = {
  ...FIXED_PRODUCT,
  id: 'product-meat',
  name: 'Carne',
  brand: null,
  categoryId: 'meat',
  commercializationType: 'VARIABLE',
  packageQuantityMilli: null,
  packageUnit: 'KG',
};

describe('regressão integrada da Milestone 3', () => {
  it('inicia, persiste, retoma, finaliza, compara e corrige compras', async () => {
    const markets = new InMemoryMarketRepository();
    const products = new InMemoryProductRepository();
    const purchaseItems = new InMemoryPurchaseItemRepository();
    const purchases = new InMemoryPurchaseRepository(
      async (purchaseId) => (await purchaseItems.countActiveByPurchaseId(purchaseId)) > 0,
    );
    const repositories = createPurchaseTransactionRepositories(
      markets,
      products,
      purchases,
      purchaseItems,
    );
    const runInTransaction = createSerialPurchaseTransactionRunner(repositories);
    let currentDate = FIRST_DATE;
    let purchaseSequence = 1;
    let itemSequence = 1;

    await markets.create({
      id: 'market-1',
      name: 'Mercado Central',
      createdAt: FIRST_DATE,
      updatedAt: FIRST_DATE,
    });
    await markets.create({
      id: 'market-2',
      name: 'Mercado Bairro',
      createdAt: FIRST_DATE,
      updatedAt: FIRST_DATE,
    });
    await products.create(FIXED_PRODUCT);
    await products.create(VARIABLE_PRODUCT);

    const purchaseService = createPurchaseService({
      purchases,
      purchaseItems,
      runInTransaction,
      createId: () => `purchase-${purchaseSequence++}`,
      now: () => currentDate,
    });
    const itemService = createPurchaseItemService({
      purchases,
      purchaseItems,
      products,
      runInTransaction,
      createId: () => `item-${itemSequence++}`,
      now: () => currentDate,
    });
    const completedService = createCompletedPurchaseService({
      purchases,
      purchaseItems,
      products,
      markets,
      runInTransaction,
      createId: () => `history-item-${itemSequence++}`,
      now: () => currentDate,
    });

    const firstDraft = await purchaseService.startDraft('market-1');
    await expect(purchaseService.startDraft('market-2')).resolves.toMatchObject({
      purchase: { id: firstDraft.purchase.id, marketId: 'market-1' },
    });

    const fixed = await itemService.saveItem(firstDraft.purchase.id, FIXED_PRODUCT.id, {
      quantity: '2',
      price: '10,00',
    });
    const variable = await itemService.saveItem(firstDraft.purchase.id, VARIABLE_PRODUCT.id, {
      quantity: '1,250',
      price: '50,00',
    });
    await expect(purchaseService.getDraft()).resolves.toMatchObject({
      purchase: { id: firstDraft.purchase.id },
      totalPriceCents: 7000,
    });

    const firstCompleted = await purchaseService.completeDraft(firstDraft.purchase.id);
    expect(firstCompleted.status).toBe('COMPLETED');
    await expect(purchaseService.getDraft()).resolves.toBeNull();

    purchaseItems.addHistoricalItem({ ...fixed.item, purchasedAt: firstCompleted.purchasedAt });
    purchaseItems.addHistoricalItem({ ...variable.item, purchasedAt: firstCompleted.purchasedAt });

    currentDate = SECOND_DATE;
    const secondDraft = await purchaseService.startDraft('market-2');
    await expect(
      itemService.previewItem(secondDraft.purchase.id, FIXED_PRODUCT.id, {
        quantity: '1',
        price: '9,00',
      }),
    ).resolves.toMatchObject({
      totalPriceCents: 900,
      comparison: { status: 'cheaper', differenceCents: 100, unit: 'UNIT' },
    });
    await itemService.saveItem(secondDraft.purchase.id, FIXED_PRODUCT.id, {
      quantity: '1',
      price: '9,00',
    });
    const secondCompleted = await purchaseService.completeDraft(secondDraft.purchase.id);

    await expect(
      completedService.updateDetails(secondCompleted.id, 'market-1', SECOND_DATE),
    ).resolves.toMatchObject({
      purchase: { marketId: 'market-1', purchasedAt: SECOND_DATE },
      totalPriceCents: 900,
    });
    await expect(completedService.list()).resolves.toHaveLength(2);

    await completedService.deletePurchase(firstCompleted.id);
    await expect(completedService.list()).resolves.toHaveLength(1);
  });
});
