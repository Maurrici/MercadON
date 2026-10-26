import { runInPurchaseTransaction } from '@/database/repositories/purchase.transaction';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('transação exclusiva de compras', () => {
  it('executa os repositories sobre a conexão transacional e devolve o resultado', async () => {
    const runAsync = jest
      .fn<SQLiteDatabase['runAsync']>()
      .mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
    const transaction = { runAsync } as unknown as SQLiteDatabase;
    const withExclusiveTransactionAsync = jest.fn<SQLiteDatabase['withExclusiveTransactionAsync']>(
      async (operation) => operation(transaction),
    );
    const database = { withExclusiveTransactionAsync } as unknown as SQLiteDatabase;

    const result = await runInPurchaseTransaction(database, async ({ purchases }) => {
      const purchase = await purchases.createDraft({
        id: 'purchase-1',
        marketId: 'market-1',
        createdAt: '2026-10-23T12:00:00.000Z',
        updatedAt: '2026-10-23T12:00:00.000Z',
      });
      return purchase.id;
    });

    expect(result).toBe('purchase-1');
    expect(withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO purchases'),
      expect.objectContaining({ $id: 'purchase-1' }),
    );
  });

  it('propaga a falha para que o SQLite reverta a operação', async () => {
    const expectedError = new Error('falha durante a operação');
    const transaction = {} as SQLiteDatabase;
    const withExclusiveTransactionAsync = jest.fn<SQLiteDatabase['withExclusiveTransactionAsync']>(
      async (operation) => operation(transaction),
    );
    const database = { withExclusiveTransactionAsync } as unknown as SQLiteDatabase;

    await expect(
      runInPurchaseTransaction(database, async () => {
        throw expectedError;
      }),
    ).rejects.toBe(expectedError);
  });
});
