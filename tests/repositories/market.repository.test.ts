import { createMarketRepository } from '@/database/repositories/market.repository';
import type { SQLiteDatabase } from 'expo-sqlite';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const row = {
  id: 'market-1',
  name: 'Assaí Mister Hull',
  created_at: '2026-10-21T12:00:00.000Z',
  updated_at: '2026-10-21T12:00:00.000Z',
  deleted_at: null,
};

describe('SQLite MarketRepository', () => {
  const getAllAsync = jest.fn<SQLiteDatabase['getAllAsync']>();
  const getFirstAsync = jest.fn<SQLiteDatabase['getFirstAsync']>();
  const runAsync = jest.fn<SQLiteDatabase['runAsync']>();
  const database = { getAllAsync, getFirstAsync, runAsync } as unknown as SQLiteDatabase;
  const repository = createMarketRepository(database);

  beforeEach(() => {
    getAllAsync.mockReset();
    getFirstAsync.mockReset();
    runAsync.mockReset();
  });

  it('mapeia a listagem ativa do formato SQLite para o domínio', async () => {
    getAllAsync.mockResolvedValue([row]);

    await expect(repository.listActive()).resolves.toEqual([
      {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: null,
      },
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY name COLLATE NOCASE'),
    );
  });

  it('consulta identidade sem diferenciar maiúsculas e exclui o mercado em edição', async () => {
    getFirstAsync.mockResolvedValue(null);

    await repository.findByIdentity({ name: 'Assaí' }, 'market-2');

    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('name = $name COLLATE NOCASE'),
      { $name: 'Assaí', $excludeId: 'market-2' },
    );
  });

  it('persiste os dados normalizados durante o cadastro', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

    const market = await repository.create({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });

    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO markets'), {
      $id: row.id,
      $name: row.name,
      $createdAt: row.created_at,
      $updatedAt: row.updated_at,
    });
    expect(market.deletedAt).toBeNull();
  });

  it('atualiza somente mercados ativos', async () => {
    getFirstAsync.mockResolvedValue(row);
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

    await expect(
      repository.update({ id: row.id, name: 'Assaí Parangaba', updatedAt: row.updated_at }),
    ).resolves.toMatchObject({ id: row.id, name: 'Assaí Parangaba', deletedAt: null });
    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('deleted_at IS NULL'),
      expect.objectContaining({ $id: row.id, $name: 'Assaí Parangaba' }),
    );
  });

  it('informa erro quando a edição não altera um mercado ativo', async () => {
    getFirstAsync.mockResolvedValue(row);
    runAsync.mockResolvedValue({ changes: 0, lastInsertRowId: 0 });

    await expect(
      repository.update({ id: row.id, name: row.name, updatedAt: row.updated_at }),
    ).rejects.toThrow('Mercado não encontrado para edição.');
  });

  it('faz exclusão lógica sem remover o registro', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

    await repository.softDelete(row.id, row.updated_at);

    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('SET deleted_at = ?'), [
      row.updated_at,
      row.updated_at,
      row.id,
    ]);
  });

  it('informa erro ao excluir um mercado inexistente', async () => {
    runAsync.mockResolvedValue({ changes: 0, lastInsertRowId: 0 });

    await expect(repository.softDelete('missing', row.updated_at)).rejects.toThrow(
      'Mercado não encontrado para exclusão.',
    );
  });

  it('restaura e devolve o mercado atualizado', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });
    getFirstAsync.mockResolvedValue(row);

    await expect(repository.restore(row.id, row.updated_at)).resolves.toMatchObject({
      id: row.id,
      deletedAt: null,
    });
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('SET deleted_at = NULL'), [
      row.updated_at,
      row.id,
    ]);
  });

  it('informa erro ao restaurar um mercado indisponível', async () => {
    runAsync.mockResolvedValue({ changes: 0, lastInsertRowId: 0 });

    await expect(repository.restore('missing', row.updated_at)).rejects.toThrow(
      'Mercado não encontrado para restauração.',
    );
  });
});
