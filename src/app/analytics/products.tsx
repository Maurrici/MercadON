import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { MonthSelector } from '@/components/analytics/MonthSelector';
import { SpendingRows } from '@/components/analytics/SpendingRows';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { monthKeyFromDate, type MonthKey } from '@/domain/analytics-period';
import { toLocalISODate } from '@/domain/date';
import { useAnalyticsService } from '@/hooks/useAnalyticsService';
import type { ProductSpendingAnalysis } from '@/services/analytics.service';
import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductRankingScreen() {
  const service = useAnalyticsService();
  const maximumMonth = monthKeyFromDate(toLocalISODate());
  const [month, setMonth] = useState<MonthKey>(maximumMonth);
  const [analysis, setAnalysis] = useState<ProductSpendingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAnalysis(await service.getProductSpending(month));
      setError(null);
    } catch {
      setError('Não foi possível carregar o ranking de produtos.');
    } finally {
      setLoading(false);
    }
  }, [month, service]);

  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <AnalyticsHeader title="Produtos por gasto" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthSelector maximum={maximumMonth} onChange={setMonth} value={month} />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : analysis && analysis.products.length > 0 ? (
          <>
            <View>
              <Text style={styles.totalLabel}>TOTAL DO PERÍODO</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
                {formatCurrencyFromCents(analysis.totalPriceCents)}
              </Text>
            </View>
            <AnalyticsCard
              description="Ordenado pelo total pago no mesmo produto do catálogo."
              title="Ranking"
            >
              <SpendingRows
                items={analysis.products.map((product) => ({
                  id: product.productId,
                  label: product.productName,
                  description: [
                    product.productBrand,
                    `${product.purchaseCount} ${product.purchaseCount === 1 ? 'compra' : 'compras'}`,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                  valueCents: product.totalPriceCents,
                }))}
                onPress={(item) =>
                  router.push({ pathname: '/analytics/products/[id]', params: { id: item.id } })
                }
              />
            </AnalyticsCard>
          </>
        ) : (
          <EmptyState
            description="Escolha outro mês para consultar os produtos com maior gasto."
            icon="□"
            title="Nenhum produto no período"
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
