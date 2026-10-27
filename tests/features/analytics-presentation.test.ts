import {
  formatAnalyticUnit,
  formatComparison,
  formatPercentageTenths,
  shiftMonth,
  truncateLabel,
} from '@/features/analytics/presentation';
import { describe, expect, it } from '@jest/globals';

describe('apresentação das análises', () => {
  it('navega entre meses sem depender da duração do mês', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('explica comparações cuja base anterior é zero', () => {
    expect(formatComparison('no_previous', 1234, null)).toContain('mês anterior sem gastos');
    expect(formatComparison('both_zero', 0, null)).toBe('Nenhum gasto nos dois períodos');
  });

  it('formata percentuais com sinal e uma casa decimal', () => {
    expect(formatPercentageTenths(145)).toBe('+14,5%');
    expect(formatPercentageTenths(-1000)).toBe('-100,0%');
  });

  it('mantém a unidade analítica explícita', () => {
    expect(formatAnalyticUnit('UNIT')).toBe('un');
    expect(formatAnalyticUnit('KG')).toBe('kg');
    expect(formatAnalyticUnit('L')).toBe('L');
  });

  it('trunca somente rótulos que excedem o limite', () => {
    expect(truncateLabel('Bebidas', 10)).toBe('Bebidas');
    expect(truncateLabel('Higiene e cuidados pessoais', 12)).toBe('Higiene e c…');
  });
});
