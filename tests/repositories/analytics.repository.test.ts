import { createAnalyticsRepository } from '@/database/repositories/analytics.repository';
import type { SQLiteDatabase } from 'expo-sqlite';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('SQLite AnalyticsRepository', () => {
  const getAllAsync = jest.fn<SQLiteDatabase['getAllAsync']>();
  const getFirstAsync = jest.fn<SQLiteDatabase['getFirstAsync']>();
  const database = { getAllAsync, getFirstAsync } as unknown as SQLiteDatabase;
  const repository = createAnalyticsRepository(database);
  const range = { startDate: '2026-10-01', endExclusive: '2026-10-27' } as const;

  beforeEach(() => {
    getAllAsync.mockReset();
    getFirstAsync.mockReset();
  });

  it('soma somente itens ativos de compras concluídas no período', async () => {
    getFirstAsync.mockResolvedValue({ total_price_cents: 4250, completed_purchase_count: 2 });
    await expect(repository.getSpendingSummary(range)).resolves.toEqual({
      totalPriceCents: 4250,
      completedPurchaseCount: 2,
    });
    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringMatching(
        /p\.status = 'COMPLETED'[\s\S]*p\.deleted_at IS NULL[\s\S]*pi\.deleted_at IS NULL[\s\S]*p\.purchased_at >= \$startDate[\s\S]*p\.purchased_at < \$endExclusive/,
      ),
      { $startDate: '2026-10-01', $endExclusive: '2026-10-27' },
    );
  });

  it('agrupa categorias pela associação atual do produto', async () => {
    getAllAsync.mockResolvedValue([
      { category_id: 'cat-1', category_name: 'Bebidas', total_price_cents: 3000 },
      { category_id: null, category_name: null, total_price_cents: 1250 },
    ]);
    await expect(repository.listCategorySpending(range)).resolves.toEqual([
      { categoryId: 'cat-1', categoryName: 'Bebidas', totalPriceCents: 3000 },
      { categoryId: null, categoryName: null, totalPriceCents: 1250 },
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringMatching(
        /INNER JOIN products pr ON pr\.id = pi\.product_id[\s\S]*LEFT JOIN categories c ON c\.id = pr\.category_id/,
      ),
      expect.any(Object),
    );
  });

  it('recupera ocorrências com configuração atual, snapshot e mercado', async () => {
    getAllAsync.mockResolvedValue([
      {
        item_id: 'item-1',
        purchase_id: 'purchase-1',
        product_id: 'product-1',
        product_name: 'Carne',
        product_brand: null,
        current_commercialization_type: 'VARIABLE',
        current_measurement_unit: 'KG',
        market_id: 'market-1',
        market_name: 'Mercado Central',
        purchased_at: '2026-10-20',
        item_created_at: '2026-10-20T12:00:00.000Z',
        commercialization_type: 'VARIABLE',
        quantity_milli: 1250,
        quantity_unit: 'KG',
        unit_price_cents: null,
        total_price_cents: 5000,
      },
    ]);
    await expect(repository.listPriceOccurrences('product-1')).resolves.toEqual([
      expect.objectContaining({
        itemId: 'item-1',
        productId: 'product-1',
        marketName: 'Mercado Central',
        purchasedAt: '2026-10-20',
      }),
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('($productId IS NULL OR pi.product_id = $productId)'),
      { $productId: 'product-1' },
    );
  });

  it('rejeita soma acima da representação financeira segura', async () => {
    getFirstAsync.mockResolvedValue({
      total_price_cents: Number.MAX_SAFE_INTEGER + 1,
      completed_purchase_count: 1,
    });
    await expect(repository.getSpendingSummary(range)).rejects.toThrow(
      'Valor financeiro analítico inválido.',
    );
  });
});
