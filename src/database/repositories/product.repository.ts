import type { Product } from '@/domain/models/Product';
import type {
  ProductIdentity,
  ProductListItem,
  ProductRepository,
  SaveProductRecord,
  UpdateProductRecord,
} from '@/domain/repositories/product.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  category_id: string | null;
  category_name?: string | null;
  commercialization_type: Product['commercializationType'];
  package_quantity_milli: number | null;
  package_unit: Product['packageUnit'];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    commercializationType: row.commercialization_type,
    packageQuantityMilli: row.package_quantity_milli,
    packageUnit: row.package_unit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createProductRepository(db: SQLiteDatabase): ProductRepository {
  return {
    async listActive(): Promise<ProductListItem[]> {
      const rows = await db.getAllAsync<ProductRow>(productSQL.listActive);
      return rows.map((row) => ({ ...mapProduct(row), categoryName: row.category_name ?? null }));
    },

    async findByIdentity(identity: ProductIdentity, excludeId?: string): Promise<Product | null> {
      const row = await db.getFirstAsync<ProductRow>(productSQL.findByIdentity, {
        $name: identity.name,
        $brand: identity.brand,
        $commercializationType: identity.commercializationType,
        $packageQuantityMilli: identity.packageQuantityMilli,
        $packageUnit: identity.packageUnit,
        $excludeId: excludeId ?? null,
      });
      return row ? mapProduct(row) : null;
    },

    async create(input: SaveProductRecord): Promise<Product> {
      await db.runAsync(productSQL.create, toSaveParams(input));
      return { ...input, deletedAt: null };
    },

    async update(input: UpdateProductRecord): Promise<Product> {
      const current = await db.getFirstAsync<ProductRow>(productSQL.findById, [input.id]);
      if (!current) throw new Error('Produto não encontrado.');
      await db.runAsync(productSQL.update, toUpdateParams(input));
      return {
        ...mapProduct(current),
        ...input,
        deletedAt: null,
      };
    },

    async softDelete(id, deletedAt): Promise<void> {
      const result = await db.runAsync(productSQL.softDelete, [deletedAt, deletedAt, id]);
      if (result.changes !== 1) throw new Error('Produto não encontrado para exclusão.');
    },

    async restore(id, restoredAt): Promise<Product> {
      const result = await db.runAsync(productSQL.restore, [restoredAt, id]);
      if (result.changes !== 1) throw new Error('Produto não encontrado para restauração.');
      const row = await db.getFirstAsync<ProductRow>(productSQL.findById, [id]);
      if (!row) throw new Error('Produto restaurado não foi encontrado.');
      return mapProduct(row);
    },
  };
}

function toSaveParams(input: SaveProductRecord) {
  return {
    $id: input.id,
    $name: input.name,
    $brand: input.brand,
    $categoryId: input.categoryId,
    $commercializationType: input.commercializationType,
    $packageQuantityMilli: input.packageQuantityMilli,
    $packageUnit: input.packageUnit,
    $createdAt: input.createdAt,
    $updatedAt: input.updatedAt,
  };
}

function toUpdateParams(input: UpdateProductRecord) {
  return {
    $id: input.id,
    $name: input.name,
    $brand: input.brand,
    $categoryId: input.categoryId,
    $commercializationType: input.commercializationType,
    $packageQuantityMilli: input.packageQuantityMilli,
    $packageUnit: input.packageUnit,
    $updatedAt: input.updatedAt,
  };
}

const productSQL = {
  listActive: `
    SELECT p.id, p.name, p.brand, p.category_id, c.name AS category_name,
           p.commercialization_type, p.package_quantity_milli, p.package_unit,
           p.created_at, p.updated_at, p.deleted_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id AND c.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
    ORDER BY p.name COLLATE NOCASE ASC;
  `,
  findByIdentity: `
    SELECT id, name, brand, category_id, commercialization_type,
           package_quantity_milli, package_unit,
           created_at, updated_at, deleted_at
    FROM products
    WHERE name = $name COLLATE NOCASE
      AND COALESCE(brand, '') = COALESCE($brand, '') COLLATE NOCASE
      AND commercialization_type = $commercializationType
      AND COALESCE(package_quantity_milli, -1) = COALESCE($packageQuantityMilli, -1)
      AND COALESCE(package_unit, '') = COALESCE($packageUnit, '')
      AND ($excludeId IS NULL OR id <> $excludeId)
    LIMIT 1;
  `,
  findById: `
    SELECT id, name, brand, category_id, commercialization_type,
           package_quantity_milli, package_unit,
           created_at, updated_at, deleted_at
    FROM products WHERE id = ? LIMIT 1;
  `,
  create: `
    INSERT INTO products (
      id, name, brand, category_id, commercialization_type,
      package_quantity_milli, package_unit,
      created_at, updated_at, deleted_at
    ) VALUES (
      $id, $name, $brand, $categoryId, $commercializationType,
      $packageQuantityMilli, $packageUnit,
      $createdAt, $updatedAt, NULL
    );
  `,
  update: `
    UPDATE products
    SET name = $name,
        brand = $brand,
        category_id = $categoryId,
        commercialization_type = $commercializationType,
        package_quantity_milli = $packageQuantityMilli,
        package_unit = $packageUnit,
        updated_at = $updatedAt
    WHERE id = $id AND deleted_at IS NULL;
  `,
  softDelete: `
    UPDATE products
    SET deleted_at = ?, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL;
  `,
  restore: `
    UPDATE products
    SET deleted_at = NULL, updated_at = ?
    WHERE id = ? AND deleted_at IS NOT NULL;
  `,
};
