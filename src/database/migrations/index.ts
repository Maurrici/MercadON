import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 0;

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

  // As migrations de criação/evolução de tabelas serão implementadas
  // em suas respectivas tasks. Não altere user_version neste momento
}