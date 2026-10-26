import { createMarketService, MarketValidationError } from '@/services/market.service';
import { describe, expect, it } from '@jest/globals';
import { InMemoryMarketRepository } from '../helpers/in-memory-market.repository';

const NOW = '2026-10-21T12:00:00.000Z';

function createHarness() {
  const markets = new InMemoryMarketRepository();
  let nextId = 1;
  const service = createMarketService({
    markets,
    createId: () => `market-${nextId++}`,
    now: () => NOW,
  });
  return { markets, service };
}

describe('MarketService', () => {
  it('cadastra um mercado normalizando o nome e preenchendo seus metadados', async () => {
    const { service } = createHarness();

    const result = await service.save({ name: '  Assaí Mister Hull  ' });

    expect(result).toEqual({
      status: 'saved',
      market: {
        id: 'market-1',
        name: 'Assaí Mister Hull',
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null,
      },
    });
  });

  it('barra um mercado com o mesmo nome', async () => {
    const { service } = createHarness();
    await service.save({ name: 'Assaí' });

    const result = await service.save({ name: 'Assaí' });

    expect(result.status).toBe('duplicate');
    await expect(service.listMarkets()).resolves.toHaveLength(1);
  });

  it('considera o nome duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const { service } = createHarness();
    await service.save({ name: 'Assaí' });

    const result = await service.save({ name: 'ASSAÍ' });

    expect(result.status).toBe('duplicate');
  });

  it('considera espaços externos durante a verificação de duplicidade', async () => {
    const { service } = createHarness();
    await service.save({ name: 'Assaí' });

    const result = await service.save({ name: '  Assaí  ' });

    expect(result.status).toBe('duplicate');
  });

  it('permite mercados com nomes diferentes', async () => {
    const { service } = createHarness();
    await service.save({ name: 'Assaí' });

    const result = await service.save({ name: 'Assaí Parangaba' });

    expect(result.status).toBe('saved');
    await expect(service.listMarkets()).resolves.toHaveLength(2);
  });

  it('rejeita um nome vazio', async () => {
    const { service } = createHarness();

    await expect(service.save({ name: '   ' })).rejects.toEqual(
      new MarketValidationError({ name: 'Informe o nome do mercado.' }),
    );
  });

  it('permite salvar uma edição sem conflitar com o próprio mercado', async () => {
    const { service } = createHarness();
    const saved = await service.save({ name: 'Assaí' });
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');

    const result = await service.save({ name: 'Assaí' }, saved.market.id);

    expect(result.status).toBe('saved');
    await expect(service.listMarkets()).resolves.toHaveLength(1);
  });

  it('atualiza o nome do mercado durante a edição', async () => {
    const { service } = createHarness();
    const saved = await service.save({ name: 'Assaí' });
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');

    const result = await service.save({ name: 'Assaí Parangaba' }, saved.market.id);

    expect(result).toEqual({
      status: 'saved',
      market: expect.objectContaining({ id: saved.market.id, name: 'Assaí Parangaba' }),
    });
  });

  it('barra uma edição que assumiria o nome de outro mercado', async () => {
    const { service } = createHarness();
    const first = await service.save({ name: 'Assaí' });
    const second = await service.save({ name: 'Cometa' });
    if (first.status !== 'saved' || second.status !== 'saved') {
      throw new Error('Falha ao preparar o teste.');
    }

    const result = await service.save({ name: 'Assaí' }, second.market.id);

    expect(result).toEqual({ status: 'duplicate', market: first.market });
  });

  it('remove logicamente o mercado da listagem ativa', async () => {
    const { service } = createHarness();
    const saved = await service.save({ name: 'Assaí' });
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');

    await service.delete(saved.market.id);

    await expect(service.listMarkets()).resolves.toEqual([]);
  });

  it('recupera mercado arquivado para identificação no histórico', async () => {
    const { service } = createHarness();
    const saved = await service.save({ name: 'Assaí' });
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');
    await service.delete(saved.market.id);

    await expect(service.getMarket(saved.market.id)).resolves.toMatchObject({
      id: saved.market.id,
      name: 'Assaí',
      deletedAt: NOW,
    });
  });

  it('oferece restauração quando o nome pertence a um mercado excluído', async () => {
    const { service } = createHarness();
    const saved = await service.save({ name: 'Assaí' });
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');
    await service.delete(saved.market.id);

    const result = await service.save({ name: 'Assaí' });

    expect(result).toEqual({
      status: 'restorable',
      market: expect.objectContaining({ id: saved.market.id, deletedAt: NOW }),
    });
  });

  it('restaura o mercado para a listagem ativa', async () => {
    const { service } = createHarness();
    const saved = await service.save({ name: 'Assaí' });
    if (saved.status !== 'saved') throw new Error('Falha ao preparar o teste.');
    await service.delete(saved.market.id);

    await service.restore(saved.market.id);

    await expect(service.listMarkets()).resolves.toEqual([
      expect.objectContaining({ id: saved.market.id, deletedAt: null }),
    ]);
  });
});
