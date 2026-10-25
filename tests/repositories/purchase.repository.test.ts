import { createPurchaseRepository } from '@/database/repositories/purchase.repository';
import type { SQLiteDatabase } from 'expo-sqlite';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const draftRow = {
  id: 'purchase-draft',
  market_id: 'market-1',
  status: 'DRAFT' as const,
  purchased_at: null,
  created_at: '2026-10-23T12:00:00.000Z',
  updated_at: '2026-10-23T12:00:00.000Z',
  deleted_at: null,
};

const completedRow = {
  ...draftRow,
  id: 'purchase-completed',
  status: 'COMPLETED' as const,
  purchased_at: '2026-10-22T18:00:00.000Z',
  market_name: 'Mercado Central',
  item_count: 2,
  total_price_cents: 4250,
};

describe('SQLite PurchaseRepository', () => {
  const getAllAsync = jest.fn<SQLiteDatabase['getAllAsync']>();
  const getFirstAsync = jest.fn<SQLiteDatabase['getFirstAsync']>();
  const runAsync = jest.fn<SQLiteDatabase['runAsync']>();
  const database = { getAllAsync, getFirstAsync, runAsync } as unknown as SQLiteDatabase;
  const repository = createPurchaseRepository(database);

  beforeEach(() => {
    getAllAsync.mockReset();
    getFirstAsync.mockReset();
    runAsync.mockReset();
  });

  it('recupera o único rascunho ativo', async () => {
    getFirstAsync.mockResolvedValue(draftRow);

    await expect(repository.findActiveDraft()).resolves.toEqual({
      id: 'purchase-draft',
      marketId: 'market-1',
      status: 'DRAFT',
      purchasedAt: null,
      createdAt: draftRow.created_at,
      updatedAt: draftRow.updated_at,
      deletedAt: null,
    });
    expect(getFirstAsync).toHaveBeenCalledWith(expect.stringContaining("status = 'DRAFT'"));
  });

  it('lista compras concluídas com mercado, contagem e total derivados', async () => {
    getAllAsync.mockResolvedValue([completedRow]);

    await expect(repository.listCompleted()).resolves.toEqual([
      expect.objectContaining({
        id: 'purchase-completed',
        status: 'COMPLETED',
        marketName: 'Mercado Central',
        itemCount: 2,
        totalPriceCents: 4250,
      }),
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY p.purchased_at DESC, p.created_at DESC, p.id DESC'),
    );
  });

  it('cria um rascunho sem data de conclusão', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

    await expect(
      repository.createDraft({
        id: draftRow.id,
        marketId: draftRow.market_id,
        createdAt: draftRow.created_at,
        updatedAt: draftRow.updated_at,
      }),
    ).resolves.toMatchObject({ status: 'DRAFT', purchasedAt: null, deletedAt: null });
    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining("$id, $marketId, 'DRAFT', NULL"),
      expect.objectContaining({ $marketId: 'market-1' }),
    );
  });

  it('finaliza somente um rascunho ativo que possua item', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });
    getFirstAsync.mockResolvedValue(completedRow);

    await expect(
      repository.completeDraft(draftRow.id, completedRow.purchased_at, completedRow.purchased_at),
    ).resolves.toMatchObject({ status: 'COMPLETED' });
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('AND EXISTS'), [
      completedRow.purchased_at,
      completedRow.purchased_at,
      draftRow.id,
    ]);
  });

  it('rejeita a finalização quando a atualização atômica não altera registro', async () => {
    runAsync.mockResolvedValue({ changes: 0, lastInsertRowId: 0 });

    await expect(
      repository.completeDraft(draftRow.id, draftRow.updated_at, draftRow.updated_at),
    ).rejects.toThrow('Rascunho inexistente ou sem itens para finalização.');
  });

  it('corrige mercado e data somente de compra concluída', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });
    getFirstAsync.mockResolvedValue({
      ...completedRow,
      market_id: 'market-2',
      purchased_at: '2026-10-20T18:00:00.000Z',
    });

    await expect(
      repository.updateCompleted(
        completedRow.id,
        'market-2',
        '2026-10-20T18:00:00.000Z',
        completedRow.updated_at,
      ),
    ).resolves.toEqual(
      expect.objectContaining({ marketId: 'market-2', purchasedAt: '2026-10-20T18:00:00.000Z' }),
    );
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining("status = 'COMPLETED'"), [
      'market-2',
      '2026-10-20T18:00:00.000Z',
      completedRow.updated_at,
      completedRow.id,
    ]);
  });

  it('exclui definitivamente somente compra concluída', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

    await expect(repository.deleteCompleted(completedRow.id)).resolves.toBeUndefined();
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM purchases'), [
      completedRow.id,
    ]);
  });
});
