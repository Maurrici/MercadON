import type { Product } from '@/domain/models/Product';
import {
  createCompletedPurchaseService,
  LastCompletedPurchaseItemError,
} from '@/services/completed-purchase.service';
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
const UPDATED_DATE = '2026-10-20T18:00:00.000Z';

const FIXED_PRODUCT: Product = {
  id: 'product-coffee',
  name: 'Café',
  brand: null,
  categoryId: null,
  commercializationType: 'FIXED',
  packageQuantityMilli: 500_000,
  packageUnit: 'G',
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

const VARIABLE_PRODUCT: Product = {
  ...FIXED_PRODUCT,
  id: 'product-meat',
  name: 'Carne',
  commercializationType: 'VARIABLE',
  packageQuantityMilli: null,
  packageUnit: 'KG',
};

async function createHarness() {
  const markets = new InMemoryMarketRepository();
  const products = new InMemoryProductRepository();
  const purchaseItems = new InMemoryPurchaseItemRepository();
  const purchases = new InMemoryPurchaseRepository(
    async (purchaseId) => (await purchaseItems.countActiveByPurchaseId(purchaseId)) > 0,
  );
  let nextId = 1;

  await markets.create({ id: 'market-1', name: 'Central', createdAt: NOW, updatedAt: NOW });
  await markets.create({ id: 'market-2', name: 'Bairro', createdAt: NOW, updatedAt: NOW });
  await products.create(FIXED_PRODUCT);
  await products.create(VARIABLE_PRODUCT);
  const draft = await purchases.createDraft({
    id: 'purchase-1',
    marketId: 'market-1',
    createdAt: NOW,
    updatedAt: NOW,
  });
  await purchaseItems.create({
    id: 'item-fixed',
    purchaseId: draft.id,
    productId: FIXED_PRODUCT.id,
    commercializationType: 'FIXED',
    quantityMilli: 2000,
    quantityUnit: 'UNIT',
    unitPriceCents: 1490,
    totalPriceCents: 2980,
    createdAt: NOW,
    updatedAt: NOW,
  });
  await purchases.completeDraft(draft.id, NOW, NOW);

  const transactionRepositories = createPurchaseTransactionRepositories(
    markets,
    products,
    purchases,
    purchaseItems,
  );
  const service = createCompletedPurchaseService({
    markets,
    products,
    purchases,
    purchaseItems,
    runInTransaction: createSerialPurchaseTransactionRunner(transactionRepositories),
    createId: () => `item-new-${nextId++}`,
    now: () => NOW,
  });

  return { markets, products, purchases, purchaseItems, service };
}

describe('CompletedPurchaseService', () => {
  it('carrega detalhe fiel e total derivado dos itens', async () => {
    const { service } = await createHarness();
    await expect(service.getDetails('purchase-1')).resolves.toEqual(
      expect.objectContaining({
        purchase: expect.objectContaining({ status: 'COMPLETED', purchasedAt: NOW }),
        items: [expect.objectContaining({ id: 'item-fixed', totalPriceCents: 2980 })],
        totalPriceCents: 2980,
      }),
    );
  });

  it('corrige mercado e data mantendo a compra concluída', async () => {
    const { service } = await createHarness();
    const result = await service.updateDetails('purchase-1', 'market-2', UPDATED_DATE);
    expect(result.purchase).toEqual(
      expect.objectContaining({
        status: 'COMPLETED',
        marketId: 'market-2',
        purchasedAt: UPDATED_DATE,
      }),
    );
    expect(result.totalPriceCents).toBe(2980);
  });

  it('rejeita mercado indisponível e data inválida', async () => {
    const { service } = await createHarness();
    await expect(service.updateDetails('purchase-1', 'missing', UPDATED_DATE)).rejects.toThrow(
      'Mercado não encontrado.',
    );
    await expect(service.updateDetails('purchase-1', 'market-1', 'inválida')).rejects.toThrow(
      'Informe uma data de compra válida.',
    );
  });

  it('edita item existente e adiciona novo item recalculando o total', async () => {
    const { purchaseItems, service } = await createHarness();
    const edited = await service.saveItem('purchase-1', FIXED_PRODUCT.id, {
      quantity: '3',
      price: '15,00',
    });
    const added = await service.saveItem('purchase-1', VARIABLE_PRODUCT.id, {
      quantity: '1,275',
      price: '50,87',
    });
    expect(edited.item.id).toBe('item-fixed');
    expect(added.purchaseTotalCents).toBe(9587);
    await expect(purchaseItems.listActiveByPurchaseId('purchase-1')).resolves.toHaveLength(2);
  });

  it('permite corrigir item existente de produto arquivado sem permitir nova inclusão', async () => {
    const { products, service } = await createHarness();
    await products.softDelete(FIXED_PRODUCT.id, NOW);
    await products.softDelete(VARIABLE_PRODUCT.id, NOW);

    await expect(
      service.saveItem('purchase-1', FIXED_PRODUCT.id, { quantity: '3', price: '15,00' }),
    ).resolves.toMatchObject({ item: { id: 'item-fixed', totalPriceCents: 4500 } });
    await expect(
      service.saveItem('purchase-1', VARIABLE_PRODUCT.id, { quantity: '1', price: '39,90' }),
    ).rejects.toThrow('Produto não encontrado.');
  });

  it('remove item somente quando outro item permanece', async () => {
    const { service } = await createHarness();
    const added = await service.saveItem('purchase-1', VARIABLE_PRODUCT.id, {
      quantity: '1',
      price: '39,90',
    });
    await expect(service.removeItem('purchase-1', added.item.id)).resolves.toBe(2980);
    await expect(service.removeItem('purchase-1', 'item-fixed')).rejects.toBeInstanceOf(
      LastCompletedPurchaseItemError,
    );
  });

  it('exclui definitivamente itens e compra na mesma operação', async () => {
    const { purchaseItems, purchases, service } = await createHarness();
    await service.deletePurchase('purchase-1');
    await expect(purchases.findById('purchase-1')).resolves.toBeNull();
    await expect(purchaseItems.listActiveByPurchaseId('purchase-1')).resolves.toEqual([]);
  });
});
