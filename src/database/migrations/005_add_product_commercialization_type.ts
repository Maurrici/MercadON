import type { SQLiteDatabase } from 'expo-sqlite';

type MigrationConnection = Pick<SQLiteDatabase, 'execAsync'>;

export async function addProductCommercializationType(db: MigrationConnection): Promise<void> {
  await db.execAsync(`
    DROP TRIGGER IF EXISTS categories_soft_delete_unassign_products;

    CREATE TABLE products_new (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      brand TEXT DEFAULT NULL,
      category_id TEXT DEFAULT NULL,
      commercialization_type TEXT NOT NULL,
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

      CHECK (
        brand IS NULL
        OR (
          length(trim(brand)) > 0
          AND brand = trim(brand)
        )
      ),

      CHECK (commercialization_type IN ('FIXED', 'VARIABLE')),
      CHECK (created_at <> ''),
      CHECK (updated_at <> ''),

      CHECK (
        (
          commercialization_type = 'FIXED'
          AND (
            (package_quantity_milli IS NULL AND package_unit IS NULL)
            OR
            (package_quantity_milli IS NOT NULL AND package_unit IS NOT NULL)
          )
        )
        OR
        (
          commercialization_type = 'VARIABLE'
          AND package_quantity_milli IS NULL
          AND package_unit IS NOT NULL
        )
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
        package_quantity_milli IS NULL
        OR package_unit <> 'UNIT'
        OR package_quantity_milli % 1000 = 0
      )
    );

    INSERT INTO products_new (
      id,
      name,
      brand,
      category_id,
      commercialization_type,
      package_quantity_milli,
      package_unit,
      created_at,
      updated_at,
      deleted_at
    )
    SELECT
      id,
      name,
      brand,
      category_id,
      'FIXED',
      package_quantity_milli,
      package_unit,
      created_at,
      updated_at,
      deleted_at
    FROM products;

    DROP TABLE products;

    ALTER TABLE products_new
      RENAME TO products;

    CREATE TRIGGER categories_soft_delete_unassign_products
    AFTER UPDATE OF deleted_at ON categories
    WHEN OLD.deleted_at IS NULL
      AND NEW.deleted_at IS NOT NULL
    BEGIN
      UPDATE products
         SET category_id = NULL,
             updated_at = NEW.deleted_at
       WHERE category_id = NEW.id;
    END;

    CREATE UNIQUE INDEX products_unique_identity
    ON products (
      name COLLATE NOCASE,
      COALESCE(brand, '') COLLATE NOCASE,
      commercialization_type,
      COALESCE(package_quantity_milli, -1),
      COALESCE(package_unit, '')
    );
  `);
}
