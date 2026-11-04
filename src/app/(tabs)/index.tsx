import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { AppButton } from '@/components/AppButton';
import { BrandLogo } from '@/components/BrandLogo';
import { MonthlyBarChart } from '@/components/charts';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { Screen } from '@/components/Screen';
import {
  formatComparison,
  formatMonth,
  formatNormalizedPrice,
  formatPercentageTenths,
} from '@/features/analytics/presentation';
import { useAnalyticsService } from '@/hooks/useAnalyticsService';
import type {
  CategorySpendingAnalysis,
  MonthlySpendingOverview,
  MonthlySpendingPoint,
  PriceVariationAnalysis,
  ProductSpendingAnalysis,
} from '@/services/analytics.service';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type HomeData = {
  overview: MonthlySpendingOverview;
  evolution: MonthlySpendingPoint[];
  categories: CategorySpendingAnalysis;
  products: ProductSpendingAnalysis;
  variations: PriceVariationAnalysis;
};

export default function HomeScreen() {
  const analyticsService = useAnalyticsService();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const overview = await analyticsService.getMonthlyOverview();
      const [evolution, categories, products, variations] = await Promise.all([
        analyticsService.getRecentMonthlySpending(),
        analyticsService.getCategorySpending(overview.period.month),
        analyticsService.getProductSpending(overview.period.month),
        analyticsService.getPriceVariations(overview.period.month),
      ]);
      setData({ overview, evolution, categories, products, variations });
      setError(null);
    } catch {
      setError('Não foi possível carregar as análises do mês.');
    } finally {
      setLoading(false);
    }
  }, [analyticsService]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const isEmpty = data?.overview.completedPurchaseCount === 0;

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <BrandLogo style={styles.brandLogo} variant="horizontal" />
        {data ? <Text style={styles.period}>{formatMonth(data.overview.period.month)}</Text> : null}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyContent}>
          <EmptyState
            description="Conclua uma compra para acompanhar gastos, categorias e variações de preço."
            icon="▥"
            title="Seu mês começa aqui"
          />
          <AppButton onPress={() => router.push('/purchases/create')} title="Registrar compra" />
        </View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View
            accessible
            accessibilityLabel={monthlySummaryLabel(data.overview)}
            style={styles.hero}
          >
            <Text style={styles.heroEyebrow}>GASTO ACUMULADO DO MÊS</Text>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              numberOfLines={1}
              style={styles.heroValue}
            >
              {formatCurrencyFromCents(data.overview.totalPriceCents)}
            </Text>
            <Text style={styles.heroDetail}>
              {data.overview.completedPurchaseCount}{' '}
              {data.overview.completedPurchaseCount === 1
                ? 'compra concluída'
                : 'compras concluídas'}
            </Text>
            <View style={styles.comparisonPill}>
              <Text style={styles.comparisonText}>
                {formatComparison(
                  data.overview.comparisonState,
                  data.overview.differenceCents,
                  data.overview.percentageTenths,
                )}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/analytics/monthly')}
              style={({ pressed }) => [styles.heroLink, pressed && styles.pressed]}
            >
              <Text style={styles.heroLinkText}>Ver análise mensal ›</Text>
            </Pressable>
          </View>

          <AnalyticsCard
            description="Últimos seis meses · o mês atual pode estar parcial"
            title="Evolução dos gastos"
          >
            <MonthlyBarChart points={data.evolution} />
          </AnalyticsCard>

          <AnalyticsCard
            actionLabel="Ver todas as categorias"
            onAction={() => router.push('/analytics/categories')}
            title="Categorias que mais pesam"
          >
            <PreviewRows
              rows={data.categories.categories.slice(0, 3).map((category) => ({
                id: category.categoryId ?? 'uncategorized',
                label: category.categoryName,
                value: formatCurrencyFromCents(category.totalPriceCents),
              }))}
            />
          </AnalyticsCard>

          <AnalyticsCard
            actionLabel="Ver ranking de produtos"
            onAction={() => router.push('/analytics/products')}
            title="Produtos com maior gasto"
          >
            <PreviewRows
              onPress={(id) =>
                router.push({ pathname: '/analytics/products/[id]', params: { id } })
              }
              rows={data.products.products.slice(0, 3).map((product) => ({
                id: product.productId,
                label: product.productName,
                description: product.productBrand ?? undefined,
                value: formatCurrencyFromCents(product.totalPriceCents),
              }))}
            />
          </AnalyticsCard>

          <AnalyticsCard
            actionLabel="Ver variações de preço"
            onAction={() => router.push('/analytics/variations')}
            title="Variações recentes de preço"
          >
            {data.variations.increases.length + data.variations.decreases.length === 0 ? (
              <Text style={styles.insufficientText}>
                Ainda não há dois preços comparáveis para mostrar tendências.
              </Text>
            ) : (
              <PreviewRows
                onPress={(id) =>
                  router.push({ pathname: '/analytics/products/[id]', params: { id } })
                }
                rows={[...data.variations.increases, ...data.variations.decreases]
                  .slice(0, 3)
                  .map((variation) => ({
                    id: variation.productId,
                    label: variation.productName,
                    description: `${formatNormalizedPrice(
                      variation.previousPriceCents,
                      variation.unit,
                    )} → ${formatNormalizedPrice(variation.currentPriceCents, variation.unit)}`,
                    value: formatPercentageTenths(variation.percentageTenths),
                    tone:
                      variation.percentageTenths > 0 ? ('danger' as const) : ('success' as const),
                  }))}
              />
            )}
          </AnalyticsCard>

          <AppButton onPress={() => router.push('/purchases/create')} title="Registrar compra" />
        </ScrollView>
      ) : null}

      {error ? (
        <View style={styles.feedback}>
          <FeedbackToast message={error} tone="danger" />
        </View>
      ) : null}
    </Screen>
  );
}

