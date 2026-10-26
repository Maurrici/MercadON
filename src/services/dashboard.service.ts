import type {
  DashboardMetrics,
  DashboardRepository,
} from '@/domain/repositories/dashboard.repository';

export type DashboardService = {
  getMetrics(): Promise<DashboardMetrics>;
};

export function createDashboardService(repository: DashboardRepository): DashboardService {
  return {
    getMetrics: () => repository.getMetrics(),
  };
}
