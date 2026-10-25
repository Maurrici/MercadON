import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ProductCommercializationType } from '@/domain/enums/ProductCommercializationType';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type {
  HistoricalPurchaseItem,
  PurchaseItemRepository,
  SavePurchaseItemRecord,
  UpdatePurchaseItemRecord,
} from '@/domain/repositories/purchase-item.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

type PurchaseItemRow = {
  id: string;
  purchase_id: string;
  product_id: string;
  commercialization_type: ProductCommercializationType;
  quantity_milli: number;
  quantity_unit: MeasurementUnit;
  unit_price_cents: number | null;
  total_price_cents: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  purchased_at?: string;
};

function mapPurchaseItem(row: PurchaseItemRow): PurchaseItem {
  const base = {
    id: row.id,
    purchaseId: row.purchase_id,
    productId: row.product_id,
    quantityMilli: row.quantity_milli,
    totalPriceCents: row.total_price_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };

  if (row.commercialization_type === 'FIXED') {
    if (row.quantity_unit !== 'UNIT' || row.unit_price_cents === null) {
      throw new Error('Item fixo persistido com dados inválidos.');
    }

    return {
      ...base,
      commercializationType: 'FIXED',
      quantityUnit: 'UNIT',
      unitPriceCents: row.unit_price_cents,
    };
  }

  if (row.unit_price_cents !== null) {
    throw new Error('Item variável persistido com preço unitário.');
  }

  return {
    ...base,
    commercializationType: 'VARIABLE',
    quantityUnit: row.quantity_unit,
    unitPriceCents: null,
  };
}

export function createPurchaseItemRepository(db: SQLiteDatabase): PurchaseItemRepository {
  return {
    async listActiveByPurchaseId(purchaseId): Promise<PurchaseItem[]> {
      const rows = await db.getAllAsync<PurchaseItemRow>(purchaseItemSQL.listActiveByPurchaseId, [
        purchaseId,
      ]);
      return rows.map(mapPurchaseItem);
    },

    async findById(id): Promise<PurchaseItem | null> {
      const row = await db.getFirstAsync<PurchaseItemRow>(purchaseItemSQL.findById, [id]);
      return row ? mapPurchaseItem(row) : null;
    },

    async findActiveByProduct(purchaseId, productId): Promise<PurchaseItem | null> {
      const row = await db.getFirstAsync<PurchaseItemRow>(purchaseItemSQL.findActiveByProduct, [
        purchaseId,
        productId,
      ]);
      return row ? mapPurchaseItem(row) : null;
    },

    async findLatestCompletedByProduct(
      productId,
      excludePurchaseId,
    ): Promise<HistoricalPurchaseItem | null> {
      const row = await db.getFirstAsync<PurchaseItemRow>(
        purchaseItemSQL.findLatestCompletedByProduct,
        {
          $productId: productId,
          $excludePurchaseId: excludePurchaseId ?? null,
        },
      );

      if (!row) return null;
      if (!row.purchased_at) throw new Error('Item histórico sem data de compra.');
      return { ...mapPurchaseItem(row), purchasedAt: row.purchased_at };
    },

    async countActiveByPurchaseId(purchaseId): Promise<number> {
      const row = await db.getFirstAsync<{ count: number }>(
        purchaseItemSQL.countActiveByPurchaseId,
        [purchaseId],
      );
      return row?.count ?? 0;
    },

    async sumActiveTotalByPurchaseId(purchaseId): Promise<number> {
      const row = await db.getFirstAsync<{ total: number }>(
        purchaseItemSQL.sumActiveTotalByPurchaseId,
        [purchaseId],
      );
      return row?.total ?? 0;
    },

    async create(input: SavePurchaseItemRecord): Promise<PurchaseItem> {
      await db.runAsync(purchaseItemSQL.create, toSaveParams(input));
      return { ...input, deletedAt: null };
    },

    async update(input: UpdatePurchaseItemRecord): Promise<PurchaseItem> {
      const result = await db.runAsync(purchaseItemSQL.update, toUpdateParams(input));
      if (result.changes !== 1) throw new Error('Item não encontrado para edição.');

      const row = await db.getFirstAsync<PurchaseItemRow>(purchaseItemSQL.findById, [input.id]);
      if (!row) throw new Error('Item alterado não foi encontrado.');
      return mapPurchaseItem(row);
    },

    async softDelete(id, deletedAt): Promise<void> {
      const result = await db.runAsync(purchaseItemSQL.softDelete, [deletedAt, deletedAt, id]);
      if (result.changes !== 1) throw new Error('Item não encontrado para remoção.');
    },

    async softDeleteActiveByPurchaseId(purchaseId, deletedAt): Promise<number> {
      const result = await db.runAsync(purchaseItemSQL.softDeleteActiveByPurchaseId, [
        deletedAt,
        deletedAt,
        purchaseId,
      ]);
      return result.changes;
    },

    async hardDeleteByPurchaseId(purchaseId): Promise<number> {
      const result = await db.runAsync(purchaseItemSQL.hardDeleteByPurchaseId, [purchaseId]);
      return result.changes;
    },
  };
}

