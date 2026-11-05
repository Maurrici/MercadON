import { normalizePurchaseDates } from '@/database/migrations/007_normalize_purchase_dates';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('migration 007 - datas civis de compra', () => {
  it('preserva o dia anteriormente apresentado e remove o horário', async () => {
    const getAllAsync = jest.fn<SQLiteDatabase['getAllAsync']>().mockResolvedValue([
      { id: 'purchase-1', purchased_at: '2026-10-20T12:00:00.000Z' },
      { id: 'purchase-2', purchased_at: '2026-10-21' },
    ]);
    const runAsync = jest
      .fn<SQLiteDatabase['runAsync']>()
      .mockResolvedValue({ changes: 2, lastInsertRowId: 0 });
    const database = { getAllAsync, runAsync } as unknown as SQLiteDatabase;

    await normalizePurchaseDates(database);

    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('substr(purchased_at, 1, 10)'));
  });

  it('interrompe a migration quando encontra data legada inválida', async () => {
    const getAllAsync = jest
      .fn<SQLiteDatabase['getAllAsync']>()
      .mockResolvedValue([{ id: 'purchase-bad', purchased_at: 'inválida' }]);
    const runAsync = jest.fn<SQLiteDatabase['runAsync']>();
    const database = { getAllAsync, runAsync } as unknown as SQLiteDatabase;

    await expect(normalizePurchaseDates(database)).rejects.toThrow(
      'Compra purchase-bad possui data legada inválida.',
    );
    expect(runAsync).not.toHaveBeenCalled();
  });
});
