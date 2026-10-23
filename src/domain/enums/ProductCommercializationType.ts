export const PRODUCT_COMMERCIALIZATION_TYPES = ['FIXED', 'VARIABLE'] as const;

export type ProductCommercializationType = (typeof PRODUCT_COMMERCIALIZATION_TYPES)[number];

export const PRODUCT_COMMERCIALIZATION_TYPE_METADATA = {
  FIXED: {
    label: 'Quantidade fixa',
    description: 'Ex.: pacote de café. Compre por unidades.',
  },
  VARIABLE: {
    label: 'Medida variável',
    description: 'Ex.: carne a granel. Informe a medida na compra.',
  },
} satisfies Record<ProductCommercializationType, { label: string; description: string }>;
