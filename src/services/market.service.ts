import type { Market } from '@/domain/models/Market';
import type { MarketFormInput, MarketRepository } from '@/domain/repositories/market.repository';
import type { UUID } from '@/domain/types';

export type MarketFormErrors = Partial<Record<keyof MarketFormInput, string>>;

export type SaveMarketResult =
  | { status: 'saved'; market: Market }
  | { status: 'duplicate'; market: Market }
  | { status: 'restorable'; market: Market };

export class MarketValidationError extends Error {
  constructor(readonly errors: MarketFormErrors) {
    super('Os dados do mercado são inválidos.');
  }
}

export type MarketService = {
  listMarkets(): Promise<Market[]>;
  save(input: MarketFormInput, marketId?: UUID): Promise<SaveMarketResult>;
  delete(marketId: UUID): Promise<void>;
  restore(marketId: UUID): Promise<Market>;
};

type MarketServiceDependencies = {
  markets: MarketRepository;
  createId: () => UUID;
  now?: () => string;
};

export function createMarketService({
  markets,
  createId,
  now = () => new Date().toISOString(),
}: MarketServiceDependencies): MarketService {
  return {
    listMarkets: () => markets.listActive(),

    async save(input, marketId) {
      const normalized = normalizeMarketInput(input);
      const conflict = await markets.findByIdentity(normalized, marketId);

      if (conflict) {
        return conflict.deletedAt
          ? { status: 'restorable', market: conflict }
          : { status: 'duplicate', market: conflict };
      }

      const timestamp = now();
      const market = marketId
        ? await markets.update({ ...normalized, id: marketId, updatedAt: timestamp })
        : await markets.create({
            ...normalized,
            id: createId(),
            createdAt: timestamp,
            updatedAt: timestamp,
          });

      return { status: 'saved', market };
    },

    delete: (marketId) => markets.softDelete(marketId, now()),
    restore: (marketId) => markets.restore(marketId, now()),
  };
}

function normalizeMarketInput(input: MarketFormInput) {
  const name = input.name.trim();
  if (!name) {
    throw new MarketValidationError({ name: 'Informe o nome do mercado.' });
  }
  return { name };
}
