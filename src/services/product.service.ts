import type { Category } from '@/domain/models/Category';
import type { Product } from '@/domain/models/Product';
import { MEASUREMENT_UNIT_METADATA } from '@/domain/enums/MeasurementUnit';
import type { CategoryRepository } from '@/domain/repositories/category.repository';
import type {
  ProductFormInput,
  ProductListItem,
  ProductRepository,
} from '@/domain/repositories/product.repository';
import type { UUID } from '@/domain/types';

export type ProductFormErrors = Partial<
  Record<'name' | 'brand' | 'packageQuantity' | 'packageUnit' | 'categoryId', string>
>;

export type SaveProductResult =
  | { status: 'saved'; product: Product }
  | { status: 'duplicate'; product: Product }
  | { status: 'restorable'; product: Product };

export class ProductValidationError extends Error {
  constructor(readonly errors: ProductFormErrors) {
    super('Os dados do produto são inválidos.');
  }
}

export type ProductService = {
  listProducts(): Promise<ProductListItem[]>;
  listCategories(): Promise<Category[]>;
  save(input: ProductFormInput, productId?: UUID): Promise<SaveProductResult>;
  delete(productId: UUID): Promise<void>;
  restore(productId: UUID): Promise<Product>;
};

type ProductServiceDependencies = {
  products: ProductRepository;
  categories: CategoryRepository;
  createId: () => UUID;
  now?: () => string;
};

export function createProductService({
  products,
  categories,
  createId,
  now = () => new Date().toISOString(),
}: ProductServiceDependencies): ProductService {
  return {
    listProducts: () => products.listActive(),
    listCategories: () => categories.listActive(),

    async save(input, productId) {
      const normalized = normalizeProductInput(input);
      const conflict = await products.findByIdentity(normalized, productId);

      if (conflict) {
        return conflict.deletedAt
          ? { status: 'restorable', product: conflict }
          : { status: 'duplicate', product: conflict };
      }

      const timestamp = now();
      const product = productId
        ? await products.update({ ...normalized, id: productId, updatedAt: timestamp })
        : await products.create({
            ...normalized,
            id: createId(),
            createdAt: timestamp,
            updatedAt: timestamp,
          });

      return { status: 'saved', product };
    },

    delete: (productId) => products.softDelete(productId, now()),
    restore: (productId) => products.restore(productId, now()),
  };
}

function normalizeProductInput(input: ProductFormInput) {
  const errors: ProductFormErrors = {};
  const name = input.name.trim();
  const brand = input.brand.trim() || null;
  const quantityText = input.packageQuantity.trim();
  const hasQuantity = quantityText.length > 0;
  const hasUnit = input.packageUnit !== null;

  if (!name) errors.name = 'Informe o nome do produto.';
  if (input.brand.length > 0 && !brand) errors.brand = 'Informe uma marca válida.';
  if (input.commercializationType === 'FIXED' && hasQuantity !== hasUnit) {
    if (!hasQuantity) errors.packageQuantity = 'Informe a quantidade da embalagem.';
    if (!hasUnit) errors.packageUnit = 'Selecione a unidade da embalagem.';
  }
  if (input.commercializationType === 'VARIABLE') {
    if (hasQuantity) {
      errors.packageQuantity = 'Produtos de medida variável não possuem embalagem fixa.';
    }
    if (!hasUnit) errors.packageUnit = 'Selecione a unidade de medida.';
  }

  let packageQuantityMilli: number | null = null;
  if (input.commercializationType === 'FIXED' && hasQuantity) {
    const quantity = Number(quantityText.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.packageQuantity = 'Informe uma quantidade maior que zero.';
    } else if (
      input.packageUnit &&
      !MEASUREMENT_UNIT_METADATA[input.packageUnit].allowsFraction &&
      !Number.isInteger(quantity)
    ) {
      errors.packageQuantity = 'Unidades não permitem quantidade fracionária.';
    } else {
      packageQuantityMilli = Math.round(quantity * 1000);
    }
  }

  if (Object.keys(errors).length > 0) throw new ProductValidationError(errors);

  return {
    name,
    brand,
    categoryId: input.categoryId,
    commercializationType: input.commercializationType,
    packageQuantityMilli,
    packageUnit: input.packageUnit,
  };
}

export function formatPackageQuantity(quantityMilli: number | null): string {
  if (quantityMilli === null) return '';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(quantityMilli / 1000);
}
