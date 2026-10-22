import type { Market } from '@/domain/models/Market';
import type {
  MarketIdentity,
  MarketRepository,
  SaveMarketRecord,
  UpdateMarketRecord,
} from '@/domain/repositories/market.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

type MarketRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function mapMarket(row: MarketRow): Market {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createMarketRepository(db: SQLiteDatabase): MarketRepository {
  return {
    async listActive(): Promise<Market[]> {
      const rows = await db.getAllAsync<MarketRow>(marketSQL.listActive);
      return rows.map(mapMarket);
    },

    async findById(id): Promise<Market | null> {
      const row = await db.getFirstAsync<MarketRow>(marketSQL.findById, [id]);
      return row ? mapMarket(row) : null;
    },

    async findByIdentity(identity: MarketIdentity, excludeId?: string): Promise<Market | null> {
      const row = await db.getFirstAsync<MarketRow>(marketSQL.findByIdentity, {
        $name: identity.name,
        $excludeId: excludeId ?? null,
      });
      return row ? mapMarket(row) : null;
    },

    async create(input: SaveMarketRecord): Promise<Market> {
      await db.runAsync(marketSQL.create, toSaveParams(input));
      return { ...input, deletedAt: null };
    },

    async update(input: UpdateMarketRecord): Promise<Market> {
      const current = await db.getFirstAsync<MarketRow>(marketSQL.findById, [input.id]);
      if (!current) throw new Error('Mercado não encontrado.');

      const result = await db.runAsync(marketSQL.update, toUpdateParams(input));
      if (result.changes !== 1) throw new Error('Mercado não encontrado para edição.');

      return { ...mapMarket(current), ...input, deletedAt: null };
    },

    async softDelete(id, deletedAt): Promise<void> {
      const result = await db.runAsync(marketSQL.softDelete, [deletedAt, deletedAt, id]);
      if (result.changes !== 1) throw new Error('Mercado não encontrado para exclusão.');
    },

    async restore(id, restoredAt): Promise<Market> {
      const result = await db.runAsync(marketSQL.restore, [restoredAt, id]);
      if (result.changes !== 1) throw new Error('Mercado não encontrado para restauração.');

      const row = await db.getFirstAsync<MarketRow>(marketSQL.findById, [id]);
      if (!row) throw new Error('Mercado restaurado não foi encontrado.');
      return mapMarket(row);
    },
  };
}

function toSaveParams(input: SaveMarketRecord) {
  return {
    $id: input.id,
    $name: input.name,
    $createdAt: input.createdAt,
    $updatedAt: input.updatedAt,
  };
}

function toUpdateParams(input: UpdateMarketRecord) {
  return {
    $id: input.id,
    $name: input.name,
    $updatedAt: input.updatedAt,
  };
}

const marketSQL = {
  listActive: `
    SELECT id, name, created_at, updated_at, deleted_at
    FROM markets
    WHERE deleted_at IS NULL
    ORDER BY name COLLATE NOCASE ASC;
  `,
  findById: `
    SELECT id, name, created_at, updated_at, deleted_at
    FROM markets
    WHERE id = ?
    LIMIT 1;
  `,
  findByIdentity: `
    SELECT id, name, created_at, updated_at, deleted_at
    FROM markets
    WHERE name = $name COLLATE NOCASE
      AND ($excludeId IS NULL OR id <> $excludeId)
    LIMIT 1;
  `,
  create: `
    INSERT INTO markets (id, name, created_at, updated_at, deleted_at)
    VALUES ($id, $name, $createdAt, $updatedAt, NULL);
  `,
  update: `
    UPDATE markets
    SET name = $name,
        updated_at = $updatedAt
    WHERE id = $id AND deleted_at IS NULL;
  `,
  softDelete: `
    UPDATE markets
    SET deleted_at = ?, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL;
  `,
  restore: `
    UPDATE markets
    SET deleted_at = NULL, updated_at = ?
    WHERE id = ? AND deleted_at IS NOT NULL;
  `,
};
