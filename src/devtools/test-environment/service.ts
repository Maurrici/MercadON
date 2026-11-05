import { toLocalISODate } from '@/domain/date';
import type { ISODate, ISODateTime } from '@/domain/types';
import type { SQLiteDatabase } from 'expo-sqlite';
import { buildEnvironment1 } from './scenario';

export type TestEnvironmentSummary = {
  markets: number;
  products: number;
  purchases: number;
  items: number;
};

export type TestEnvironmentService = {
  applyEnvironment1(): Promise<TestEnvironmentSummary>;
  reset(): Promise<void>;
};

type Dependencies = {
  today?: () => ISODate;
  now?: () => ISODateTime;
};

export function createTestEnvironmentService(
  database: SQLiteDatabase,
  { today = () => toLocalISODate(), now = () => new Date().toISOString() }: Dependencies = {},
): TestEnvironmentService {
  return {
    async applyEnvironment1() {
      const scenario = buildEnvironment1(today());
      const timestamp = now();

      await database.withExclusiveTransactionAsync(async (transaction) => {
        await clearOperationalData(transaction);

        for (const market of scenario.markets) {
          await transaction.runAsync(
            `INSERT INTO markets (id, name, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, NULL);`,
            [market.id, market.name, timestamp, timestamp],
          );
        }

        for (const product of scenario.products) {
          await transaction.runAsync(
            `INSERT INTO products (
               id, name, brand, category_id, commercialization_type,
               package_quantity_milli, package_unit, created_at, updated_at, deleted_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
            [
              product.id,
              product.name,
              product.brand,
              product.categoryId,
              product.commercializationType,
              product.packageQuantityMilli,
              product.packageUnit,
              timestamp,
              timestamp,
            ],
          );
        }

        for (const purchase of scenario.purchases) {
          await transaction.runAsync(
            `INSERT INTO purchases (
               id, market_id, status, purchased_at, created_at, updated_at, deleted_at
             ) VALUES (?, ?, 'COMPLETED', ?, ?, ?, NULL);`,
            [
              purchase.id,
              purchase.marketId,
              purchase.purchasedAt,
              purchase.createdAt,
              purchase.createdAt,
            ],
          );

          for (const item of purchase.items) {
            await transaction.runAsync(
              `INSERT INTO purchase_items (
                 id, purchase_id, product_id, commercialization_type,
                 quantity_milli, quantity_unit, unit_price_cents, total_price_cents,
                 created_at, updated_at, deleted_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`,
              [
                item.id,
                purchase.id,
                item.productId,
                item.commercializationType,
                item.quantityMilli,
                item.quantityUnit,
                item.unitPriceCents,
                item.totalPriceCents,
                purchase.createdAt,
                purchase.createdAt,
              ],
            );
          }
        }
      });

      return {
        markets: scenario.markets.length,
        products: scenario.products.length,
        purchases: scenario.purchases.length,
        items: scenario.purchases.reduce((total, purchase) => total + purchase.items.length, 0),
      };
    },

    async reset() {
      await database.withExclusiveTransactionAsync(clearOperationalData);
    },
  };
}

async function clearOperationalData(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    DELETE FROM purchase_items;
    DELETE FROM purchases;
    DELETE FROM products;
    DELETE FROM markets;
  `);
}