function toSaveParams(input: SavePurchaseItemRecord) {
  return {
    $id: input.id,
    $purchaseId: input.purchaseId,
    $productId: input.productId,
    $commercializationType: input.commercializationType,
    $quantityMilli: input.quantityMilli,
    $quantityUnit: input.quantityUnit,
    $unitPriceCents: input.unitPriceCents,
    $totalPriceCents: input.totalPriceCents,
    $createdAt: input.createdAt,
    $updatedAt: input.updatedAt,
  };
}

function toUpdateParams(input: UpdatePurchaseItemRecord) {
  return {
    $id: input.id,
    $commercializationType: input.commercializationType,
    $quantityMilli: input.quantityMilli,
    $quantityUnit: input.quantityUnit,
    $unitPriceCents: input.unitPriceCents,
    $totalPriceCents: input.totalPriceCents,
    $updatedAt: input.updatedAt,
  };
}

const purchaseItemColumns = `
  id, purchase_id, product_id, commercialization_type,
  quantity_milli, quantity_unit, unit_price_cents, total_price_cents,
  created_at, updated_at, deleted_at
`;

const purchaseItemSQL = {
  listActiveByPurchaseId: `
    SELECT ${purchaseItemColumns}
    FROM purchase_items
    WHERE purchase_id = ? AND deleted_at IS NULL
    ORDER BY created_at ASC, id ASC;
  `,
  findById: `
    SELECT ${purchaseItemColumns}
    FROM purchase_items
    WHERE id = ?
    LIMIT 1;
  `,
  findActiveByProduct: `
    SELECT ${purchaseItemColumns}
    FROM purchase_items
    WHERE purchase_id = ? AND product_id = ? AND deleted_at IS NULL
    LIMIT 1;
  `,
  findLatestCompletedByProduct: `
    SELECT pi.id, pi.purchase_id, pi.product_id, pi.commercialization_type,
           pi.quantity_milli, pi.quantity_unit, pi.unit_price_cents,
           pi.total_price_cents, pi.created_at, pi.updated_at, pi.deleted_at,
           p.purchased_at
    FROM purchase_items pi
    INNER JOIN purchases p ON p.id = pi.purchase_id
    WHERE pi.product_id = $productId
      AND pi.deleted_at IS NULL
      AND p.status = 'COMPLETED'
      AND p.deleted_at IS NULL
      AND ($excludePurchaseId IS NULL OR p.id <> $excludePurchaseId)
    ORDER BY p.purchased_at DESC, pi.created_at DESC, pi.id DESC
    LIMIT 1;
  `,
  countActiveByPurchaseId: `
    SELECT COUNT(*) AS count
    FROM purchase_items
    WHERE purchase_id = ? AND deleted_at IS NULL;
  `,
  sumActiveTotalByPurchaseId: `
    SELECT COALESCE(SUM(total_price_cents), 0) AS total
    FROM purchase_items
    WHERE purchase_id = ? AND deleted_at IS NULL;
  `,
  create: `
    INSERT INTO purchase_items (
      id, purchase_id, product_id, commercialization_type,
      quantity_milli, quantity_unit, unit_price_cents, total_price_cents,
      created_at, updated_at, deleted_at
    ) VALUES (
      $id, $purchaseId, $productId, $commercializationType,
      $quantityMilli, $quantityUnit, $unitPriceCents, $totalPriceCents,
      $createdAt, $updatedAt, NULL
    );
  `,
  update: `
    UPDATE purchase_items
    SET commercialization_type = $commercializationType,
        quantity_milli = $quantityMilli,
        quantity_unit = $quantityUnit,
        unit_price_cents = $unitPriceCents,
        total_price_cents = $totalPriceCents,
        updated_at = $updatedAt
    WHERE id = $id AND deleted_at IS NULL;
  `,
  softDelete: `
    UPDATE purchase_items
    SET deleted_at = ?, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL;
  `,
  softDeleteActiveByPurchaseId: `
    UPDATE purchase_items
    SET deleted_at = ?, updated_at = ?
    WHERE purchase_id = ? AND deleted_at IS NULL;
  `,
  hardDeleteByPurchaseId: `
    DELETE FROM purchase_items
    WHERE purchase_id = ?;
  `,
};
