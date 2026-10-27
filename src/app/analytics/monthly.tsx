import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { MonthSelector } from '@/components/analytics/MonthSelector';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { monthKeyFromDate, type MonthKey } from '@/domain/analytics-period';
import { toLocalISODate } from '@/domain/date';
import { formatComparison } from '@/features/analytics/presentation';
import { useAnalyticsService } from '@/hooks/useAnalyticsService';
import type { MonthlySpendingOverview } from '@/services/analytics.service';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MonthlyAnalysisScreen() {
  const service = useAnalyticsService();
  const maximumMonth = monthKeyFromDate(toLocalISODate());
  const [month, setMonth] = useState<MonthKey>(maximumMonth);
  const [overview, setOverview] = useState<MonthlySpendingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await service.getMonthlyOverview(month));
      setError(null);
    } catch {
      setError('Não foi possível carregar a análise mensal.');
    } finally {
      setLoading(false);
    }
  }, [month, service]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <AnalyticsHeader title="Análise mensal" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthSelector maximum={maximumMonth} onChange={setMonth} value={month} />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : overview && overview.completedPurchaseCount > 0 ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>TOTAL DO PERÍODO</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
                {formatCurrencyFromCents(overview.totalPriceCents)}
              </Text>
              <Text style={styles.detail}>
                {overview.completedPurchaseCount}{' '}
                {overview.completedPurchaseCount === 1 ? 'compra concluída' : 'compras concluídas'}
              </Text>
            </View>
            <AnalyticsCard title="Comparação com o período anterior">
              <Text style={styles.comparison}>
                {formatComparison(
                  overview.comparisonState,
                  overview.differenceCents,
                  overview.percentageTenths,
                )}
              </Text>
              <Text style={styles.previous}>
                Período anterior: {formatCurrencyFromCents(overview.previousTotalPriceCents)}
              </Text>
            </AnalyticsCard>
          </>
        ) : (
          <EmptyState
            description="Escolha outro mês ou conclua uma compra para gerar a análise."
            icon="▥"
            title="Nenhuma compra no período"
          />
        )}
        {error ? <FeedbackToast message={error} tone="danger" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  centered: { minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  hero: {
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
  },
  eyebrow: { ...typography.caption, color: '#DBEAFE', fontWeight: '800' },
  value: { ...typography.display, color: colors.onPrimary, fontWeight: '900' },
  detail: { ...typography.bodySmall, color: colors.onPrimary },
  comparison: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  previous: { ...typography.bodySmall, color: colors.textSecondary },
});
