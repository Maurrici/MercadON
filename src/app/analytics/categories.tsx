import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { MonthSelector } from '@/components/analytics/MonthSelector';
import { SpendingRows } from '@/components/analytics/SpendingRows';
import { HorizontalSpendingChart } from '@/components/charts';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { monthKeyFromDate, type MonthKey } from '@/domain/analytics-period';
import { toLocalISODate } from '@/domain/date';
import { useAnalyticsService } from '@/hooks/useAnalyticsService';
import type { CategorySpendingAnalysis } from '@/services/analytics.service';
import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryAnalysisScreen() {
  const service = useAnalyticsService();
  const maximumMonth = monthKeyFromDate(toLocalISODate());
  const [month, setMonth] = useState<MonthKey>(maximumMonth);
  const [analysis, setAnalysis] = useState<CategorySpendingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAnalysis(await service.getCategorySpending(month));
      setError(null);
    } catch {
      setError('Não foi possível carregar os gastos por categoria.');
    } finally {
      setLoading(false);
    }
  }, [month, service]);

  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <AnalyticsHeader title="Gastos por categoria" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthSelector maximum={maximumMonth} onChange={setMonth} value={month} />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : analysis && analysis.categories.length > 0 ? (
          <>
            <View>
              <Text style={styles.totalLabel}>TOTAL DO PERÍODO</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
                {formatCurrencyFromCents(analysis.totalPriceCents)}
              </Text>
            </View>
            <AnalyticsCard
              description="Os gastos antigos acompanham a categoria atual de cada produto."
              title="Distribuição"
            >
              <HorizontalSpendingChart
                points={analysis.categories.map((category) => ({
                  label: category.categoryName,
                  valueCents: category.totalPriceCents,
                }))}
              />
            </AnalyticsCard>
            <AnalyticsCard title="Todas as categorias">
              <SpendingRows
                items={analysis.categories.map((category) => ({
                  id: category.categoryId ?? 'uncategorized',
                  label: category.categoryName,
                  valueCents: category.totalPriceCents,
                }))}
              />
            </AnalyticsCard>
          </>
        ) : (
          <EmptyState
            description="Escolha outro mês para consultar a distribuição dos gastos."
            icon="▤"
            title="Nenhum gasto no período"
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
  totalLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '800' },
  total: { ...typography.display, color: colors.textPrimary, fontWeight: '900' },
});
