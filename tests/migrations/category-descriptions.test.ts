import { addCategoryDescriptions } from '@/database/migrations/004_add_category_descriptions';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('migration 004 - categorias do MVP', () => {
  it('adiciona a descrição e reconcilia as 13 categorias preservando os IDs existentes', async () => {
    const execAsync = jest.fn<SQLiteDatabase['execAsync']>().mockResolvedValue();
    const runAsync = jest
      .fn<SQLiteDatabase['runAsync']>()
      .mockResolvedValue({ changes: 1, lastInsertRowId: 0 });
    const database = { execAsync, runAsync } as unknown as Pick<
      SQLiteDatabase,
      'execAsync' | 'runAsync'
    >;

    await addCategoryDescriptions(database);

    expect(execAsync).toHaveBeenCalledWith(expect.stringContaining('ADD COLUMN description'));
    expect(runAsync).toHaveBeenCalledTimes(13);
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(id)'), [
      '10000000-0000-4000-8000-000000000001',
      'Mercearia e despensa',
      expect.stringContaining('arroz'),
      expect.any(String),
      expect.any(String),
    ]);
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(id)'), [
      '10000000-0000-4000-8000-000000000003',
      'Higiene e cuidados pessoais',
      expect.stringContaining('sabonete'),
      expect.any(String),
      expect.any(String),
    ]);
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(id)'), [
      '10000000-0000-4000-8000-000000000005',
      'Outros / Casa',
      expect.stringContaining('não se encaixe'),
      expect.any(String),
      expect.any(String),
    ]);
  });
});
