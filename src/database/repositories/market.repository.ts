import { Market } from '@/domain/models/Market';
import { CreateMarketInput, MarketRepository } from '@/domain/repositories/market.repository';
import { SQLiteDatabase } from 'expo-sqlite';

type MarketRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
};

function mapMarketRow(row: MarketRow): Market {
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
    async create(input: CreateMarketInput): Promise<Market> {
      const market: Market = {
        ...input,
        deletedAt: null,
      };

      await db.runAsync(marketSQL.create, {
        $id: market.id,
        $name: market.name,
        $createdAt: market.createdAt,
        $updatedAt: market.updatedAt,
      });

      return market;
    },

    async findById(id): Promise<Market | null> {
      const row = await db.getFirstAsync<MarketRow>(marketSQL.findById, [id]);

      if (!row) {
        return null;
      }

      return mapMarketRow(row);
    },

    async listActive(): Promise<Market[]> {
      const rows = await db.getAllAsync<MarketRow>(marketSQL.findAll);

      return rows.map(mapMarketRow);
    },
  };
}

const marketSQL = {
  create: `
    INSERT INTO markets (
      id,
      name,
      created_at,
      updated_at,
      deleted_at
    )
    VALUES (
      $id,
      $name,
      $createdAt,
      $updatedAt,
      NULL
    );
  `,
  findAll: `
    SELECT
      id,
      name,
      created_at,
      updated_at,
      deleted_at
    FROM markets
    WHERE deleted_at IS NULL
    ORDER BY name ASC;
  `,
  findById: `
    SELECT
      id,
      name,
      created_at,
      updated_at,
      deleted_at
    FROM markets
    WHERE id = ?
    LIMIT 1;
  `,
};
