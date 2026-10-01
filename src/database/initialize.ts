
import { migrateDatabase } from '@/database/migrations';
import type { SQLiteDatabase } from 'expo-sqlite';


type ForeignKeysRow = {
  foreign_keys: number;
}

type JournalModeRow = {
  journal_mode: string;
}

export async function initializeDatabase(
  db: SQLiteDatabase
): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const foreignKeys = await db.getFirstAsync<ForeignKeysRow>('PRAGMA foreign_keys;');

  if(foreignKeys?.foreign_keys !== 1) {
    throw new Error('Não foi possível habilitar as foreign keys.');
  }

  const journal = await db.getFirstAsync<JournalModeRow>(
    'PRAGMA journal_mode = WAL;'
  );

  if (journal?.journal_mode.toLowerCase() !== 'wal') {
    throw new Error('Não foi possível habilitar o modo WAL.');
  }

  // Somente após a configuração validamos/evoluímos o esquema.
  await migrateDatabase(db);
}
