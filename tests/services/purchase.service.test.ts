import type { SavePurchaseItemRecord } from '@/domain/repositories/purchase-item.repository';
import { createPurchaseService, PurchaseMarketUnavailableError } from '@/services/purchase.service';
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

async function createHarness() {
  const markets = new InMemoryMarketRepository();
  const products = new InMemoryProductRepository();
  const purchaseItems = new InMemoryPurchaseItemRepository();
  const purchases = new InMemoryPurchaseRepository(
    async (purchaseId) => (await purchaseItems.countActiveByPurchaseId(purchaseId)) > 0,
  );
  let nextId = 1;

  await markets.create({
    id: 'market-1',
    name: 'Mercado Central',
    createdAt: NOW,
    updatedAt: NOW,
  });
  await markets.create({
    id: 'market-2',
    name: 'Mercado Bairro',
    createdAt: NOW,
    updatedAt: NOW,
  });

  const transactionRepositories = createPurchaseTransactionRepositories(
    markets,
    products,
    purchases,
    purchaseItems,
  );
  const service = createPurchaseService({
    purchases,
    purchaseItems,
    runInTransaction: createSerialPurchaseTransactionRunner(transactionRepositories),
    createId: () => `purchase-${nextId++}`,
    now: () => NOW,
  });

  return { markets, purchases, purchaseItems, service };
}

function makeFixedItem(purchaseId: string): SavePurchaseItemRecord {
  return {
    id: 'item-1',
    purchaseId,
    productId: 'product-1',
    commercializationType: 'FIXED',
    quantityMilli: 2000,
    quantityUnit: 'UNIT',
    unitPriceCents: 1490,
    totalPriceCents: 2980,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe('PurchaseService - ciclo de vida do rascunho', () => {
  it('inicia um rascunho somente com mercado ativo', async () => {
    const { service } = await createHarness();

    await expect(service.startDraft('market-1')).resolves.toEqual({
      purchase: expect.objectContaining({
        id: 'purchase-1',
        marketId: 'market-1',
        status: 'DRAFT',
      }),
      items: [],
      totalPriceCents: 0,
    });
  });

  it('rejeita mercado inexistente ou excluído', async () => {
    const { markets, service } = await createHarness();

    await expect(service.startDraft('missing')).rejects.toBeInstanceOf(
      PurchaseMarketUnavailableError,
    );
    await markets.softDelete('market-1', NOW);
    await expect(service.startDraft('market-1')).rejects.toBeInstanceOf(
      PurchaseMarketUnavailableError,
    );
  });

  it('serializa solicitações concorrentes e devolve o mesmo rascunho', async () => {
    const { service } = await createHarness();

    const [first, second] = await Promise.all([
      service.startDraft('market-1'),
      service.startDraft('market-2'),
    ]);

    expect(first.purchase.id).toBe('purchase-1');
    expect(second.purchase.id).toBe('purchase-1');
    expect(second.purchase.marketId).toBe('market-1');
  });

  it('recupera itens ativos e total recalculado da persistência', async () => {
    const { purchaseItems, service } = await createHarness();
    const draft = await service.startDraft('market-1');
    await purchaseItems.create(makeFixedItem(draft.purchase.id));

    await expect(service.getDraft()).resolves.toEqual({
      purchase: draft.purchase,
      items: [expect.objectContaining({ id: 'item-1', totalPriceCents: 2980 })],
      totalPriceCents: 2980,
    });
  });

  it('troca o mercado sem modificar os itens', async () => {
    const { purchaseItems, service } = await createHarness();
    const draft = await service.startDraft('market-1');
    await purchaseItems.create(makeFixedItem(draft.purchase.id));

    const changed = await service.changeDraftMarket(draft.purchase.id, 'market-2');

    expect(changed.purchase.marketId).toBe('market-2');
    expect(changed.items).toEqual([expect.objectContaining({ id: 'item-1' })]);
    expect(changed.totalPriceCents).toBe(2980);
  });

  it('descarta explicitamente o rascunho e seus itens ativos', async () => {
    const { purchaseItems, service } = await createHarness();
    const draft = await service.startDraft('market-1');
    await purchaseItems.create(makeFixedItem(draft.purchase.id));

    await service.discardDraft(draft.purchase.id);

    await expect(service.getDraft()).resolves.toBeNull();
    await expect(purchaseItems.listActiveByPurchaseId(draft.purchase.id)).resolves.toEqual([]);
  });

  it('não finaliza um rascunho vazio', async () => {
    const { service } = await createHarness();
    const draft = await service.startDraft('market-1');

    await expect(service.completeDraft(draft.purchase.id)).rejects.toThrow(
      'Rascunho inexistente ou sem itens para finalização.',
    );
  });

  it('finaliza o rascunho com item e registra a data atomicamente', async () => {
    const { purchaseItems, service } = await createHarness();
    const draft = await service.startDraft('market-1');
    await purchaseItems.create(makeFixedItem(draft.purchase.id));

    await expect(service.completeDraft(draft.purchase.id)).resolves.toEqual(
      expect.objectContaining({
        id: draft.purchase.id,
        status: 'COMPLETED',
        purchasedAt: NOW,
        updatedAt: NOW,
      }),
    );
    await expect(service.getDraft()).resolves.toBeNull();
  });
});
