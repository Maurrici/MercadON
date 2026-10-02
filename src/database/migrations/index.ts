import { createInitialSchema } from "@/database/migrations/001_initial_schema";
import type { SQLiteDatabase } from "expo-sqlite";

type MigrationConnection = Pick<SQLiteDatabase, 'execAsync'>;

type Migration = {
  version: number;
  up: (db:MigrationConnection) => Promise<void>;
}

const MIGRATIONS: readonly Migration[] = [
  {version: 1, up: createInitialSchema}
]

const DATABASE_VERSION = MIGRATIONS.at(-1)?.version ?? 0;

type UserVersionRow = {
  user_version: number;
};

export async function migrateDatabase(database: SQLiteDatabase) : Promise<void> {
  const result = await database.getFirstAsync<UserVersionRow>('PRAGMA user_version;');

  if(!result || !Number.isInteger(result.user_version)) {
    throw new Error('Não foi possível consultar a versão do banco.');
  }

  if(result.user_version > DATABASE_VERSION) {
    throw new Error(`Versão do banco incompatível: (${result.user_version}) > (${DATABASE_VERSION})`)
  }

  let currentVersion = result.user_version;

  for(const migration of MIGRATIONS) {
    if(migration.version <= currentVersion){
      continue;
    }

    if(migration.version !== currentVersion + 1) {
      throw new Error(
        `Sequência de migrations inválida: esperado ${currentVersion + 1}, encontrado ${migration.version}.`
      );
    }

    await database.withExclusiveTransactionAsync(async (txn) => {
      await migration.up(txn);

      await txn.execAsync(
        `PRAGMA user_version = ${migration.version};`
      );
    })

    currentVersion = migration.version;
  }

  if(currentVersion !== DATABASE_VERSION) {
    throw new Error('O banco não executou todas as migrations');
  }
}