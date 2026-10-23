import { addProductCommercializationType } from '@/database/migrations/005_add_product_commercialization_type';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('migration 005 - forma de comercialização', () => {
  it('preserva produtos existentes como fixos e cria as novas restrições', async () => {
    const execAsync = jest.fn<SQLiteDatabase['execAsync']>().mockResolvedValue();

    await addProductCommercializationType({ execAsync });

    const sql = execAsync.mock.calls[0][0];
    expect(sql).toContain("commercialization_type IN ('FIXED', 'VARIABLE')");
    expect(sql).toContain("commercialization_type = 'VARIABLE'");
    expect(sql).toContain('AND package_quantity_milli IS NULL');
    expect(sql).toContain("'FIXED',");
    expect(sql).toContain('commercialization_type,');
    expect(sql).toContain('CREATE UNIQUE INDEX products_unique_identity');
  });
});
