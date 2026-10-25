import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { Product } from '@/domain/models/Product';
import type { Purchase } from '@/domain/models/Purchase';
import type { PurchaseItem, PurchaseItemPricing } from '@/domain/models/PurchaseItem';
import type { ProductRepository } from '@/domain/repositories/product.repository';
import type {
  HistoricalPurchaseItem,
  PurchaseItemRepository,
} from '@/domain/repositories/purchase-item.repository';
import type { PurchaseRepository } from '@/domain/repositories/purchase.repository';
import type { ISODateTime, UUID } from '@/domain/types';
import type { PurchaseTransactionRunner } from '@/services/purchase.service';

export type PurchaseItemFormInput = {
  quantity: string;
  price: string;
};

export type PriceComparisonStatus = 'cheaper' | 'more_expensive' | 'same_price' | 'no_history';

export type PriceComparison = {
  status: PriceComparisonStatus;
  currentNormalizedPriceCents: number;
  previousNormalizedPriceCents: number | null;
  differenceCents: number | null;
  unit: MeasurementUnit;
};

export type PreparedPurchaseItem = PurchaseItemPricing & {
  quantityMilli: number;
  totalPriceCents: number;
};

export type PurchaseItemPreview = PreparedPurchaseItem & {
  comparison: PriceComparison;
};

export type SavePurchaseItemResult = {
  item: PurchaseItem;
  purchaseTotalCents: number;
  comparison: PriceComparison;
};

export type PurchaseItemFormErrors = Partial<Record<'quantity' | 'price', string>>;

export class PurchaseItemValidationError extends Error {
  constructor(readonly errors: PurchaseItemFormErrors) {
    super('Os dados do item são inválidos.');
  }
}

export type PurchaseItemService = {
  previewItem(
    purchaseId: UUID,
    productId: UUID,
    input: PurchaseItemFormInput,
  ): Promise<PurchaseItemPreview>;
  saveItem(
    purchaseId: UUID,
    productId: UUID,
    input: PurchaseItemFormInput,
  ): Promise<SavePurchaseItemResult>;
  incrementFixedItem(purchaseId: UUID, productId: UUID): Promise<SavePurchaseItemResult>;
  removeItem(purchaseId: UUID, itemId: UUID): Promise<number>;
};

type PurchaseItemServiceDependencies = {
  purchases: PurchaseRepository;
  purchaseItems: PurchaseItemRepository;
  products: ProductRepository;
  runInTransaction: PurchaseTransactionRunner;
  createId: () => UUID;
  now?: () => ISODateTime;
};

