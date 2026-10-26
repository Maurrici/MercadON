export type DashboardMetrics = {
  completedPurchases: number;
  products: number;
  markets: number;
};

export type DashboardRepository = {
  getMetrics(): Promise<DashboardMetrics>;
};
