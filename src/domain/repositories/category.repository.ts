import type { Category } from '@/domain/models/Category';

export type CategoryRepository = {
  listActive(): Promise<Category[]>;
};
