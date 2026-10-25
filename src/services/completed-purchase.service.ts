import type { Purchase } from '@/domain/models/Purchase';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type { MarketRepository } from '@/domain/repositories/market.repository';
import type { ProductRepository } from '@/domain/repositories/product.repository';
import type { PurchaseItemRepository } from '@/domain/repositories/purchase-item.repository';
import type {
  PurchaseRepository,
  PurchaseSummary,
} from '@/domain/repositories/purchase.repository';
import type { ISODateTime, UUID } from '@/domain/types';
import {
  comparePurchaseItemWithHistory,
  preparePurchaseItem,
  type PriceComparison,
  type PurchaseItemFormInput,
  type SavePurchaseItemResult,
} from '@/services/purchase-item.service';
import type { PurchaseTransactionRunner } from '@/services/purchase.service';

type CompletedPurchase = Extract<Purchase, { status: 'COMPLETED' }>;

export type CompletedPurchaseDetails = {
  purchase: CompletedPurchase;
  items: PurchaseItem[];
  totalPriceCents: number;
};

export type CompletedItemPreview = ReturnType<typeof preparePurchaseItem> & {
  comparison: PriceComparison;
};

export class LastCompletedPurchaseItemError extends Error {
  constructor() {
    super('O último item não pode ser removido. Exclua a compra para apagar todo o histórico.');
  }
}

export type CompletedPurchaseService = {
  list(): Promise<PurchaseSummary[]>;
  getDetails(purchaseId: UUID): Promise<CompletedPurchaseDetails>;
  updateDetails(
    purchaseId: UUID,
    marketId: UUID,
    purchasedAt: ISODateTime,
  ): Promise<CompletedPurchaseDetails>;
  previewItem(
    purchaseId: UUID,
    productId: UUID,
    input: PurchaseItemFormInput,
  ): Promise<CompletedItemPreview>;
  saveItem(
    purchaseId: UUID,
    productId: UUID,
    input: PurchaseItemFormInput,
  ): Promise<SavePurchaseItemResult>;
  removeItem(purchaseId: UUID, itemId: UUID): Promise<number>;
  deletePurchase(purchaseId: UUID): Promise<void>;
};

type CompletedPurchaseServiceDependencies = {
  purchases: PurchaseRepository;
  purchaseItems: PurchaseItemRepository;
  products: ProductRepository;
  markets: MarketRepository;
  runInTransaction: PurchaseTransactionRunner;
  createId: () => UUID;
  now?: () => ISODateTime;
};

