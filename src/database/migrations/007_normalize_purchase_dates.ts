import { isISODate } from '@/domain/date';
import type { SQLiteDatabase } from 'expo-sqlite';

type MigrationDatabase = Pick<SQLiteDatabase, 'getAllAsync' | 'runAsync'>;

type CompletedPurchaseDateRow = {
  id: string;
  purchased_at: string;
};

export async function normalizePurchaseDates(db: MigrationDatabase): Promise<void> {
  const rows = await db.getAllAsync<CompletedPurchaseDateRow>(`
    SELECT id, purchased_at
    FROM purchases
    WHERE status = 'COMPLETED';
  `);

  const invalid = rows.find((row) => !isISODate(row.purchased_at.slice(0, 10)));
  if (invalid) {
    throw new Error(`Compra ${invalid.id} possui data legada inválida.`);
  }

  await db.runAsync(`
    UPDATE purchases
    SET purchased_at = substr(purchased_at, 1, 10)
    WHERE status = 'COMPLETED';
  `);
}
