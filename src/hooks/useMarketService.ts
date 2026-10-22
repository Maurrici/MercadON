import { createMarketRepository } from '@/database/repositories/market.repository';
import { createMarketService } from '@/services/market.service';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function useMarketService() {
  const db = useSQLiteContext();

  return useMemo(
    () =>
      createMarketService({
        markets: createMarketRepository(db),
        createId: Crypto.randomUUID,
      }),
    [db],
  );
}