export function createCompletedPurchaseService({
  purchases,
  purchaseItems,
  products,
  markets,
  runInTransaction,
  createId,
  now = () => new Date().toISOString(),
}: CompletedPurchaseServiceDependencies): CompletedPurchaseService {
  return {
    list: () => purchases.listCompleted(),

    async getDetails(purchaseId) {
      const purchase = await requireCompletedPurchase(purchases, purchaseId);
      return loadDetails(purchase, purchaseItems);
    },

    updateDetails(purchaseId, marketId, purchasedAt) {
      return runInTransaction(async (repositories) => {
        await requireCompletedPurchase(repositories.purchases, purchaseId);
        await requireActiveMarket(repositories.markets, marketId);
        requireValidPurchasedAt(purchasedAt);
        const purchase = await repositories.purchases.updateCompleted(
          purchaseId,
          marketId,
          purchasedAt,
          now(),
        );
        if (purchase.status !== 'COMPLETED') throw new Error('A compra deixou de estar concluída.');
        return loadDetails(purchase, repositories.purchaseItems);
      });
    },

    async previewItem(purchaseId, productId, input) {
      await requireCompletedPurchase(purchases, purchaseId);
      const product = await requireAvailableProductForCorrection(
        products,
        purchaseItems,
        purchaseId,
        productId,
      );
      const prepared = preparePurchaseItem(product, input);
      const history = await purchaseItems.findLatestCompletedByProduct(productId, purchaseId);
      return {
        ...prepared,
        comparison: comparePurchaseItemWithHistory(prepared, history),
      };
    },

    saveItem(purchaseId, productId, input) {
      return runInTransaction(async (repositories) => {
        await requireCompletedPurchase(repositories.purchases, purchaseId);
        const product = await requireAvailableProductForCorrection(
          repositories.products,
          repositories.purchaseItems,
          purchaseId,
          productId,
        );
        const prepared = preparePurchaseItem(product, input);
        const history = await repositories.purchaseItems.findLatestCompletedByProduct(
          productId,
          purchaseId,
        );
        const existing = await repositories.purchaseItems.findActiveByProduct(
          purchaseId,
          productId,
        );
        const timestamp = now();
        const item = existing
          ? await repositories.purchaseItems.update({
              ...prepared,
              id: existing.id,
              updatedAt: timestamp,
            })
          : await repositories.purchaseItems.create({
              ...prepared,
              id: createId(),
              purchaseId,
              productId,
              createdAt: timestamp,
              updatedAt: timestamp,
            });

        return {
          item,
          purchaseTotalCents:
            await repositories.purchaseItems.sumActiveTotalByPurchaseId(purchaseId),
          comparison: comparePurchaseItemWithHistory(prepared, history),
        };
      });
    },

    removeItem(purchaseId, itemId) {
      return runInTransaction(async (repositories) => {
        await requireCompletedPurchase(repositories.purchases, purchaseId);
        const item = await repositories.purchaseItems.findById(itemId);
        if (!item || item.purchaseId !== purchaseId || item.deletedAt !== null) {
          throw new Error('Item não encontrado para remoção.');
        }
        if ((await repositories.purchaseItems.countActiveByPurchaseId(purchaseId)) <= 1) {
          throw new LastCompletedPurchaseItemError();
        }

        await repositories.purchaseItems.softDelete(itemId, now());
        return repositories.purchaseItems.sumActiveTotalByPurchaseId(purchaseId);
      });
    },

    deletePurchase(purchaseId) {
      return runInTransaction(async (repositories) => {
        await requireCompletedPurchase(repositories.purchases, purchaseId);
        await repositories.purchaseItems.hardDeleteByPurchaseId(purchaseId);
        await repositories.purchases.deleteCompleted(purchaseId);
      });
    },
  };
}

async function requireCompletedPurchase(
  purchases: PurchaseRepository,
  purchaseId: UUID,
): Promise<CompletedPurchase> {
  const purchase = await purchases.findById(purchaseId);
  if (!purchase || purchase.status !== 'COMPLETED' || purchase.deletedAt !== null) {
    throw new Error('Compra concluída não encontrada.');
  }
  return purchase;
}

async function requireAvailableProductForCorrection(
  products: ProductRepository,
  purchaseItems: PurchaseItemRepository,
  purchaseId: UUID,
  productId: UUID,
) {
  const product = await products.findById(productId);
  if (!product) throw new Error('Produto não encontrado.');
  if (product.deletedAt !== null) {
    const existingItem = await purchaseItems.findActiveByProduct(purchaseId, productId);
    if (!existingItem) throw new Error('Produto não encontrado.');
  }
  return product;
}

async function requireActiveMarket(markets: MarketRepository, marketId: UUID) {
  const market = await markets.findById(marketId);
  if (!market || market.deletedAt !== null) throw new Error('Mercado não encontrado.');
}

function requireValidPurchasedAt(purchasedAt: ISODateTime) {
  if (!purchasedAt || Number.isNaN(Date.parse(purchasedAt))) {
    throw new Error('Informe uma data de compra válida.');
  }
}

async function loadDetails(
  purchase: CompletedPurchase,
  items: PurchaseItemRepository,
): Promise<CompletedPurchaseDetails> {
  const purchaseItems = await items.listActiveByPurchaseId(purchase.id);
  return {
    purchase,
    items: purchaseItems,
    totalPriceCents: purchaseItems.reduce((total, item) => total + item.totalPriceCents, 0),
  };
}
