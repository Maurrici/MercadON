import type { CategoryRepository } from '@/domain/repositories/category.repository';
import type { ProductFormInput } from '@/domain/repositories/product.repository';
import { createProductService } from '@/services/product.service';
import { describe, expect, it } from '@jest/globals';
import { InMemoryProductRepository } from '../helpers/in-memory-product.repository';
import { makeProductInput } from '../helpers/product-fixtures';

const NOW = '2026-10-21T12:00:00.000Z';
const categories: CategoryRepository = { listActive: async () => [] };
const invalidProductCases: [string, Partial<ProductFormInput>, keyof ProductFormInput][] = [
  ['nome vazio', { name: '  ' }, 'name'],
  ['quantidade sem unidade', { packageQuantity: '1', packageUnit: null }, 'packageUnit'],
  ['unidade sem quantidade', { packageQuantity: '', packageUnit: 'KG' }, 'packageQuantity'],
  ['quantidade zero', { packageQuantity: '0' }, 'packageQuantity'],
  ['quantidade negativa', { packageQuantity: '-1' }, 'packageQuantity'],
  ['unidade fracionária', { packageQuantity: '1,5', packageUnit: 'UNIT' }, 'packageQuantity'],
  [
    'quantidade de embalagem em produto variável',
    { commercializationType: 'VARIABLE', packageQuantity: '1', packageUnit: 'KG' },
    'packageQuantity',
  ],
  [
    'produto variável sem unidade',
    { commercializationType: 'VARIABLE', packageQuantity: '', packageUnit: null },
    'packageUnit',
  ],
];

function createHarness() {
  const products = new InMemoryProductRepository();
  let nextId = 1;
  const service = createProductService({
    products,
    categories,
    createId: () => `product-${nextId++}`,
    now: () => NOW,
  });
  return { products, service };
}

describe('ProductService', () => {
  it('cadastra um produto normalizando textos, quantidade e data', async () => {
    const { service } = createHarness();

    const result = await service.save(
      makeProductInput({ name: '  Arroz  ', brand: '  Marca A ', packageQuantity: '1,5' }),
    );

    expect(result).toEqual({
      status: 'saved',
      product: expect.objectContaining({
        id: 'product-1',
        name: 'Arroz',
        brand: 'Marca A',
        packageQuantityMilli: 1500,
        packageUnit: 'KG',
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null,
      }),
    });
  });

  it('barra um produto com a mesma identidade', async () => {
    const { service } = createHarness();
    await service.save(makeProductInput());

    const result = await service.save(makeProductInput());

    expect(result.status).toBe('duplicate');
    await expect(service.listProducts()).resolves.toHaveLength(1);
  });

  it('considera nome e marca sem diferenciar maiúsculas e minúsculas', async () => {
    const { service } = createHarness();
    await service.save(makeProductInput());

    const result = await service.save(makeProductInput({ name: 'ARROZ', brand: 'marca a' }));

    expect(result.status).toBe('duplicate');
  });

  it.each<[string, Partial<ProductFormInput>]>([
    ['marca', { brand: 'Marca B' }],
    ['quantidade', { packageQuantity: '2' }],
    ['unidade', { packageUnit: 'G' }],
  ])('permite o mesmo nome quando a %s é diferente', async (_, variation) => {
    const { service } = createHarness();
    await service.save(makeProductInput());

    const result = await service.save(makeProductInput(variation));

    expect(result.status).toBe('saved');
    await expect(service.listProducts()).resolves.toHaveLength(2);
  });

  it('barra a mesma identidade mesmo quando a categoria é diferente', async () => {
    const { service } = createHarness();
    await service.save(makeProductInput());

    const result = await service.save(makeProductInput({ categoryId: 'category-other' }));

    expect(result.status).toBe('duplicate');
  });

  it('oferece restauração quando a identidade pertence a um produto excluído', async () => {
    const { service } = createHarness();
    const saved = await service.save(makeProductInput());
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');
    await service.delete(saved.product.id);

    const result = await service.save(makeProductInput());

    expect(result).toEqual({
      status: 'restorable',
      product: expect.objectContaining({ id: saved.product.id, deletedAt: NOW }),
    });
  });

  it('permite salvar uma edição sem conflitar com o próprio produto', async () => {
    const { service } = createHarness();
    const saved = await service.save(makeProductInput());
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');

    const result = await service.save(makeProductInput(), saved.product.id);

    expect(result.status).toBe('saved');
    await expect(service.listProducts()).resolves.toHaveLength(1);
  });

  it('barra uma edição que assumiria a identidade de outro produto', async () => {
    const { service } = createHarness();
    const first = await service.save(makeProductInput());
    const second = await service.save(makeProductInput({ brand: 'Marca B' }));
    if (first.status !== 'saved' || second.status !== 'saved') {
      throw new Error('Falha ao preparar o teste.');
    }

    const result = await service.save(makeProductInput(), second.product.id);

    expect(result).toEqual({ status: 'duplicate', product: first.product });
  });

  it.each(invalidProductCases)('rejeita %s', async (_, variation, errorField) => {
    const { service } = createHarness();

    await expect(service.save(makeProductInput(variation))).rejects.toMatchObject({
      errors: expect.objectContaining({ [errorField]: expect.any(String) }),
    });
  });

  it('permite quantidade fracionária para unidades que aceitam frações', async () => {
    const { service } = createHarness();

    const result = await service.save(
      makeProductInput({ packageQuantity: '1,25', packageUnit: 'L' }),
    );

    expect(result).toEqual({
      status: 'saved',
      product: expect.objectContaining({ packageQuantityMilli: 1250, packageUnit: 'L' }),
    });
  });

  it('cadastra produto de medida variável sem quantidade fixa de embalagem', async () => {
    const { service } = createHarness();

    const result = await service.save(
      makeProductInput({
        name: 'Carne bovina',
        commercializationType: 'VARIABLE',
        packageQuantity: '',
        packageUnit: 'KG',
      }),
    );

    expect(result).toEqual({
      status: 'saved',
      product: expect.objectContaining({
        commercializationType: 'VARIABLE',
        packageQuantityMilli: null,
        packageUnit: 'KG',
      }),
    });
  });

  it('diferencia produtos iguais com formas de comercialização diferentes', async () => {
    const { service } = createHarness();
    await service.save(
      makeProductInput({ packageQuantity: '', packageUnit: null, commercializationType: 'FIXED' }),
    );

    const result = await service.save(
      makeProductInput({
        commercializationType: 'VARIABLE',
        packageQuantity: '',
        packageUnit: 'KG',
      }),
    );

    expect(result.status).toBe('saved');
    await expect(service.listProducts()).resolves.toHaveLength(2);
  });
});
