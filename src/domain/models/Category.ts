import type { ISODateTime, UUID } from '@/domain/types';

export type Category = {
  id: UUID;
  name: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
};