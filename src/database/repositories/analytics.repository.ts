import { isISODate } from '@/domain/date';
import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ProductCommercializationType } from '@/domain/enums/ProductCommercializationType';
import type {
  AnalyticsRepository,
  AnalyticsProductRecord,
  CategorySpendingRecord,
  PriceOccurrenceRecord,
  ProductSpendingRecord,
  SpendingSummaryRecord,
} from '@/domain/repositories/analytics.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

type SpendingSummaryRow = {
  total_price_cents: number;
  completed_purchase_count: number;
};

type CategorySpendingRow = {
  category_id: string | null;
  category_name: string | null;
  total_price_cents: number;
};

type ProductSpendingRow = {
  product_id: string;
  product_name: string;
  product_brand: string | null;
  total_price_cents: number;
  purchase_count: number;
};

type PriceOccurrenceRow = {
  item_id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  product_brand: string | null;
  current_commercialization_type: ProductCommercializationType;
  current_measurement_unit: MeasurementUnit | null;
  market_id: string;
  market_name: string;
  purchased_at: string;
  item_created_at: string;
  commercialization_type: ProductCommercializationType;
  quantity_milli: number;
  quantity_unit: MeasurementUnit;
  unit_price_cents: number | null;
  total_price_cents: number;
};

type AnalyticsProductRow = {
  product_id: string;
  product_name: string;
  product_brand: string | null;
  current_commercialization_type: ProductCommercializationType;
  current_measurement_unit: MeasurementUnit | null;
};

export function createAnalyticsRepository(db: SQLiteDatabase): AnalyticsRepository {
  return {
    async getSpendingSummary(range): Promise<SpendingSummaryRecord> {
      const row = await db.getFirstAsync<SpendingSummaryRow>(analyticsSQL.getSpendingSummary, {
        $startDate: range.startDate,
        $endExclusive: range.endExclusive,
      });
      if (!row) throw new Error('Não foi possível calcular o total do período.');

      return {
        totalPriceCents: requireSafeMoney(row.total_price_cents),
        completedPurchaseCount: requireSafeCount(row.completed_purchase_count),
      };
    },

    async listCategorySpending(range): Promise<CategorySpendingRecord[]> {
      const rows = await db.getAllAsync<CategorySpendingRow>(analyticsSQL.listCategorySpending, {
        $startDate: range.startDate,
        $endExclusive: range.endExclusive,
      });
      return rows.map((row) => ({
        categoryId: row.category_id,
        categoryName: row.category_name,
        totalPriceCents: requireSafeMoney(row.total_price_cents),
      }));
    },

    async listProductSpending(range): Promise<ProductSpendingRecord[]> {
      const rows = await db.getAllAsync<ProductSpendingRow>(analyticsSQL.listProductSpending, {
        $startDate: range.startDate,
        $endExclusive: range.endExclusive,
      });
      return rows.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        productBrand: row.product_brand,
        totalPriceCents: requireSafeMoney(row.total_price_cents),
        purchaseCount: requireSafeCount(row.purchase_count),
      }));
    },

    async findProduct(productId): Promise<AnalyticsProductRecord | null> {
      const row = await db.getFirstAsync<AnalyticsProductRow>(analyticsSQL.findProduct, [
        productId,
      ]);
      return row
        ? {
            productId: row.product_id,
            productName: row.product_name,
            productBrand: row.product_brand,
            currentCommercializationType: row.current_commercialization_type,
            currentMeasurementUnit: row.current_measurement_unit,
          }
        : null;
    },

    async listPriceOccurrences(productId): Promise<PriceOccurrenceRecord[]> {
      const rows = await db.getAllAsync<PriceOccurrenceRow>(analyticsSQL.listPriceOccurrences, {
        $productId: productId ?? null,
      });
      return rows.map(mapPriceOccurrence);
    },
  };
}

