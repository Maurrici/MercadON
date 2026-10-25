import type { Purchase } from '@/domain/models/Purchase';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type { MarketRepository } from '@/domain/repositories/market.repository';
import type {
  HistoricalPurchaseItem,
  PurchaseItemRepository,
  SavePurchaseItemRecord,
  UpdatePurchaseItemRecord,
} from '@/domain/repositories/purchase-item.repository';
import type {
  PurchaseRepository,
  PurchaseSummary,
  SaveDraftPurchaseRecord,
} from '@/domain/repositories/purchase.repository';
import type { ISODateTime, UUID } from '@/domain/types';
import type {
  PurchaseTransactionRepositories,
  PurchaseTransactionRunner,
} from '@/services/purchase.service';

export class InMemoryPurchaseRepository implements PurchaseRepository {
  private readonly purchases: Purchase[] = [];

  constructor(
    private readonly hasActiveItems: (purchaseId: UUID) => Promise<boolean> = async () => true,
  ) {}

  async findActiveDraft(): Promise<Purchase | null> {
    const purchase = this.purchases.find(
      (candidate) => candidate.status === 'DRAFT' && candidate.deletedAt === null,
    );
    return purchase ? { ...purchase } : null;
  }

  async findById(id: UUID): Promise<Purchase | null> {
    const purchase = this.purchases.find((candidate) => candidate.id === id);
    return purchase ? { ...purchase } : null;
  }

  async listCompleted(): Promise<PurchaseSummary[]> {
    return this.purchases
      .filter(
        (purchase): purchase is Extract<Purchase, { status: 'COMPLETED' }> =>
          purchase.status === 'COMPLETED' && purchase.deletedAt === null,
      )
      .map((purchase) => ({
        ...purchase,
        marketName: '',
        itemCount: 0,
        totalPriceCents: 0,
      }));
  }

  async createDraft(input: SaveDraftPurchaseRecord): Promise<Purchase> {
    if (await this.findActiveDraft()) throw new Error('Já existe um rascunho ativo.');
    const purchase: Purchase = {
      ...input,
      status: 'DRAFT',
      purchasedAt: null,
      deletedAt: null,
    };
    this.purchases.push(purchase);
    return { ...purchase };
  }

  async updateDraftMarket(id: UUID, marketId: UUID, updatedAt: ISODateTime): Promise<Purchase> {
    const purchase = this.requireActiveDraft(id);
    purchase.marketId = marketId;
    purchase.updatedAt = updatedAt;
    return { ...purchase };
  }

  async completeDraft(
    id: UUID,
    purchasedAt: ISODateTime,
    updatedAt: ISODateTime,
  ): Promise<Purchase> {
    const purchase = this.requireActiveDraft(id);
    if (!(await this.hasActiveItems(id))) {
      throw new Error('Rascunho inexistente ou sem itens para finalização.');
    }
    const completed: Purchase = {
      ...purchase,
      status: 'COMPLETED',
      purchasedAt,
      updatedAt,
    };
    this.purchases[this.purchases.indexOf(purchase)] = completed;
    return { ...completed };
  }

  async softDeleteDraft(id: UUID, deletedAt: ISODateTime): Promise<void> {
    const purchase = this.requireActiveDraft(id);
    purchase.deletedAt = deletedAt;
    purchase.updatedAt = deletedAt;
  }

  async updateCompleted(
    id: UUID,
    marketId: UUID,
    purchasedAt: ISODateTime,
    updatedAt: ISODateTime,
  ): Promise<Purchase> {
    const index = this.purchases.findIndex(
      (candidate) =>
        candidate.id === id && candidate.status === 'COMPLETED' && candidate.deletedAt === null,
    );
    if (index < 0) throw new Error('Compra concluída não encontrada para edição.');
    const purchase: Purchase = {
      ...this.purchases[index],
      status: 'COMPLETED',
      marketId,
      purchasedAt,
      updatedAt,
    };
    this.purchases[index] = purchase;
    return { ...purchase };
  }

  async deleteCompleted(id: UUID): Promise<void> {
    const index = this.purchases.findIndex(
      (candidate) => candidate.id === id && candidate.status === 'COMPLETED',
    );
    if (index < 0) throw new Error('Compra concluída não encontrada para exclusão.');
    this.purchases.splice(index, 1);
  }

  private requireActiveDraft(id: UUID): Extract<Purchase, { status: 'DRAFT' }> {
    const purchase = this.purchases.find(
      (candidate): candidate is Extract<Purchase, { status: 'DRAFT' }> =>
        candidate.id === id && candidate.status === 'DRAFT' && candidate.deletedAt === null,
    );
    if (!purchase) throw new Error('Rascunho não encontrado.');
    return purchase;
  }
}

