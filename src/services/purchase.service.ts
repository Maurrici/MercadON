import type { Purchase } from '@/domain/models/Purchase';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type { MarketRepository } from '@/domain/repositories/market.repository';
import type { ProductRepository } from '@/domain/repositories/product.repository';
import type { PurchaseItemRepository } from '@/domain/repositories/purchase-item.repository';
import type { PurchaseRepository } from '@/domain/repositories/purchase.repository';
import type { ISODateTime, UUID } from '@/domain/types';

type DraftPurchase = Extract<Purchase, { status: 'DRAFT' }>;
type CompletedPurchase = Extract<Purchase, { status: 'COMPLETED' }>;

export type PurchaseDraftDetails = {
  purchase: DraftPurchase;
  items: PurchaseItem[];
  totalPriceCents: number;
};

export type PurchaseTransactionRepositories = {
  markets: MarketRepository;
  products: ProductRepository;
  purchases: PurchaseRepository;
  purchaseItems: PurchaseItemRepository;
};

export type PurchaseTransactionRunner = <Result>(
  operation: (repositories: PurchaseTransactionRepositories) => Promise<Result>,
) => Promise<Result>;

export class PurchaseMarketUnavailableError extends Error {
  constructor() {
    super('Selecione um mercado ativo para iniciar a compra.');
  }
}

export type PurchaseService = {
  getDraft(): Promise<PurchaseDraftDetails | null>;
  startDraft(marketId: UUID): Promise<PurchaseDraftDetails>;
  changeDraftMarket(purchaseId: UUID, marketId: UUID): Promise<PurchaseDraftDetails>;
  discardDraft(purchaseId: UUID): Promise<void>;
  completeDraft(purchaseId: UUID): Promise<CompletedPurchase>;
};

type PurchaseServiceDependencies = {
  purchases: PurchaseRepository;
  purchaseItems: PurchaseItemRepository;
  runInTransaction: PurchaseTransactionRunner;
  createId: () => UUID;
  now?: () => ISODateTime;
};

export function createPurchaseService({
  purchases,
  purchaseItems,
  runInTransaction,
  createId,
  now = () => new Date().toISOString(),
}: PurchaseServiceDependencies): PurchaseService {
  return {
    async getDraft() {
      const draft = await purchases.findActiveDraft();
      return draft ? loadDraftDetails(draft, purchaseItems) : null;
    },

    startDraft(marketId) {
      return runInTransaction(async (repositories) => {
        const existing = await repositories.purchases.findActiveDraft();
        if (existing) return loadDraftDetails(existing, repositories.purchaseItems);

        await requireActiveMarket(repositories.markets, marketId);
        const timestamp = now();
        const draft = await repositories.purchases.createDraft({
          id: createId(),
          marketId,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        return loadDraftDetails(draft, repositories.purchaseItems);
      });
    },

    changeDraftMarket(purchaseId, marketId) {
      return runInTransaction(async (repositories) => {
        await requireActiveMarket(repositories.markets, marketId);
        const draft = await repositories.purchases.updateDraftMarket(purchaseId, marketId, now());
        return loadDraftDetails(draft, repositories.purchaseItems);
      });
    },

    discardDraft(purchaseId) {
      return runInTransaction(async (repositories) => {
        const timestamp = now();
        await repositories.purchaseItems.softDeleteActiveByPurchaseId(purchaseId, timestamp);
        await repositories.purchases.softDeleteDraft(purchaseId, timestamp);
      });
    },

    completeDraft(purchaseId) {
      return runInTransaction(async (repositories) => {
        const timestamp = now();
        const purchase = await repositories.purchases.completeDraft(
          purchaseId,
          timestamp,
          timestamp,
        );

        if (purchase.status !== 'COMPLETED') {
          throw new Error('A compra não foi concluída corretamente.');
        }

        return purchase;
      });
    },
  };
}

async function requireActiveMarket(markets: MarketRepository, marketId: UUID): Promise<void> {
  const market = await markets.findById(marketId);
  if (!market || market.deletedAt !== null) throw new PurchaseMarketUnavailableError();
}

async function loadDraftDetails(
  purchase: Purchase,
  items: PurchaseItemRepository,
): Promise<PurchaseDraftDetails> {
  if (purchase.status !== 'DRAFT') throw new Error('A compra informada não é um rascunho.');

  const purchaseItems = await items.listActiveByPurchaseId(purchase.id);
  return {
    purchase,
    items: purchaseItems,
    totalPriceCents: purchaseItems.reduce((total, item) => total + item.totalPriceCents, 0),
  };
}
