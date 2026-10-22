import type { Market } from '@/domain/models/Market';
import type {
  MarketIdentity,
  MarketRepository,
  SaveMarketRecord,
  UpdateMarketRecord,
} from '@/domain/repositories/market.repository';
import type { ISODateTime, UUID } from '@/domain/types';

export class InMemoryMarketRepository implements MarketRepository {
  private readonly markets: Market[] = [];

  async listActive(): Promise<Market[]> {
    return this.markets
      .filter((market) => market.deletedAt === null)
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
      .map((market) => ({ ...market }));
  }

  async findById(id: UUID): Promise<Market | null> {
    const market = this.markets.find((candidate) => candidate.id === id);
    return market ? { ...market } : null;
  }

  async findByIdentity(identity: MarketIdentity, excludeId?: UUID): Promise<Market | null> {
    const market = this.markets.find(
      (candidate) =>
        candidate.id !== excludeId &&
        normalizeName(candidate.name) === normalizeName(identity.name),
    );
    return market ? { ...market } : null;
  }

  async create(input: SaveMarketRecord): Promise<Market> {
    const market: Market = { ...input, deletedAt: null };
    this.markets.push(market);
    return { ...market };
  }

  async update(input: UpdateMarketRecord): Promise<Market> {
    const index = this.markets.findIndex(
      (market) => market.id === input.id && market.deletedAt === null,
    );
    if (index < 0) throw new Error('Mercado não encontrado para edição.');

    const market = { ...this.markets[index], ...input, deletedAt: null };
    this.markets[index] = market;
    return { ...market };
  }

  async softDelete(id: UUID, deletedAt: ISODateTime): Promise<void> {
    const market = this.markets.find((candidate) => candidate.id === id);
    if (!market || market.deletedAt) throw new Error('Mercado não encontrado para exclusão.');
    market.deletedAt = deletedAt;
    market.updatedAt = deletedAt;
  }

  async restore(id: UUID, restoredAt: ISODateTime): Promise<Market> {
    const market = this.markets.find((candidate) => candidate.id === id);
    if (!market || !market.deletedAt) throw new Error('Mercado não encontrado para restauração.');
    market.deletedAt = null;
    market.updatedAt = restoredAt;
    return { ...market };
  }
}

function normalizeName(name: string): string {
  return name.toLocaleLowerCase('pt-BR');
}
