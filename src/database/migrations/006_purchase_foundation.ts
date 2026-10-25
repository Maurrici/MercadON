import type { SQLiteDatabase } from 'expo-sqlite';

type MigrationConnection = Pick<SQLiteDatabase, 'execAsync'>;

export async function createPurchaseFoundation(db: MigrationConnection): Promise<void> {
  await db.execAsync(`
    CREATE TABLE purchase_items_new (
      id TEXT PRIMARY KEY NOT NULL,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      commercialization_type TEXT NOT NULL,
      quantity_milli INTEGER NOT NULL,
      quantity_unit TEXT NOT NULL,
      unit_price_cents INTEGER DEFAULT NULL,
      total_price_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL,

      FOREIGN KEY (purchase_id)
        REFERENCES purchases(id)
        ON DELETE RESTRICT,

      FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

      CHECK (commercialization_type IN ('FIXED', 'VARIABLE')),
      CHECK (
        typeof(quantity_milli) = 'integer'
        AND quantity_milli > 0
      ),
      CHECK (quantity_unit IN ('UNIT', 'G', 'KG', 'ML', 'L')),
      CHECK (
        unit_price_cents IS NULL
        OR (
          typeof(unit_price_cents) = 'integer'
          AND unit_price_cents >= 0
        )
      ),
      CHECK (
        typeof(total_price_cents) = 'integer'
        AND total_price_cents >= 0
      ),
      CHECK (
        (
          commercialization_type = 'FIXED'
          AND quantity_unit = 'UNIT'
          AND quantity_milli % 1000 = 0
          AND unit_price_cents IS NOT NULL
          AND total_price_cents = (quantity_milli / 1000) * unit_price_cents
        )
        OR
        (
          commercialization_type = 'VARIABLE'
          AND unit_price_cents IS NULL
        )
      ),
      CHECK (created_at <> ''),
      CHECK (updated_at <> '')
    );

    INSERT INTO purchase_items_new (
      id,
      purchase_id,
      product_id,
      commercialization_type,
      quantity_milli,
      quantity_unit,
      unit_price_cents,
      total_price_cents,
      created_at,
      updated_at,
      deleted_at
    )
    SELECT
      id,
      purchase_id,
      product_id,
      CASE WHEN quantity_unit = 'UNIT' THEN 'FIXED' ELSE 'VARIABLE' END,
      quantity_milli,
      quantity_unit,
      CASE WHEN quantity_unit = 'UNIT' THEN COALESCE(unit_price_cents, 0) ELSE NULL END,
      CASE
        WHEN quantity_unit = 'UNIT'
          THEN (quantity_milli / 1000) * COALESCE(unit_price_cents, 0)
        ELSE CAST((COALESCE(unit_price_cents, 0) * quantity_milli + 500) / 1000 AS INTEGER)
      END,
      created_at,
      updated_at,
      deleted_at
    FROM purchase_items;

    DROP TABLE purchase_items;

    ALTER TABLE purchase_items_new
      RENAME TO purchase_items;

    CREATE UNIQUE INDEX purchases_single_active_draft
    ON purchases ((1))
    WHERE status = 'DRAFT' AND deleted_at IS NULL;

    CREATE INDEX purchases_completed_history
    ON purchases (purchased_at DESC, created_at DESC, id DESC)
    WHERE status = 'COMPLETED' AND deleted_at IS NULL;

    CREATE UNIQUE INDEX purchase_items_unique_active_product
    ON purchase_items (purchase_id, product_id)
    WHERE deleted_at IS NULL;

    CREATE INDEX purchase_items_active_by_purchase
    ON purchase_items (purchase_id, created_at ASC, id ASC)
    WHERE deleted_at IS NULL;
  `);
}
