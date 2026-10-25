import type { ProductListItem } from '@/domain/repositories/product.repository';
import { filterProducts } from '@/features/products/presentation';
import { describe, expect, it } from '@jest/globals';

const PRODUCTS: ProductListItem[] = [
  makeProduct('coffee', 'Café', 'Marca A', 'pantry', 'Mercearia e despensa'),
  makeProduct('rice', 'Arroz', 'Marca B', 'pantry', 'Mercearia e despensa'),
  makeProduct('milk', 'Leite', null, 'dairy', 'Frios, laticínios e ovos'),
  makeProduct('soap', 'Sabonete', 'Marca A', 'hygiene', 'Higiene e cuidados pessoais'),
  makeProduct('misc', 'Sacola', null, null, null),
];

describe('filtros de produtos', () => {
  it('mantém todos os produtos sem busca ou categoria', () => {
    expect(filterProducts(PRODUCTS, '', [])).toHaveLength(PRODUCTS.length);
  });

  it('combina busca textual com uma categoria', () => {
    expect(filterProducts(PRODUCTS, 'marca a', ['pantry']).map(({ id }) => id)).toEqual(['coffee']);
  });

  it('combina múltiplas categorias com semântica OU', () => {
    expect(filterProducts(PRODUCTS, '', ['dairy', 'hygiene']).map(({ id }) => id)).toEqual([
      'milk',
      'soap',
    ]);
  });

  it('não inclui produto sem categoria quando há filtro ativo', () => {
    expect(filterProducts(PRODUCTS, 'sacola', ['pantry'])).toEqual([]);
  });
});

function makeProduct(
  id: string,
  name: string,
  brand: string | null,
  categoryId: string | null,
  categoryName: string | null,
): ProductListItem {
  return {
    id,
    name,
    brand,
    categoryId,
    categoryName,
    commercializationType: 'FIXED',
    packageQuantityMilli: null,
    packageUnit: null,
    createdAt: '2026-10-24T12:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
    deletedAt: null,
  };
}
