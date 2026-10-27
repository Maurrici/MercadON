import { isISODate, toLocalISODate } from '@/domain/date';
import { describe, expect, it } from '@jest/globals';

describe('data civil', () => {
  it('valida somente datas ISO existentes', () => {
    expect(isISODate('2026-02-28')).toBe(true);
    expect(isISODate('2024-02-29')).toBe(true);
    expect(isISODate('2026-02-29')).toBe(false);
    expect(isISODate('2026-2-03')).toBe(false);
    expect(isISODate('2026-10-23T12:00:00.000Z')).toBe(false);
  });

  it('extrai o calendário local sem converter pelo UTC', () => {
    const localLateNight = new Date(2026, 9, 23, 23, 45, 0);
    expect(toLocalISODate(localLateNight)).toBe('2026-10-23');
  });
});
