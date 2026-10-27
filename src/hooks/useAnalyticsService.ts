import { createAnalyticsRepository } from '@/database/repositories/analytics.repository';
import { createAnalyticsService } from '@/services/analytics.service';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

export function useAnalyticsService() {
  const db = useSQLiteContext();

  return useMemo(() => createAnalyticsService(createAnalyticsRepository(db)), [db]);
}
