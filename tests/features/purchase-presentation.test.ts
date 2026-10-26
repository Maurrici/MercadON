import {
  formatPurchaseDate,
  parsePurchaseDateInput,
  toDraftSummary,
  toPurchaseItemFormValues,
} from '@/features/purchases/presentation';
import type { PurchaseDraftDetails } from '@/services/purchase.service';
import { describe, expect, it } from '@jest/globals';

const NOW = '2026-10-23T12:00:00.000Z';

const draft: PurchaseDraftDetails = {
  purchase: {
    id: 'purchase-1',
    marketId: 'market-1',
    status: 'DRAFT',
    purchasedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
  },
  items: [
    {
      id: 'item-1',
      purchaseId: 'purchase-1',
      productId: 'product-1',
      commercializationType: 'FIXED',
      quantityMilli: 2000,
      quantityUnit: 'UNIT',
      unitPriceCents: 1490,
      totalPriceCents: 2980,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    },
  ],
  totalPriceCents: 2980,
};

describe('apresentação da aba Compras', () => {
  it('resume o rascunho persistido com mercado, itens e total', () => {
    expect(
      toDraftSummary(draft, [
        {
          id: 'market-1',
          name: 'Mercado Central',
          createdAt: NOW,
          updatedAt: NOW,
          deletedAt: null,
        },
      ]),
    ).toEqual({
      purchase: draft.purchase,
      marketName: 'Mercado Central',
      itemCount: 1,
      totalPriceCents: 2980,
    });
  });

  it('mantém o rascunho acessível quando o mercado não está na lista ativa', () => {
    expect(toDraftSummary(draft, []).marketName).toBe('Mercado não disponível');
  });
});

describe('preenchimento da edição de item', () => {
  it('usa preço unitário para produto fixo', () => {
    expect(toPurchaseItemFormValues(draft.items[0])).toEqual({
      quantity: '2',
      price: '14,90',
    });
  });

  it('usa preço total pago para produto variável', () => {
    expect(
      toPurchaseItemFormValues({
        ...draft.items[0],
        commercializationType: 'VARIABLE',
        quantityMilli: 1275,
        quantityUnit: 'KG',
        unitPriceCents: null,
        totalPriceCents: 5087,
      }),
    ).toEqual({ quantity: '1,275', price: '50,87' });
  });
});

describe('data administrativa da compra', () => {
  it('converte entre a apresentação brasileira e o instante persistido', () => {
    expect(formatPurchaseDate('2026-10-20T12:00:00.000Z')).toBe('20/10/2026');
    expect(parsePurchaseDateInput('20/10/2026')).toBe('2026-10-20T12:00:00.000Z');
  });

  it('rejeita datas inexistentes ou em formato inesperado', () => {
    expect(parsePurchaseDateInput('31/02/2026')).toBeNull();
    expect(parsePurchaseDateInput('2026-10-20')).toBeNull();
  });
});
