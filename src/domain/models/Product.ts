import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ISODateTime, UUID } from '@/domain/types';

export type Product = {
  id: UUID;
  name: string;

  brand: string | null;
  categoryId: UUID | null;

  packageQuantityMilli: number | null;
  packageUnit: MeasurementUnit | null;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};