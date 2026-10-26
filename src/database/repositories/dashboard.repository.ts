import type {
  DashboardMetrics,
  DashboardRepository,
} from '@/domain/repositories/dashboard.repository';
import type { SQLiteDatabase } from 'expo-sqlite';

type DashboardMetricsRow = {
  completed_purchase_count: number;
  product_count: number;
  market_count: number;
};

export function createDashboardRepository(db: SQLiteDatabase): DashboardRepository {
  return {
    async getMetrics(): Promise<DashboardMetrics> {
      const row = await db.getFirstAsync<DashboardMetricsRow>(dashboardSQL.getMetrics);
      if (!row) throw new Error('Não foi possível calcular o resumo do aplicativo.');

      return {
        completedPurchases: row.completed_purchase_count,
        products: row.product_count,
        markets: row.market_count,
      };
    },
  };
}

const dashboardSQL = {
  getMetrics: `
    SELECT
      (SELECT COUNT(*) FROM purchases
       WHERE status = 'COMPLETED' AND deleted_at IS NULL) AS completed_purchase_count,
      (SELECT COUNT(*) FROM products
       WHERE deleted_at IS NULL) AS product_count,
      (SELECT COUNT(*) FROM markets
       WHERE deleted_at IS NULL) AS market_count;
  `,
};
