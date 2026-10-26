import { createPurchaseItemRepository } from '@/database/repositories/purchase-item.repository';
import type { SQLiteDatabase } from 'expo-sqlite';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const fixedRow = {
  id: 'item-fixed',
  purchase_id: 'purchase-1',
  product_id: 'product-coffee',
  commercialization_type: 'FIXED' as const,
  quantity_milli: 2000,
  quantity_unit: 'UNIT' as const,
  unit_price_cents: 1490,
  total_price_cents: 2980,
  created_at: '2026-10-23T12:00:00.000Z',
  updated_at: '2026-10-23T12:00:00.000Z',
  deleted_at: null,
};

const variableRow = {
  ...fixedRow,
  id: 'item-variable',
  product_id: 'product-meat',
  commercialization_type: 'VARIABLE' as const,
  quantity_milli: 1275,
  quantity_unit: 'KG' as const,
  unit_price_cents: null,
  total_price_cents: 5087,
};

describe('SQLite PurchaseItemRepository', () => {
  const getAllAsync = jest.fn<SQLiteDatabase['getAllAsync']>();
  const getFirstAsync = jest.fn<SQLiteDatabase['getFirstAsync']>();
  const runAsync = jest.fn<SQLiteDatabase['runAsync']>();
  const database = { getAllAsync, getFirstAsync, runAsync } as unknown as SQLiteDatabase;
  const repository = createPurchaseItemRepository(database);

  beforeEach(() => {
    getAllAsync.mockReset();
    getFirstAsync.mockReset();
    runAsync.mockReset();
  });

  it('lista itens ativos na ordem determinística de inclusão', async () => {
    getAllAsync.mockResolvedValue([fixedRow, variableRow]);

    await expect(repository.listActiveByPurchaseId('purchase-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'item-fixed',
        commercializationType: 'FIXED',
        quantityUnit: 'UNIT',
        unitPriceCents: 1490,
        totalPriceCents: 2980,
      }),
      expect.objectContaining({
        id: 'item-variable',
        commercializationType: 'VARIABLE',
        quantityUnit: 'KG',
        unitPriceCents: null,
        totalPriceCents: 5087,
      }),
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at ASC, id ASC'),
      ['purchase-1'],
    );
  });

  it('persiste todos os valores financeiros do item fixo', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

    await repository.create({
      id: fixedRow.id,
      purchaseId: fixedRow.purchase_id,
      productId: fixedRow.product_id,
      commercializationType: 'FIXED',
      quantityMilli: fixedRow.quantity_milli,
      quantityUnit: 'UNIT',
      unitPriceCents: fixedRow.unit_price_cents,
      totalPriceCents: fixedRow.total_price_cents,
      createdAt: fixedRow.created_at,
      updatedAt: fixedRow.updated_at,
    });

    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO purchase_items'),
      expect.objectContaining({
        $commercializationType: 'FIXED',
        $unitPriceCents: 1490,
        $totalPriceCents: 2980,
      }),
    );
  });

  it('soma somente os totais ativos persistidos', async () => {
    getFirstAsync.mockResolvedValue({ total: 8067 });

    await expect(repository.sumActiveTotalByPurchaseId('purchase-1')).resolves.toBe(8067);
    expect(getFirstAsync).toHaveBeenCalledWith(expect.stringContaining('SUM(total_price_cents)'), [
      'purchase-1',
    ]);
  });

  it('busca a ocorrência mais recente somente em compras concluídas', async () => {
    getFirstAsync.mockResolvedValue({
      ...variableRow,
      purchased_at: '2026-10-22T18:00:00.000Z',
    });

    await expect(
      repository.findLatestCompletedByProduct('product-meat', 'purchase-current'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'item-variable',
        productId: 'product-meat',
        purchasedAt: '2026-10-22T18:00:00.000Z',
      }),
    );
    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringMatching(
        /p\.status = 'COMPLETED'[\s\S]*ORDER BY p\.purchased_at DESC, pi\.created_at DESC, pi\.id DESC/,
      ),
      {
        $productId: 'product-meat',
        $excludePurchaseId: 'purchase-current',
      },
    );
  });

  it('remove logicamente todos os itens ativos do rascunho para descarte transacional', async () => {
    runAsync.mockResolvedValue({ changes: 2, lastInsertRowId: 0 });

    await expect(
      repository.softDeleteActiveByPurchaseId('purchase-1', fixedRow.updated_at),
    ).resolves.toBe(2);
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE purchase_id = ?'), [
      fixedRow.updated_at,
      fixedRow.updated_at,
      'purchase-1',
    ]);
  });

  it('remove fisicamente todos os itens antes da exclusão definitiva da compra', async () => {
    runAsync.mockResolvedValue({ changes: 2, lastInsertRowId: 0 });

    await expect(repository.hardDeleteByPurchaseId('purchase-1')).resolves.toBe(2);
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM purchase_items'), [
      'purchase-1',
    ]);
  });

  it('rejeita um registro fixo persistido sem preço unitário', async () => {
    getFirstAsync.mockResolvedValue({ ...fixedRow, unit_price_cents: null });

    await expect(repository.findById(fixedRow.id)).rejects.toThrow(
      'Item fixo persistido com dados inválidos.',
    );
  });
});
