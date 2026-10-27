import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { MonthSelector } from '@/components/analytics/MonthSelector';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { monthKeyFromDate, type MonthKey } from '@/domain/analytics-period';
import { toLocalISODate } from '@/domain/date';
import { formatNormalizedPrice, formatPercentageTenths } from '@/features/analytics/presentation';
import { useAnalyticsService } from '@/hooks/useAnalyticsService';
import type { PriceVariation, PriceVariationAnalysis } from '@/services/analytics.service';
import { colors, spacing, typography } from '@/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PriceVariationsScreen() {
  const service = useAnalyticsService();
  const maximumMonth = monthKeyFromDate(toLocalISODate());
  const [month, setMonth] = useState<MonthKey>(maximumMonth);
  const [analysis, setAnalysis] = useState<PriceVariationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAnalysis(await service.getPriceVariations(month));
      setError(null);
    } catch {
      setError('Não foi possível carregar as variações de preço.');
    } finally {
      setLoading(false);
    }
  }, [month, service]);

  useFocusEffect(useCallback(() => void load(), [load]));
  const hasVariations = Boolean(
    analysis && analysis.increases.length + analysis.decreases.length > 0,
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <AnalyticsHeader title="Variações de preço" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthSelector maximum={maximumMonth} onChange={setMonth} value={month} />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : hasVariations && analysis ? (
          <>
            {analysis.increases.length > 0 ? (
              <AnalyticsCard description="Maior percentual primeiro" title="↑ Maiores altas">
                <VariationRows items={analysis.increases} tone="danger" />
              </AnalyticsCard>
            ) : null}
            {analysis.decreases.length > 0 ? (
              <AnalyticsCard description="Maior queda percentual primeiro" title="↓ Maiores quedas">
                <VariationRows items={analysis.decreases} tone="success" />
              </AnalyticsCard>
            ) : null}
            {analysis.zeroBaseCount > 0 ? (
              <Text style={styles.note}>
                {analysis.zeroBaseCount}{' '}
                {analysis.zeroBaseCount === 1 ? 'produto ficou' : 'produtos ficaram'} fora do
                ranking por não haver base percentual anterior.
              </Text>
            ) : null}
          </>
        ) : (
          <EmptyState
            description="São necessários dois preços comparáveis, com o mais recente dentro do mês escolhido."
            icon="↕"
            title="Sem alterações de preço"
          />
        )}
        {error ? <FeedbackToast message={error} tone="danger" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function VariationRows({ items, tone }: { items: PriceVariation[]; tone: 'success' | 'danger' }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={`${item.productName}, ${formatPercentageTenths(
            item.percentageTenths,
          )}, de ${formatNormalizedPrice(
            item.previousPriceCents,
            item.unit,
          )} para ${formatNormalizedPrice(item.currentPriceCents, item.unit)}`}
          accessibilityRole="button"
          key={item.productId}
          onPress={() =>
            router.push({ pathname: '/analytics/products/[id]', params: { id: item.productId } })
          }
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.copy}>
            <Text style={styles.product}>{item.productName}</Text>
            {item.productBrand ? <Text style={styles.brand}>{item.productBrand}</Text> : null}
            <Text style={styles.prices}>
              {formatNormalizedPrice(item.previousPriceCents, item.unit)} →{' '}
              {formatNormalizedPrice(item.currentPriceCents, item.unit)}
            </Text>
          </View>
          <Text style={[styles.percentage, tone === 'danger' ? styles.danger : styles.success]}>
            {tone === 'danger' ? '↑ ' : '↓ '}
            {formatPercentageTenths(item.percentageTenths)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  centered: { minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.xs },
  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  copy: { flex: 1, minWidth: 0 },
  product: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '800' },
  brand: { ...typography.caption, color: colors.textSecondary },
  prices: { ...typography.caption, color: colors.textSecondary },
  percentage: { ...typography.bodySmall, fontWeight: '900' },
  danger: { color: colors.danger },
  success: { color: colors.success },
  note: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