function mapPriceOccurrence(row: PriceOccurrenceRow): PriceOccurrenceRecord {
  if (!isISODate(row.purchased_at)) throw new Error('Ocorrência com data de compra inválida.');
  requirePositiveSafeInteger(row.quantity_milli, 'quantidade');
  requireSafeMoney(row.total_price_cents);

  if (row.commercialization_type === 'FIXED') {
    if (row.quantity_unit !== 'UNIT' || row.unit_price_cents === null) {
      throw new Error('Ocorrência fixa com preço inválido.');
    }
    requireSafeMoney(row.unit_price_cents);
  } else if (row.unit_price_cents !== null) {
    throw new Error('Ocorrência variável com preço unitário persistido.');
  }

  return {
    itemId: row.item_id,
    purchaseId: row.purchase_id,
    productId: row.product_id,
    productName: row.product_name,
    productBrand: row.product_brand,
    currentCommercializationType: row.current_commercialization_type,
    currentMeasurementUnit: row.current_measurement_unit,
    marketId: row.market_id,
    marketName: row.market_name,
    purchasedAt: row.purchased_at,
    itemCreatedAt: row.item_created_at,
    commercializationType: row.commercialization_type,
    quantityMilli: row.quantity_milli,
    quantityUnit: row.quantity_unit,
    unitPriceCents: row.unit_price_cents,
    totalPriceCents: row.total_price_cents,
  };
}

function requireSafeMoney(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Valor financeiro analítico inválido.');
  }
  return value;
}

function requireSafeCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Contagem analítica inválida.');
  }
  return value;
}

function requirePositiveSafeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} analítica inválida.`);
  }
  return value;
}

const activeCompletedPeriodFilter = `
  p.status = 'COMPLETED'
  AND p.deleted_at IS NULL
  AND pi.deleted_at IS NULL
  AND p.purchased_at >= $startDate
  AND p.purchased_at < $endExclusive
`;

const analyticsSQL = {
  getSpendingSummary: `
    SELECT COALESCE(SUM(pi.total_price_cents), 0) AS total_price_cents,
           COUNT(DISTINCT p.id) AS completed_purchase_count
    FROM purchases p
    INNER JOIN purchase_items pi ON pi.purchase_id = p.id
    WHERE ${activeCompletedPeriodFilter};
  `,
  listCategorySpending: `
    SELECT pr.category_id,
           c.name AS category_name,
           SUM(pi.total_price_cents) AS total_price_cents
    FROM purchases p
    INNER JOIN purchase_items pi ON pi.purchase_id = p.id
    INNER JOIN products pr ON pr.id = pi.product_id
    LEFT JOIN categories c ON c.id = pr.category_id
    WHERE ${activeCompletedPeriodFilter}
    GROUP BY pr.category_id, c.name
    ORDER BY total_price_cents DESC,
             COALESCE(c.name, 'Sem categoria') COLLATE NOCASE ASC,
             COALESCE(pr.category_id, '') ASC;
  `,
  listProductSpending: `
    SELECT pr.id AS product_id,
           pr.name AS product_name,
           pr.brand AS product_brand,
           SUM(pi.total_price_cents) AS total_price_cents,
           COUNT(DISTINCT p.id) AS purchase_count
    FROM purchases p
    INNER JOIN purchase_items pi ON pi.purchase_id = p.id
    INNER JOIN products pr ON pr.id = pi.product_id
    WHERE ${activeCompletedPeriodFilter}
    GROUP BY pr.id, pr.name, pr.brand
    ORDER BY total_price_cents DESC,
             pr.name COLLATE NOCASE ASC,
             pr.id ASC;
  `,
  listPriceOccurrences: `
    SELECT pi.id AS item_id,
           pi.purchase_id,
           pi.product_id,
           pr.name AS product_name,
           pr.brand AS product_brand,
           pr.commercialization_type AS current_commercialization_type,
           pr.package_unit AS current_measurement_unit,
           p.market_id,
           m.name AS market_name,
           p.purchased_at,
           pi.created_at AS item_created_at,
           pi.commercialization_type,
           pi.quantity_milli,
           pi.quantity_unit,
           pi.unit_price_cents,
           pi.total_price_cents
    FROM purchase_items pi
    INNER JOIN purchases p ON p.id = pi.purchase_id
    INNER JOIN products pr ON pr.id = pi.product_id
    INNER JOIN markets m ON m.id = p.market_id
    WHERE p.status = 'COMPLETED'
      AND p.deleted_at IS NULL
      AND pi.deleted_at IS NULL
      AND ($productId IS NULL OR pi.product_id = $productId)
    ORDER BY pi.product_id ASC,
             p.purchased_at ASC,
             pi.created_at ASC,
             pi.id ASC;
  `,
  findProduct: `
    SELECT id AS product_id,
           name AS product_name,
           brand AS product_brand,
           commercialization_type AS current_commercialization_type,
           package_unit AS current_measurement_unit
    FROM products
    WHERE id = ?
    LIMIT 1;
  `,
};
