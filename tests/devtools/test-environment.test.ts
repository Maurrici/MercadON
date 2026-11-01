import { buildEnvironment1 } from '@/devtools/test-environment/scenario';
import { createTestEnvironmentService } from '@/devtools/test-environment/service';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('Ambiente de teste', () => {
  it('cria um cenário relativo à data atual com seis meses e preços comparáveis', () => {
    const scenario = buildEnvironment1('2026-10-27');
    const months = new Set(scenario.purchases.map((purchase) => purchase.purchasedAt.slice(0, 7)));
    const items = scenario.purchases.flatMap((purchase) => purchase.items);

    expect(scenario.markets).toHaveLength(3);
    expect(scenario.products).toHaveLength(7);
    expect(scenario.purchases).toHaveLength(8);
    expect(items).toHaveLength(23);
    expect(months).toEqual(
      new Set(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']),
    );
    expect(scenario.purchases.every((purchase) => purchase.purchasedAt <= '2026-10-27')).toBe(true);
    expect(
      items
        .filter((item) => item.commercializationType === 'FIXED')
        .every(
          (item) =>
            item.unitPriceCents !== null &&
            item.totalPriceCents === (item.quantityMilli / 1000) * item.unitPriceCents,
        ),
    ).toBe(true);
    expect(
      items
        .filter((item) => item.commercializationType === 'VARIABLE')
        .every((item) => item.unitPriceCents === null),
    ).toBe(true);
  });

  it('limita datas do mês atual ao dia de referência', () => {
    const scenario = buildEnvironment1('2026-10-01');
    const currentDates = scenario.purchases
      .map((purchase) => purchase.purchasedAt)
      .filter((date) => date.startsWith('2026-10'));

    expect(currentDates).toEqual(['2026-10-01', '2026-10-01', '2026-10-01']);
  });

  it('substitui os dados operacionais dentro de uma única transação', async () => {
    const execAsync = jest.fn<SQLiteDatabase['execAsync']>().mockResolvedValue();
    const runAsync = jest.fn<SQLiteDatabase['runAsync']>().mockResolvedValue({
      changes: 1,
      lastInsertRowId: 1,
    });
    const transaction = { execAsync, runAsync } as unknown as SQLiteDatabase;
    const withExclusiveTransactionAsync = jest
      .fn<SQLiteDatabase['withExclusiveTransactionAsync']>()
      .mockImplementation(async (operation) => operation(transaction));
    const database = { withExclusiveTransactionAsync } as unknown as SQLiteDatabase;
    const service = createTestEnvironmentService(database, {
      today: () => '2026-10-27',
      now: () => '2026-10-27T15:00:00.000Z',
    });

    await expect(service.applyEnvironment1()).resolves.toEqual({
      markets: 3,
      products: 7,
      purchases: 8,
      items: 23,
    });
    expect(withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(execAsync).toHaveBeenCalledWith(
      expect.stringMatching(
        /DELETE FROM purchase_items;[\s\S]*DELETE FROM purchases;[\s\S]*DELETE FROM products;[\s\S]*DELETE FROM markets;/,
      ),
    );
    expect(runAsync).toHaveBeenCalledTimes(41);
  });

  it('redefine somente os dados operacionais e preserva schema e categorias', async () => {
    const execAsync = jest.fn<SQLiteDatabase['execAsync']>().mockResolvedValue();
    const transaction = { execAsync } as unknown as SQLiteDatabase;
    const withExclusiveTransactionAsync = jest
      .fn<SQLiteDatabase['withExclusiveTransactionAsync']>()
      .mockImplementation(async (operation) => operation(transaction));
    const service = createTestEnvironmentService({
      withExclusiveTransactionAsync,
    } as unknown as SQLiteDatabase);

    await service.reset();

    expect(execAsync).toHaveBeenCalledTimes(1);
    expect(execAsync.mock.calls[0][0]).not.toMatch(/categories|DROP TABLE|user_version/i);
  });
});
