import { Market } from '../models/Market';
import { UUID } from '../types';

export type CreateMarketInput = Pick<Market, 'id' | 'name' | 'createdAt' | 'updatedAt'>;

export type MarketRepository = {
  create(input: CreateMarketInput): Promise<Market>;
  findById(id: UUID): Promise<Market | null>;
  listActive(): Promise<Market[]>;
};
