import type { ProductFormInput } from '@/domain/repositories/product.repository';

export function makeProductInput(overrides: Partial<ProductFormInput> = {}): ProductFormInput {
  return {
    name: 'Arroz',
    brand: 'Marca A',
    packageQuantity: '1',
    packageUnit: 'KG',
    categoryId: 'category-food',
    ...overrides,
  };
}
