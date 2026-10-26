import { createMarketRepository } from '@/database/repositories/market.repository';
import { createProductRepository } from '@/database/repositories/product.repository';
import { createPurchaseItemRepository } from '@/database/repositories/purchase-item.repository';
import { createPurchaseRepository } from '@/database/repositories/purchase.repository';
import { runInPurchaseTransaction } from '@/database/repositories/purchase.transaction';
import { createCompletedPurchaseService } from '@/services/completed-purchase.service';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function useCompletedPurchaseService() {
  const db = useSQLiteContext();

  return useMemo(
    () =>
      createCompletedPurchaseService({
        purchases: createPurchaseRepository(db),
        purchaseItems: createPurchaseItemRepository(db),
        products: createProductRepository(db),
        markets: createMarketRepository(db),
        runInTransaction: (operation) => runInPurchaseTransaction(db, operation),
        createId: Crypto.randomUUID,
      }),
    [db],
  );
}
