import { createCategoryRepository } from '@/database/repositories/category.repository';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('SQLite CategoryRepository', () => {
  it('mapeia nome e descrição das categorias ativas para o domínio', async () => {
    const row = {
      id: 'category-1',
      name: 'Hortifruti',
      description: 'frutas, verduras, legumes, temperos frescos',
      created_at: '2026-10-21T12:00:00.000Z',
      updated_at: '2026-10-21T12:00:00.000Z',
      deleted_at: null,
    };
    const getAllAsync = jest.fn<SQLiteDatabase['getAllAsync']>().mockResolvedValue([row]);
    const database = { getAllAsync } as unknown as SQLiteDatabase;

    await expect(createCategoryRepository(database).listActive()).resolves.toEqual([
      {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: null,
      },
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining('description'));
  });
});
