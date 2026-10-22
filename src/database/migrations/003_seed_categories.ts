import type { SQLiteDatabase } from 'expo-sqlite';

type MigrationConnection = Pick<SQLiteDatabase, 'runAsync'>;

const INITIAL_CATEGORIES = [
  ['10000000-0000-4000-8000-000000000001', 'Alimentos'],
  ['10000000-0000-4000-8000-000000000002', 'Bebidas'],
  ['10000000-0000-4000-8000-000000000003', 'Higiene'],
  ['10000000-0000-4000-8000-000000000004', 'Limpeza'],
  ['10000000-0000-4000-8000-000000000005', 'Outros'],
] as const;

export async function seedInitialCategories(db: MigrationConnection): Promise<void> {
  const timestamp = new Date().toISOString();

  for (const [id, name] of INITIAL_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, NULL);`,
      [id, name, timestamp, timestamp],
    );
  }
}
