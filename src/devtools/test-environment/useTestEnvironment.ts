import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';
import { createTestEnvironmentService } from './service';

export function useTestEnvironment() {
  const database = useSQLiteContext();
  return useMemo(() => createTestEnvironmentService(database), [database]);
}
