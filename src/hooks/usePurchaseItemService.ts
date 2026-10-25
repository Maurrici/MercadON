import { createProductRepository } from '@/database/repositories/product.repository';
import { createPurchaseItemRepository } from '@/database/repositories/purchase-item.repository';
import { createPurchaseRepository } from '@/database/repositories/purchase.repository';
import { runInPurchaseTransaction } from '@/database/repositories/purchase.transaction';
import { createPurchaseItemService } from '@/services/purchase-item.service';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function usePurchaseItemService() {
  const db = useSQLiteContext();

  return useMemo(
    () =>
      createPurchaseItemService({
        purchases: createPurchaseRepository(db),
        purchaseItems: createPurchaseItemRepository(db),
        products: createProductRepository(db),
        runInTransaction: (operation) => runInPurchaseTransaction(db, operation),
        createId: Crypto.randomUUID,
      }),
    [db],
  );
}
