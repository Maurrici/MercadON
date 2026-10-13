import { createMarketRepository } from '@/database/repositories/market.repository';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function useMarketRepository() {
  const db = useSQLiteContext();

  return useMemo(() => createMarketRepository(db), [db]);
}
