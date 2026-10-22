import { createCategoryRepository } from '@/database/repositories/category.repository';
import { createProductRepository } from '@/database/repositories/product.repository';
import { createProductService } from '@/services/product.service';
import * as Crypto from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function useProductService() {
  const db = useSQLiteContext();

  return useMemo(
    () =>
      createProductService({
        products: createProductRepository(db),
        categories: createCategoryRepository(db),
        createId: Crypto.randomUUID,
      }),
    [db],
  );
}
