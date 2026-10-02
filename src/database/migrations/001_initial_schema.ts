import type { SQLiteDatabase } from 'expo-sqlite';

// Precisamos somente executar SQL; o objeto "txn" do Expo
// oferece esse método, sem exigir o restante da interface do banco.
type MigrationConnection = Pick<SQLiteDatabase, 'execAsync'>;

export async function createInitialSchema(
  db: MigrationConnection
): Promise<void> {
  await db.execAsync(`
    CREATE TABLE categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL,

      CHECK (length(trim(name)) > 0),
      CHECK (name = trim(name)),
      CHECK (created_at <> ''),
      CHECK (updated_at <> '')
    );

    CREATE TABLE markets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL,

      CHECK (length(trim(name)) > 0),
      CHECK (name = trim(name)),
      CHECK (created_at <> ''),
      CHECK (updated_at <> '')
    );

    CREATE TABLE products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      brand TEXT DEFAULT NULL,
      category_id TEXT DEFAULT NULL,
      package_quantity_milli INTEGER DEFAULT NULL,
      package_unit TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL,

      FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL,

      CHECK (length(trim(name)) > 0),
      CHECK (name = trim(name)),
      CHECK (created_at <> ''),
      CHECK (updated_at <> ''),
      CHECK (
        (package_quantity_milli IS NULL AND package_unit IS NULL)
        OR
        (package_quantity_milli IS NOT NULL AND package_unit IS NOT NULL)
      ),
      CHECK (
        package_quantity_milli IS NULL
        OR (
          typeof(package_quantity_milli) = 'integer'
          AND package_quantity_milli > 0
        )
      ),
      CHECK (
        package_unit IS NULL
        OR package_unit IN ('UNIT', 'G', 'KG', 'ML', 'L')
      ),
      CHECK (
        package_unit IS NULL
        OR package_unit <> 'UNIT'
        OR package_quantity_milli % 1000 = 0
      )
    );

    CREATE TABLE purchases (
      id TEXT PRIMARY KEY NOT NULL,
      market_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      purchased_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL,

      FOREIGN KEY (market_id)
        REFERENCES markets(id)
        ON DELETE RESTRICT,

      CHECK (status IN ('DRAFT', 'COMPLETED')),
      CHECK (
        (status = 'DRAFT' AND purchased_at IS NULL)
        OR
        (
          status = 'COMPLETED'
          AND purchased_at IS NOT NULL
          AND length(trim(purchased_at)) > 0
        )
      ),
      CHECK (created_at <> ''),
      CHECK (updated_at <> '')
    );

    CREATE TABLE purchase_items (
      id TEXT PRIMARY KEY NOT NULL,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity_milli INTEGER NOT NULL,
      quantity_unit TEXT NOT NULL,
      unit_price_cents INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL,

      FOREIGN KEY (purchase_id)
        REFERENCES purchases(id)
        ON DELETE RESTRICT,

      FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

      CHECK (
        typeof(quantity_milli) = 'integer'
        AND quantity_milli > 0
      ),
      CHECK (quantity_unit IN ('UNIT', 'G', 'KG', 'ML', 'L')),
      CHECK (
        quantity_unit <> 'UNIT'
        OR quantity_milli % 1000 = 0
      ),
      CHECK (
        unit_price_cents IS NULL
        OR (
          typeof(unit_price_cents) = 'integer'
          AND unit_price_cents >= 0
        )
      ),
      CHECK (created_at <> ''),
      CHECK (updated_at <> '')
    );

    CREATE TRIGGER categories_soft_delete_unassign_products
    AFTER UPDATE OF deleted_at ON categories
    WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL
    BEGIN
      UPDATE products
         SET category_id = NULL,
             updated_at = NEW.deleted_at
       WHERE category_id = NEW.id;
    END;
  `);
}