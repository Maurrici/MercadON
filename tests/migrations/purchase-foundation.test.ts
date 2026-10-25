import { createPurchaseFoundation } from '@/database/migrations/006_purchase_foundation';
import type { SQLiteDatabase } from 'expo-sqlite';
import { describe, expect, it, jest } from '@jest/globals';

describe('migration 006 - fundação de compras', () => {
  it('preserva a semântica dos itens legados e cria as invariantes aprovadas', async () => {
    const execAsync = jest.fn<SQLiteDatabase['execAsync']>().mockResolvedValue();

    await createPurchaseFoundation({ execAsync });

    const sql = execAsync.mock.calls[0][0];
    expect(sql).toContain("CASE WHEN quantity_unit = 'UNIT' THEN 'FIXED' ELSE 'VARIABLE' END");
    expect(sql).toContain('total_price_cents INTEGER NOT NULL');
    expect(sql).toContain("commercialization_type = 'FIXED'");
    expect(sql).toContain("commercialization_type = 'VARIABLE'");
    expect(sql).toContain('total_price_cents = (quantity_milli / 1000) * unit_price_cents');
    expect(sql).toContain('CREATE UNIQUE INDEX purchases_single_active_draft');
    expect(sql).toContain("WHERE status = 'DRAFT' AND deleted_at IS NULL");
    expect(sql).toContain('CREATE UNIQUE INDEX purchase_items_unique_active_product');
    expect(sql).toContain('ON purchase_items (purchase_id, product_id)');
  });
});
