import { createPurchaseItemRepository } from '@/database/repositories/purchase-item.repository';
import { createPurchaseRepository } from '@/database/repositories/purchase.repository';
import { runInPurchaseTransaction } from '@/database/repositories/purchase.transaction';
import { createPurchaseService } from '@/services/purchase.service';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function usePurchaseService() {
  const db = useSQLiteContext();

  return useMemo(
    () =>
      createPurchaseService({
        purchases: createPurchaseRepository(db),
        purchaseItems: createPurchaseItemRepository(db),
        runInTransaction: (operation) => runInPurchaseTransaction(db, operation),
        createId: Crypto.randomUUID,
      }),
    [db],
  );
}
