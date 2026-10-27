import {
  buildMonthlyComparisonPeriod,
  buildRecentMonthlyPeriods,
  includesDate,
} from '@/domain/analytics-period';
import { describe, expect, it } from '@jest/globals';

describe('períodos analíticos mensais', () => {
  it('compara mês atual parcial com o mesmo intervalo anterior', () => {
    expect(buildMonthlyComparisonPeriod('2026-10', '2026-10-26')).toEqual({
      current: {
        month: '2026-10',
        range: { startDate: '2026-10-01', endExclusive: '2026-10-27' },
        isPartial: true,
      },
      previous: {
        month: '2026-09',
        range: { startDate: '2026-09-01', endExclusive: '2026-09-27' },
        isPartial: true,
      },
    });
  });

  it('limita a comparação ao fim de um mês anterior mais curto', () => {
    expect(buildMonthlyComparisonPeriod('2026-03', '2026-03-31').previous.range).toEqual({
      startDate: '2026-02-01',
      endExclusive: '2026-03-01',
    });
  });

  it('compara meses encerrados integralmente', () => {
    expect(buildMonthlyComparisonPeriod('2026-08', '2026-10-26')).toEqual({
      current: {
        month: '2026-08',
        range: { startDate: '2026-08-01', endExclusive: '2026-09-01' },
        isPartial: false,
      },
      previous: {
        month: '2026-07',
        range: { startDate: '2026-07-01', endExclusive: '2026-08-01' },
        isPartial: false,
      },
    });
  });

  it('gera seis meses contínuos e mantém o atual parcial', () => {
    const periods = buildRecentMonthlyPeriods('2026-02-10');
    expect(periods.map((period) => period.month)).toEqual([
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
    expect(periods.at(-1)).toEqual({
      month: '2026-02',
      range: { startDate: '2026-02-01', endExclusive: '2026-02-11' },
      isPartial: true,
    });
  });

  it('usa intervalo semiaberto e rejeita mês futuro', () => {
    const range = { startDate: '2026-10-01', endExclusive: '2026-11-01' } as const;
    expect(includesDate(range, '2026-10-31')).toBe(true);
    expect(includesDate(range, '2026-11-01')).toBe(false);
    expect(() => buildMonthlyComparisonPeriod('2026-11', '2026-10-26')).toThrow(
      'Não é possível analisar um mês futuro.',
    );
  });
});
