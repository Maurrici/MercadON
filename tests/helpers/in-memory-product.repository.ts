import type { Product } from '@/domain/models/Product';
import type {
  ProductIdentity,
  ProductListItem,
  ProductRepository,
  SaveProductRecord,
  UpdateProductRecord,
} from '@/domain/repositories/product.repository';
import type { ISODateTime, UUID } from '@/domain/types';

export class InMemoryProductRepository implements ProductRepository {
  private readonly products: Product[] = [];

  async listActive(): Promise<ProductListItem[]> {
    return this.products
      .filter((product) => product.deletedAt === null)
      .map((product) => ({ ...product, categoryName: null }));
  }

  async findByIdentity(identity: ProductIdentity, excludeId?: UUID): Promise<Product | null> {
    const product = this.products.find(
      (candidate) =>
        candidate.id !== excludeId &&
        normalizeText(candidate.name) === normalizeText(identity.name) &&
        normalizeText(candidate.brand) === normalizeText(identity.brand) &&
        candidate.commercializationType === identity.commercializationType &&
        candidate.packageQuantityMilli === identity.packageQuantityMilli &&
        candidate.packageUnit === identity.packageUnit,
    );

    return product ? { ...product } : null;
  }

  async create(input: SaveProductRecord): Promise<Product> {
    const product: Product = { ...input, deletedAt: null };
    this.products.push(product);
    return { ...product };
  }

  async update(input: UpdateProductRecord): Promise<Product> {
    const index = this.products.findIndex(
      (product) => product.id === input.id && product.deletedAt === null,
    );
    if (index < 0) throw new Error('Produto não encontrado.');

    const product = { ...this.products[index], ...input, deletedAt: null };
    this.products[index] = product;
    return { ...product };
  }

  async softDelete(id: UUID, deletedAt: ISODateTime): Promise<void> {
    const product = this.products.find((candidate) => candidate.id === id);
    if (!product || product.deletedAt) throw new Error('Produto não encontrado para exclusão.');
    product.deletedAt = deletedAt;
    product.updatedAt = deletedAt;
  }

  async restore(id: UUID, restoredAt: ISODateTime): Promise<Product> {
    const product = this.products.find((candidate) => candidate.id === id);
    if (!product || !product.deletedAt) throw new Error('Produto não encontrado para restauração.');
    product.deletedAt = null;
    product.updatedAt = restoredAt;
    return { ...product };
  }
}

function normalizeText(value: string | null): string {
  return (value ?? '').toLocaleLowerCase('pt-BR');
}
