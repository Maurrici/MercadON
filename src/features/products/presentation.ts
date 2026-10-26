import { getMeasurementUnitLabel } from '@/domain/enums/MeasurementUnit';
import type { ProductFormValues } from '@/components/product';
import type { ProductListItem } from '@/domain/repositories/product.repository';
import { formatPackageQuantity } from '@/services/product.service';

export function toProductFormValues(product: ProductListItem): ProductFormValues {
  return {
    name: product.name,
    brand: product.brand ?? '',
    commercializationType: product.commercializationType,
    packageQuantity: formatPackageQuantity(product.packageQuantityMilli),
    packageUnit: product.packageUnit,
    categoryId: product.categoryId,
  };
}

export function formatProductDetails(product: ProductListItem): string {
  const unit = product.packageUnit ? getMeasurementUnitLabel(product.packageUnit) : null;
  const quantity = formatPackageQuantity(product.packageQuantityMilli);
  const commercialization =
    product.commercializationType === 'VARIABLE'
      ? unit
        ? `Vendido por ${unit}`
        : null
      : quantity && unit
        ? `${quantity} ${unit}`
        : null;
  return [product.brand, commercialization, product.categoryName].filter(Boolean).join(' · ');
}

export function filterProducts(
  products: readonly ProductListItem[],
  query: string,
  categoryIds: readonly string[],
): ProductListItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const selectedCategories = new Set(categoryIds);

  return products.filter((product) => {
    const matchesText =
      !normalizedQuery ||
      [product.name, product.brand, product.categoryName].some((value) =>
        value?.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
      );
    const matchesCategory =
      selectedCategories.size === 0 ||
      (product.categoryId !== null && selectedCategories.has(product.categoryId));
    return matchesText && matchesCategory;
  });
}
