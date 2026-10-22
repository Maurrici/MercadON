export const MEASUREMENT_UNITS = ['UNIT', 'G', 'KG', 'ML', 'L'] as const;

export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

type MeasurementUnitMetadata = {
  label: string;
  name: string;
  allowsFraction: boolean;
};

export const MEASUREMENT_UNIT_METADATA = {
  UNIT: { label: 'un', name: 'Unidade', allowsFraction: false },
  G: { label: 'g', name: 'Grama', allowsFraction: true },
  KG: { label: 'kg', name: 'Quilograma', allowsFraction: true },
  ML: { label: 'ml', name: 'Mililitro', allowsFraction: true },
  L: { label: 'L', name: 'Litro', allowsFraction: true },
} satisfies Record<MeasurementUnit, MeasurementUnitMetadata>;

export function getMeasurementUnitLabel(unit: MeasurementUnit): string {
  return MEASUREMENT_UNIT_METADATA[unit].label;
}
