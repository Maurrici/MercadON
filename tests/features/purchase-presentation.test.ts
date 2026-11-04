import {
  formatPurchaseDate,
  parsePurchaseDateInput,
  shouldReturnToProductSelection,
  sortPurchaseItemsNewestFirst,
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

describe('fluxo de inclusão no carrinho', () => {
  it('mostra primeiro os itens adicionados mais recentemente sem alterar a lista original', () => {
    const older = { ...draft.items[0], id: 'item-older', createdAt: '2026-10-23T10:00:00.000Z' };
    const newer = { ...draft.items[0], id: 'item-newer', createdAt: '2026-10-23T12:00:00.000Z' };
    const items = [older, newer];

    expect(sortPurchaseItemsNewestFirst(items).map((item) => item.id)).toEqual([
      'item-newer',
      'item-older',
    ]);
    expect(items.map((item) => item.id)).toEqual(['item-older', 'item-newer']);
  });

  it('volta do formulário novo para a seleção, mas sai da tela ao editar um item', () => {
    expect(shouldReturnToProductSelection(undefined, true)).toBe(true);
    expect(shouldReturnToProductSelection(undefined, false)).toBe(false);
    expect(shouldReturnToProductSelection('item-1', true)).toBe(false);
  });
});

describe('data administrativa da compra', () => {
  it('converte entre a apresentação brasileira e a data civil persistida', () => {
    expect(formatPurchaseDate('2026-10-20')).toBe('20/10/2026');
    expect(parsePurchaseDateInput('20/10/2026')).toBe('2026-10-20');
  });

  it('rejeita datas inexistentes ou em formato inesperado', () => {
    expect(parsePurchaseDateInput('31/02/2026')).toBeNull();
    expect(parsePurchaseDateInput('2026-10-20')).toBeNull();
  });
});
