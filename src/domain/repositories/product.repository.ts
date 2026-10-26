import type { Product } from '@/domain/models/Product';
import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ISODateTime, UUID } from '@/domain/types';

export type ProductListItem = Product & { categoryName: string | null };

export type ProductIdentity = Pick<
  Product,
  'name' | 'brand' | 'commercializationType' | 'packageQuantityMilli' | 'packageUnit'
>;

export type SaveProductRecord = ProductIdentity & {
  id: UUID;
  categoryId: UUID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type UpdateProductRecord = ProductIdentity & {
  id: UUID;
  categoryId: UUID | null;
  updatedAt: ISODateTime;
};

export type ProductPurchaseUsage = {
  inDraft: boolean;
  inCompletedPurchase: boolean;
};

export type ProductRepository = {
  listActive(): Promise<ProductListItem[]>;
  findListItemById(id: UUID): Promise<ProductListItem | null>;
  findById(id: UUID): Promise<Product | null>;
  findByIdentity(identity: ProductIdentity, excludeId?: UUID): Promise<Product | null>;
  getPurchaseUsage(id: UUID): Promise<ProductPurchaseUsage>;
  create(input: SaveProductRecord): Promise<Product>;
  update(input: UpdateProductRecord): Promise<Product>;
  softDelete(id: UUID, deletedAt: ISODateTime): Promise<void>;
  restore(id: UUID, restoredAt: ISODateTime): Promise<Product>;
};

export type ProductFormInput = {
  name: string;
  brand: string;
  commercializationType: Product['commercializationType'];
  packageQuantity: string;
  packageUnit: MeasurementUnit | null;
  categoryId: UUID | null;
};