export function createPurchaseItemService({
  purchases,
  purchaseItems,
  products,
  runInTransaction,
  createId,
  now = () => new Date().toISOString(),
}: PurchaseItemServiceDependencies): PurchaseItemService {
  return {
    async previewItem(purchaseId, productId, input) {
      await requireDraft(purchases, purchaseId);
      const product = await requireActiveProduct(products, productId);
      const prepared = preparePurchaseItem(product, input);
      const history = await purchaseItems.findLatestCompletedByProduct(productId, purchaseId);
      return { ...prepared, comparison: comparePurchaseItemWithHistory(prepared, history) };
    },

    saveItem(purchaseId, productId, input) {
      return runInTransaction(async (repositories) => {
        await requireDraft(repositories.purchases, purchaseId);
        const product = await requireActiveProduct(repositories.products, productId);
        const prepared = preparePurchaseItem(product, input);
        const history = await repositories.purchaseItems.findLatestCompletedByProduct(
          productId,
          purchaseId,
        );
        const existing = await repositories.purchaseItems.findActiveByProduct(
          purchaseId,
          productId,
        );
        const timestamp = now();
        const item = existing
          ? await repositories.purchaseItems.update({
              ...prepared,
              id: existing.id,
              updatedAt: timestamp,
            })
          : await repositories.purchaseItems.create({
              ...prepared,
              id: createId(),
              purchaseId,
              productId,
              createdAt: timestamp,
              updatedAt: timestamp,
            });

        return {
          item,
          purchaseTotalCents:
            await repositories.purchaseItems.sumActiveTotalByPurchaseId(purchaseId),
          comparison: comparePurchaseItemWithHistory(prepared, history),
        };
      });
    },

    incrementFixedItem(purchaseId, productId) {
      return runInTransaction(async (repositories) => {
        await requireDraft(repositories.purchases, purchaseId);
        const current = await repositories.purchaseItems.findActiveByProduct(purchaseId, productId);

        if (!current || current.commercializationType !== 'FIXED') {
          throw new Error('Somente itens fixos já adicionados podem receber +1.');
        }

        const quantityMilli = safeAdd(current.quantityMilli, 1000, 'Quantidade acima do limite.');
        const totalPriceCents = safeAdd(
          current.totalPriceCents,
          current.unitPriceCents,
          'Total acima do limite.',
        );
        const prepared: PreparedPurchaseItem = {
          commercializationType: 'FIXED',
          quantityMilli,
          quantityUnit: 'UNIT',
          unitPriceCents: current.unitPriceCents,
          totalPriceCents,
        };
        const history = await repositories.purchaseItems.findLatestCompletedByProduct(
          productId,
          purchaseId,
        );
        const item = await repositories.purchaseItems.update({
          ...prepared,
          id: current.id,
          updatedAt: now(),
        });

        return {
          item,
          purchaseTotalCents:
            await repositories.purchaseItems.sumActiveTotalByPurchaseId(purchaseId),
          comparison: comparePurchaseItemWithHistory(prepared, history),
        };
      });
    },

    removeItem(purchaseId, itemId) {
      return runInTransaction(async (repositories) => {
        await requireDraft(repositories.purchases, purchaseId);
        const item = await repositories.purchaseItems.findById(itemId);
        if (!item || item.purchaseId !== purchaseId || item.deletedAt !== null) {
          throw new Error('Item não encontrado para remoção.');
        }

        await repositories.purchaseItems.softDelete(itemId, now());
        return repositories.purchaseItems.sumActiveTotalByPurchaseId(purchaseId);
      });
    },
  };
}

export function preparePurchaseItem(
  product: Product,
  input: PurchaseItemFormInput,
): PreparedPurchaseItem {
  const quantityMilli = parseQuantity(input.quantity, product.commercializationType);
  const priceCents = parseMoney(input.price);

  if (product.commercializationType === 'FIXED') {
    const commercialUnits = quantityMilli / 1000;
    const totalPriceCents = safeMultiply(
      commercialUnits,
      priceCents,
      'O subtotal ultrapassa o limite permitido.',
    );
    return {
      commercializationType: 'FIXED',
      quantityMilli,
      quantityUnit: 'UNIT',
      unitPriceCents: priceCents,
      totalPriceCents,
    };
  }

  if (!product.packageUnit) {
    throw new PurchaseItemValidationError({ quantity: 'O produto não possui unidade de medida.' });
  }

  ensureNormalizedPriceIsSafe(priceCents, quantityMilli);
  return {
    commercializationType: 'VARIABLE',
    quantityMilli,
    quantityUnit: product.packageUnit,
    unitPriceCents: null,
    totalPriceCents: priceCents,
  };
}

function parseQuantity(value: string, type: Product['commercializationType']): number {
  const text = value.trim();
  if (!text) throw new PurchaseItemValidationError({ quantity: 'Informe a quantidade.' });

  if (type === 'FIXED') {
    if (!/^\d+$/.test(text)) {
      throw new PurchaseItemValidationError({
        quantity: 'Informe uma quantidade inteira de unidades.',
      });
    }
    const units = parseSafeBigInt(text, 'Quantidade acima do limite permitido.');
    if (units <= 0n) {
      throw new PurchaseItemValidationError({ quantity: 'Informe uma quantidade maior que zero.' });
    }
    return bigintToSafeNumber(units * 1000n, 'quantity', 'Quantidade acima do limite permitido.');
  }

  return parseScaledDecimal(text, 3, false, 'quantity');
}

function parseMoney(value: string): number {
  const text = value.trim().replace(/^R\$\s*/, '');
  if (!text) throw new PurchaseItemValidationError({ price: 'Informe o preço.' });
  return parseScaledDecimal(text, 2, true, 'price');
}

