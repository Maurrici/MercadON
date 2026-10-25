import { createDashboardRepository } from '@/database/repositories/dashboard.repository';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('SQLite DashboardRepository', () => {
  it('conta apenas compras concluídas e cadastros ativos em uma consulta', async () => {
    const getFirstAsync = jest.fn<SQLiteDatabase['getFirstAsync']>().mockResolvedValue({
      completed_purchase_count: 4,
      product_count: 18,
      market_count: 3,
    });
    const database = { getFirstAsync } as unknown as SQLiteDatabase;
    const repository = createDashboardRepository(database);

    await expect(repository.getMetrics()).resolves.toEqual({
      completedPurchases: 4,
      products: 18,
      markets: 3,
    });
    expect(getFirstAsync).toHaveBeenCalledWith(expect.stringContaining("status = 'COMPLETED'"));
    expect(getFirstAsync).toHaveBeenCalledWith(expect.stringContaining('deleted_at IS NULL'));
  });

  it('falha quando o SQLite não devolve o resumo', async () => {
    const getFirstAsync = jest.fn<SQLiteDatabase['getFirstAsync']>().mockResolvedValue(null);
    const repository = createDashboardRepository({ getFirstAsync } as unknown as SQLiteDatabase);

    await expect(repository.getMetrics()).rejects.toThrow(
      'Não foi possível calcular o resumo do aplicativo.',
    );
  });
});