type PreviewRow = {
  id: string;
  label: string;
  description?: string;
  value: string;
  tone?: 'success' | 'danger';
};

function PreviewRows({ rows, onPress }: { rows: PreviewRow[]; onPress?: (id: string) => void }) {
  if (rows.length === 0)
    return <Text style={styles.insufficientText}>Sem dados neste período.</Text>;
  return (
    <View style={styles.rows}>
      {rows.map((row, index) => {
        const content = (
          <>
            <Text style={styles.position}>{index + 1}</Text>
            <View style={styles.rowCopy}>
              <Text numberOfLines={1} style={styles.rowLabel}>
                {row.label}
              </Text>
              {row.description ? (
                <Text numberOfLines={1} style={styles.rowDescription}>
                  {row.description}
                </Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.rowValue,
                row.tone === 'success' && styles.success,
                row.tone === 'danger' && styles.danger,
              ]}
            >
              {row.value}
            </Text>
          </>
        );
        return onPress ? (
          <Pressable
            accessibilityRole="button"
            key={row.id}
            onPress={() => onPress(row.id)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            {content}
          </Pressable>
        ) : (
          <View key={row.id} style={styles.row}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

function monthlySummaryLabel(overview: MonthlySpendingOverview): string {
  return `${formatMonth(overview.period.month)}. Gasto acumulado: ${formatCurrencyFromCents(
    overview.totalPriceCents,
  )}. ${overview.completedPurchaseCount} compras concluídas. ${formatComparison(
    overview.comparisonState,
    overview.differenceCents,
    overview.percentageTenths,
  )}.`;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  brandLogo: { width: 200, height: 58 },
  period: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContent: { flex: 1, justifyContent: 'center', gap: spacing.xl, padding: spacing.lg },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
  },
  heroEyebrow: { ...typography.caption, color: '#DBEAFE', fontWeight: '800' },
  heroValue: { ...typography.display, color: colors.onPrimary, fontWeight: '900' },
  heroDetail: { ...typography.bodySmall, color: colors.onPrimary },
  comparisonPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.full,
  },
  comparisonText: { ...typography.caption, color: colors.onPrimary, fontWeight: '700' },
  heroLink: { alignSelf: 'flex-start', paddingTop: spacing.xs },
  heroLinkText: { ...typography.bodySmall, color: colors.onPrimary, fontWeight: '800' },
  rows: { gap: spacing.xs },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  position: { ...typography.caption, width: 20, color: colors.textSecondary, fontWeight: '800' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '700' },
  rowDescription: { ...typography.caption, color: colors.textSecondary },
  rowValue: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '800' },
  success: { color: colors.success },
  danger: { color: colors.danger },
  insufficientText: { ...typography.bodySmall, color: colors.textSecondary },
  pressed: { opacity: 0.65 },
  feedback: { padding: spacing.lg },
});