export class InMemoryPurchaseItemRepository implements PurchaseItemRepository {
  private readonly items: PurchaseItem[] = [];
  private readonly historicalItems: HistoricalPurchaseItem[] = [];

  async listActiveByPurchaseId(purchaseId: UUID): Promise<PurchaseItem[]> {
    return this.items
      .filter((item) => item.purchaseId === purchaseId && item.deletedAt === null)
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
      )
      .map(copyItem);
  }

  async findById(id: UUID): Promise<PurchaseItem | null> {
    const item = this.items.find((candidate) => candidate.id === id);
    return item ? copyItem(item) : null;
  }

  async findActiveByProduct(purchaseId: UUID, productId: UUID): Promise<PurchaseItem | null> {
    const item = this.items.find(
      (candidate) =>
        candidate.purchaseId === purchaseId &&
        candidate.productId === productId &&
        candidate.deletedAt === null,
    );
    return item ? copyItem(item) : null;
  }

  async findLatestCompletedByProduct(
    productId: UUID,
    excludePurchaseId?: UUID,
  ): Promise<HistoricalPurchaseItem | null> {
    const item = this.historicalItems
      .filter(
        (candidate) =>
          candidate.productId === productId && candidate.purchaseId !== excludePurchaseId,
      )
      .sort(
        (left, right) =>
          right.purchasedAt.localeCompare(left.purchasedAt) ||
          right.createdAt.localeCompare(left.createdAt) ||
          right.id.localeCompare(left.id),
      )[0];
    return item ? { ...item } : null;
  }

  addHistoricalItem(item: HistoricalPurchaseItem): void {
    this.historicalItems.push({ ...item });
  }

  async countActiveByPurchaseId(purchaseId: UUID): Promise<number> {
    return (await this.listActiveByPurchaseId(purchaseId)).length;
  }

  async sumActiveTotalByPurchaseId(purchaseId: UUID): Promise<number> {
    return (await this.listActiveByPurchaseId(purchaseId)).reduce(
      (total, item) => total + item.totalPriceCents,
      0,
    );
  }

  async create(input: SavePurchaseItemRecord): Promise<PurchaseItem> {
    if (await this.findActiveByProduct(input.purchaseId, input.productId)) {
      throw new Error('Produto já adicionado à compra.');
    }
    const item = { ...input, deletedAt: null } as PurchaseItem;
    this.items.push(item);
    return copyItem(item);
  }

  async update(input: UpdatePurchaseItemRecord): Promise<PurchaseItem> {
    const index = this.items.findIndex(
      (candidate) => candidate.id === input.id && candidate.deletedAt === null,
    );
    if (index < 0) throw new Error('Item não encontrado para edição.');
    const item = { ...this.items[index], ...input, deletedAt: null } as PurchaseItem;
    this.items[index] = item;
    return copyItem(item);
  }

  async softDelete(id: UUID, deletedAt: ISODateTime): Promise<void> {
    const item = this.items.find(
      (candidate) => candidate.id === id && candidate.deletedAt === null,
    );
    if (!item) throw new Error('Item não encontrado para remoção.');
    item.deletedAt = deletedAt;
    item.updatedAt = deletedAt;
  }

  async softDeleteActiveByPurchaseId(purchaseId: UUID, deletedAt: ISODateTime): Promise<number> {
    const items = this.items.filter(
      (candidate) => candidate.purchaseId === purchaseId && candidate.deletedAt === null,
    );
    items.forEach((item) => {
      item.deletedAt = deletedAt;
      item.updatedAt = deletedAt;
    });
    return items.length;
  }

  async hardDeleteByPurchaseId(purchaseId: UUID): Promise<number> {
    const before = this.items.length;
    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      if (this.items[index].purchaseId === purchaseId) this.items.splice(index, 1);
    }
    return before - this.items.length;
  }
}

export function createSerialPurchaseTransactionRunner(
  repositories: PurchaseTransactionRepositories,
): PurchaseTransactionRunner {
  let queue = Promise.resolve();

  return <Result>(operation: (transaction: PurchaseTransactionRepositories) => Promise<Result>) => {
    const result = queue.then(() => operation(repositories));
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}

export function createPurchaseTransactionRepositories(
  markets: MarketRepository,
  products: PurchaseTransactionRepositories['products'],
  purchases: PurchaseRepository,
  purchaseItems: PurchaseItemRepository,
): PurchaseTransactionRepositories {
  return { markets, products, purchases, purchaseItems };
}

function copyItem(item: PurchaseItem): PurchaseItem {
  return { ...item };
}