function parseScaledDecimal(
  text: string,
  decimalPlaces: number,
  allowZero: boolean,
  field: 'quantity' | 'price',
): number {
  const expression = new RegExp(`^\\d+(?:[.,]\\d{1,${decimalPlaces}})?$`);
  if (!expression.test(text)) {
    throw new PurchaseItemValidationError({
      [field]:
        field === 'price'
          ? 'Informe um valor monetário com até duas casas decimais.'
          : 'Informe uma quantidade com até três casas decimais.',
    });
  }

  const [whole, fraction = ''] = text.replace(',', '.').split('.');
  const scale = 10n ** BigInt(decimalPlaces);
  const scaled = BigInt(whole) * scale + BigInt(fraction.padEnd(decimalPlaces, '0'));
  if (!allowZero && scaled === 0n) {
    throw new PurchaseItemValidationError({ [field]: 'Informe uma quantidade maior que zero.' });
  }

  return bigintToSafeNumber(
    scaled,
    field,
    field === 'price'
      ? 'Preço acima do limite permitido.'
      : 'Quantidade acima do limite permitido.',
  );
}

function parseSafeBigInt(text: string, message: string): bigint {
  const value = BigInt(text);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new PurchaseItemValidationError({ quantity: message });
  }
  return value;
}

function bigintToSafeNumber(value: bigint, field: 'quantity' | 'price', message: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new PurchaseItemValidationError({ [field]: message });
  }
  return Number(value);
}

function safeMultiply(left: number, right: number, message: string): number {
  const result = BigInt(left) * BigInt(right);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new PurchaseItemValidationError({ price: message });
  }
  return Number(result);
}

function safeAdd(left: number, right: number, message: string): number {
  const result = BigInt(left) + BigInt(right);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(message);
  return Number(result);
}

export function comparePurchaseItemWithHistory(
  current: PreparedPurchaseItem,
  previous: HistoricalPurchaseItem | null,
): PriceComparison {
  const currentNormalizedPriceCents = normalizedPriceCents(current);
  const unit = current.quantityUnit;

  if (
    !previous ||
    previous.commercializationType !== current.commercializationType ||
    previous.quantityUnit !== current.quantityUnit
  ) {
    return {
      status: 'no_history',
      currentNormalizedPriceCents,
      previousNormalizedPriceCents: null,
      differenceCents: null,
      unit,
    };
  }

  const previousNormalizedPriceCents = normalizedPriceCents(previous);
  const difference = currentNormalizedPriceCents - previousNormalizedPriceCents;
  return {
    status: difference < 0 ? 'cheaper' : difference > 0 ? 'more_expensive' : 'same_price',
    currentNormalizedPriceCents,
    previousNormalizedPriceCents,
    differenceCents: Math.abs(difference),
    unit,
  };
}

function normalizedPriceCents(item: PreparedPurchaseItem | PurchaseItem): number {
  if (item.commercializationType === 'FIXED') return item.unitPriceCents;

  const numerator = BigInt(item.totalPriceCents) * 1000n;
  const denominator = BigInt(item.quantityMilli);
  const rounded = (numerator * 2n + denominator) / (denominator * 2n);
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new PurchaseItemValidationError({
      price: 'Preço normalizado acima do limite permitido.',
    });
  }
  return Number(rounded);
}

function ensureNormalizedPriceIsSafe(totalPriceCents: number, quantityMilli: number): void {
  normalizedPriceCents({
    commercializationType: 'VARIABLE',
    quantityMilli,
    quantityUnit: 'UNIT',
    unitPriceCents: null,
    totalPriceCents,
  });
}

async function requireDraft(purchases: PurchaseRepository, purchaseId: UUID): Promise<void> {
  const purchase: Purchase | null = await purchases.findById(purchaseId);
  if (!purchase || purchase.status !== 'DRAFT' || purchase.deletedAt !== null) {
    throw new Error('Rascunho não encontrado.');
  }
}

async function requireActiveProduct(
  products: ProductRepository,
  productId: UUID,
): Promise<Product> {
  const product = await products.findById(productId);
  if (!product || product.deletedAt !== null) throw new Error('Produto não encontrado.');
  return product;
}
