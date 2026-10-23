import { createProductRepository } from '@/database/repositories/product.repository';
import type { SQLiteDatabase } from 'expo-sqlite';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const row = {
  id: 'product-1',
  name: 'Arroz',
  brand: 'Marca A',
  category_id: 'category-food',
  category_name: 'Alimentos',
  commercialization_type: 'FIXED' as const,
  package_quantity_milli: 1000,
  package_unit: 'KG' as const,
  created_at: '2026-10-21T12:00:00.000Z',
  updated_at: '2026-10-21T12:00:00.000Z',
  deleted_at: null,
};

describe('SQLite ProductRepository', () => {
  const getAllAsync = jest.fn<SQLiteDatabase['getAllAsync']>();
  const getFirstAsync = jest.fn<SQLiteDatabase['getFirstAsync']>();
  const runAsync = jest.fn<SQLiteDatabase['runAsync']>();
  const database = { getAllAsync, getFirstAsync, runAsync } as unknown as SQLiteDatabase;
  const repository = createProductRepository(database);

  beforeEach(() => {
    getAllAsync.mockReset();
    getFirstAsync.mockReset();
    runAsync.mockReset();
  });

  it('mapeia a listagem ativa do formato SQLite para o domínio', async () => {
    getAllAsync.mockResolvedValue([row]);

    await expect(repository.listActive()).resolves.toEqual([
      {
        id: 'product-1',
        name: 'Arroz',
        brand: 'Marca A',
        categoryId: 'category-food',
        categoryName: 'Alimentos',
        commercializationType: 'FIXED',
        packageQuantityMilli: 1000,
        packageUnit: 'KG',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: null,
      },
    ]);
  });

  it('consulta a identidade completa e exclui o produto em edição', async () => {
    getFirstAsync.mockResolvedValue(null);

    await repository.findByIdentity(
      {
        name: 'Arroz',
        brand: 'Marca A',
        commercializationType: 'FIXED',
        packageQuantityMilli: 1000,
        packageUnit: 'KG',
      },
      'product-2',
    );

    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('COLLATE NOCASE'),
      expect.objectContaining({
        $name: 'Arroz',
        $brand: 'Marca A',
        $commercializationType: 'FIXED',
        $packageQuantityMilli: 1000,
        $packageUnit: 'KG',
        $excludeId: 'product-2',
      }),
    );
  });

  it('persiste todos os campos normalizados durante o cadastro', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

    const product = await repository.create({
      id: row.id,
      name: row.name,
      brand: row.brand,
      categoryId: row.category_id,
      commercializationType: row.commercialization_type,
      packageQuantityMilli: row.package_quantity_milli,
      packageUnit: row.package_unit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });

    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO products'),
      expect.objectContaining({
        $id: row.id,
        $categoryId: row.category_id,
        $commercializationType: 'FIXED',
        $packageQuantityMilli: 1000,
      }),
    );
    expect(product.deletedAt).toBeNull();
  });

  it('faz exclusão lógica sem remover o registro', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

    await repository.softDelete('product-1', row.updated_at);

    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('SET deleted_at = ?'), [
      row.updated_at,
      row.updated_at,
      'product-1',
    ]);
  });

  it('informa erro quando tenta excluir um produto inexistente', async () => {
    runAsync.mockResolvedValue({ changes: 0, lastInsertRowId: 0 });

    await expect(repository.softDelete('missing', row.updated_at)).rejects.toThrow(
      'Produto não encontrado para exclusão.',
    );
  });

  it('restaura e devolve o produto atualizado', async () => {
    runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });
    getFirstAsync.mockResolvedValue(row);

    await expect(repository.restore('product-1', row.updated_at)).resolves.toMatchObject({
      id: 'product-1',
      deletedAt: null,
    });
    expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('SET deleted_at = NULL'), [
      row.updated_at,
      'product-1',
    ]);
  });
});
