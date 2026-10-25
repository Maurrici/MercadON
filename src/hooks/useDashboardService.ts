import { createDashboardRepository } from '@/database/repositories/dashboard.repository';
import { createDashboardService } from '@/services/dashboard.service';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function useDashboardService() {
  const db = useSQLiteContext();

  return useMemo(() => createDashboardService(createDashboardRepository(db)), [db]);
}
