import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { PriceLineChart } from '@/components/charts';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { formatCivilDate, formatNormalizedPrice } from '@/features/analytics/presentation';
import { useAnalyticsService } from '@/hooks/useAnalyticsService';
import type { ProductPriceHistory } from '@/services/analytics.service';
import { colors, radius, spacing, typography } from '@/theme';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductPriceHistoryScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const service = useAnalyticsService();
  const [history, setHistory] = useState<ProductPriceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!productId) {
      setError('Produto inválido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await service.getProductPriceHistory(productId);
      setHistory(result);
      setError(result ? null : 'Produto não encontrado.');
    } catch {
      setError('Não foi possível carregar o histórico de preço.');
    } finally {
      setLoading(false);
    }
  }, [productId, service]);

  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <AnalyticsHeader title="Histórico de preço" />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : history ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.productName}>{history.productName}</Text>
            {history.productBrand ? <Text style={styles.brand}>{history.productBrand}</Text> : null}
          </View>

          {history.occurrences.length > 0 ? (
            <>
              <View style={styles.metrics}>
                <Metric label="Atual" unit={history.unit} value={history.currentPriceCents} />
                <Metric label="Mínimo" unit={history.unit} value={history.minimumPriceCents} />
                <Metric label="Máximo" unit={history.unit} value={history.maximumPriceCents} />
              </View>

              {history.occurrences.length > 1 ? (
                <AnalyticsCard
                  description="Somente ocorrências compatíveis com a forma atual de comercialização."
                  title="Evolução"
                >
                  <PriceLineChart occurrences={history.occurrences} unit={history.unit} />
                </AnalyticsCard>
              ) : (
                <AnalyticsCard title="Um preço registrado">
                  <Text style={styles.helper}>
                    Registre uma nova compra deste produto para começar a acompanhar a evolução.
                  </Text>
                </AnalyticsCard>
              )}

              <AnalyticsCard title="Registros utilizados">
                <View style={styles.records}>
                  {[...history.occurrences].reverse().map((occurrence) => (
                    <View accessible key={occurrence.itemId} style={styles.record}>
                      <View style={styles.recordCopy}>
                        <Text style={styles.market}>{occurrence.marketName}</Text>
                        <Text style={styles.date}>{formatCivilDate(occurrence.purchasedAt)}</Text>
                      </View>
                      <Text style={styles.price}>
                        {formatNormalizedPrice(occurrence.normalizedPriceCents, history.unit)}
                      </Text>
                    </View>
                  ))}
                </View>
              </AnalyticsCard>
            </>
          ) : (
            <EmptyState
              description="As compras deste produto ainda não possuem preços compatíveis com a configuração atual."
              icon="⌁"
              title="Nenhum preço comparável"
            />
          )}

          {error ? <FeedbackToast message={error} tone="danger" /> : null}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <EmptyState
            description="Volte e escolha um produto válido."
            icon="!"
            title="Histórico indisponível"
          />
          {error ? <FeedbackToast message={error} tone="danger" /> : null}
        </View>
      )}
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: ProductPriceHistory['unit'];
}) {
  return (
    <View accessible style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue}>
        {value === null ? '—' : formatNormalizedPrice(value, unit)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  productName: { ...typography.title, color: colors.textPrimary, fontWeight: '900' },
  brand: { ...typography.body, color: colors.textSecondary },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: {
    minWidth: 100,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  metricLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  metricValue: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '900' },
  helper: { ...typography.bodySmall, color: colors.textSecondary },
  records: { gap: spacing.xs },
  record: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recordCopy: { flex: 1, minWidth: 0 },
  market: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '700' },
  date: { ...typography.caption, color: colors.textSecondary },
  price: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '800' },
});
