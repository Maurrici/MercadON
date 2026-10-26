import { createMarketRepository } from '@/database/repositories/market.repository';
import { createProductRepository } from '@/database/repositories/product.repository';
import { createPurchaseItemRepository } from '@/database/repositories/purchase-item.repository';
import { createPurchaseRepository } from '@/database/repositories/purchase.repository';
import type { MarketRepository } from '@/domain/repositories/market.repository';
import type { ProductRepository } from '@/domain/repositories/product.repository';
import type { PurchaseItemRepository } from '@/domain/repositories/purchase-item.repository';
import type { PurchaseRepository } from '@/domain/repositories/purchase.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

export type PurchaseTransaction = {
  markets: MarketRepository;
  products: ProductRepository;
  purchases: PurchaseRepository;
  purchaseItems: PurchaseItemRepository;
};

export async function runInPurchaseTransaction<T>(
  db: SQLiteDatabase,
  operation: (repositories: PurchaseTransaction) => Promise<T>,
): Promise<T> {
  let operationResult: T | undefined;
  let completed = false;

  await db.withExclusiveTransactionAsync(async (transaction) => {
    operationResult = await operation({
      markets: createMarketRepository(transaction),
      products: createProductRepository(transaction),
      purchases: createPurchaseRepository(transaction),
      purchaseItems: createPurchaseItemRepository(transaction),
    });
    completed = true;
  });

  if (!completed) {
    throw new Error('A transação de compra não foi concluída.');
  }

  return operationResult as T;
}
