import type { Category } from '@/domain/models/Category';
import type { CategoryRepository } from '@/domain/repositories/category.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

type CategoryRow = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function createCategoryRepository(db: SQLiteDatabase): CategoryRepository {
  return {
    async listActive(): Promise<Category[]> {
      const rows = await db.getAllAsync<CategoryRow>(`
        SELECT id, name, description, created_at, updated_at, deleted_at
        FROM categories
        WHERE deleted_at IS NULL
        ORDER BY name COLLATE NOCASE ASC;
      `);

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
      }));
    },
  };
}
