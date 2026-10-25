import type { Purchase } from '@/domain/models/Purchase';
import type {
  PurchaseRepository,
  PurchaseSummary,
  SaveDraftPurchaseRecord,
} from '@/domain/repositories/purchase.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

type PurchaseRow = {
  id: string;
  market_id: string;
  status: Purchase['status'];
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  market_name?: string;
  item_count?: number;
  total_price_cents?: number;
};

function mapPurchase(row: PurchaseRow): Purchase {
  const base = {
    id: row.id,
    marketId: row.market_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };

  if (row.status === 'DRAFT') {
    return { ...base, status: 'DRAFT', purchasedAt: null };
  }

  if (!row.purchased_at) {
    throw new Error('Compra concluída sem data de conclusão.');
  }

  return { ...base, status: 'COMPLETED', purchasedAt: row.purchased_at };
}

export function createPurchaseRepository(db: SQLiteDatabase): PurchaseRepository {
  return {
    async findActiveDraft(): Promise<Purchase | null> {
      const row = await db.getFirstAsync<PurchaseRow>(purchaseSQL.findActiveDraft);
      return row ? mapPurchase(row) : null;
    },

    async findById(id): Promise<Purchase | null> {
      const row = await db.getFirstAsync<PurchaseRow>(purchaseSQL.findById, [id]);
      return row ? mapPurchase(row) : null;
    },

    async listCompleted(): Promise<PurchaseSummary[]> {
      const rows = await db.getAllAsync<PurchaseRow>(purchaseSQL.listCompleted);
      return rows.map((row) => {
        const purchase = mapPurchase(row);

        if (purchase.status !== 'COMPLETED' || row.market_name === undefined) {
          throw new Error('Resumo de compra concluída inválido.');
        }

        return {
          ...purchase,
          marketName: row.market_name,
          itemCount: row.item_count ?? 0,
          totalPriceCents: row.total_price_cents ?? 0,
        };
      });
    },

    async createDraft(input: SaveDraftPurchaseRecord): Promise<Purchase> {
      await db.runAsync(purchaseSQL.createDraft, {
        $id: input.id,
        $marketId: input.marketId,
        $createdAt: input.createdAt,
        $updatedAt: input.updatedAt,
      });

      return {
        ...input,
        status: 'DRAFT',
        purchasedAt: null,
        deletedAt: null,
      };
    },

    async updateDraftMarket(id, marketId, updatedAt): Promise<Purchase> {
      const result = await db.runAsync(purchaseSQL.updateDraftMarket, [marketId, updatedAt, id]);
      if (result.changes !== 1) throw new Error('Rascunho não encontrado para alteração.');

      const row = await db.getFirstAsync<PurchaseRow>(purchaseSQL.findById, [id]);
      if (!row) throw new Error('Rascunho alterado não foi encontrado.');
      return mapPurchase(row);
    },

    async completeDraft(id, purchasedAt, updatedAt): Promise<Purchase> {
      const result = await db.runAsync(purchaseSQL.completeDraft, [purchasedAt, updatedAt, id]);
      if (result.changes !== 1) {
        throw new Error('Rascunho inexistente ou sem itens para finalização.');
      }

      const row = await db.getFirstAsync<PurchaseRow>(purchaseSQL.findById, [id]);
      if (!row) throw new Error('Compra concluída não foi encontrada.');
      return mapPurchase(row);
    },

    async softDeleteDraft(id, deletedAt): Promise<void> {
      const result = await db.runAsync(purchaseSQL.softDeleteDraft, [deletedAt, deletedAt, id]);
      if (result.changes !== 1) throw new Error('Rascunho não encontrado para descarte.');
    },

    async updateCompleted(id, marketId, purchasedAt, updatedAt): Promise<Purchase> {
      const result = await db.runAsync(purchaseSQL.updateCompleted, [
        marketId,
        purchasedAt,
        updatedAt,
        id,
      ]);
      if (result.changes !== 1) throw new Error('Compra concluída não encontrada para edição.');

      const row = await db.getFirstAsync<PurchaseRow>(purchaseSQL.findById, [id]);
      if (!row) throw new Error('Compra concluída alterada não foi encontrada.');
      return mapPurchase(row);
    },

    async deleteCompleted(id): Promise<void> {
      const result = await db.runAsync(purchaseSQL.deleteCompleted, [id]);
      if (result.changes !== 1) throw new Error('Compra concluída não encontrada para exclusão.');
    },
  };
}

const purchaseColumns = `
  id, market_id, status, purchased_at, created_at, updated_at, deleted_at
`;

const purchaseSQL = {
  findActiveDraft: `
    SELECT ${purchaseColumns}
    FROM purchases
    WHERE status = 'DRAFT' AND deleted_at IS NULL
    LIMIT 1;
  `,
  findById: `
    SELECT ${purchaseColumns}
    FROM purchases
    WHERE id = ?
    LIMIT 1;
  `,
  listCompleted: `
    SELECT p.id, p.market_id, p.status, p.purchased_at,
           p.created_at, p.updated_at, p.deleted_at,
           m.name AS market_name,
           COUNT(pi.id) AS item_count,
           COALESCE(SUM(pi.total_price_cents), 0) AS total_price_cents
    FROM purchases p
    INNER JOIN markets m ON m.id = p.market_id
    LEFT JOIN purchase_items pi
      ON pi.purchase_id = p.id AND pi.deleted_at IS NULL
    WHERE p.status = 'COMPLETED' AND p.deleted_at IS NULL
    GROUP BY p.id, m.name
    ORDER BY p.purchased_at DESC, p.created_at DESC, p.id DESC;
  `,
  createDraft: `
    INSERT INTO purchases (
      id, market_id, status, purchased_at, created_at, updated_at, deleted_at
    ) VALUES (
      $id, $marketId, 'DRAFT', NULL, $createdAt, $updatedAt, NULL
    );
  `,
  updateDraftMarket: `
    UPDATE purchases
    SET market_id = ?, updated_at = ?
    WHERE id = ? AND status = 'DRAFT' AND deleted_at IS NULL;
  `,
  completeDraft: `
    UPDATE purchases
    SET status = 'COMPLETED', purchased_at = ?, updated_at = ?
    WHERE id = ?
      AND status = 'DRAFT'
      AND deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM purchase_items
        WHERE purchase_id = purchases.id AND deleted_at IS NULL
      );
  `,
  softDeleteDraft: `
    UPDATE purchases
    SET deleted_at = ?, updated_at = ?
    WHERE id = ? AND status = 'DRAFT' AND deleted_at IS NULL;
  `,
  updateCompleted: `
    UPDATE purchases
    SET market_id = ?, purchased_at = ?, updated_at = ?
    WHERE id = ? AND status = 'COMPLETED' AND deleted_at IS NULL;
  `,
  deleteCompleted: `
    DELETE FROM purchases
    WHERE id = ? AND status = 'COMPLETED';
  `,
};
