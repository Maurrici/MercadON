import type { Market } from '@/domain/models/Market';
import type { ISODateTime, UUID } from '@/domain/types';

export type MarketIdentity = Pick<Market, 'name'>;

export type SaveMarketRecord = MarketIdentity & {
  id: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type UpdateMarketRecord = MarketIdentity & {
  id: UUID;
  updatedAt: ISODateTime;
};

export type MarketRepository = {
  listActive(): Promise<Market[]>;
  findById(id: UUID): Promise<Market | null>;
  findByIdentity(identity: MarketIdentity, excludeId?: UUID): Promise<Market | null>;
  create(input: SaveMarketRecord): Promise<Market>;
  update(input: UpdateMarketRecord): Promise<Market>;
  softDelete(id: UUID, deletedAt: ISODateTime): Promise<void>;
  restore(id: UUID, restoredAt: ISODateTime): Promise<Market>;
};

export type MarketFormInput = {
  name: string;
};
