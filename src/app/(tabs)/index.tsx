import { DashboardMetricCard } from '@/components/dashboard/DashboardMetricCard';
import { FeedbackToast } from '@/components/FeedbackToast';
import { Screen } from '@/components/Screen';
import type { DashboardMetrics } from '@/domain/repositories/dashboard.repository';
import { useDashboardService } from '@/hooks/useDashboardService';
import { colors, spacing, typography } from '@/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

const EMPTY_METRICS: DashboardMetrics = {
  completedPurchases: 0,
  products: 0,
  markets: 0,
};

export default function HomeScreen() {
  const dashboardService = useDashboardService();
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      setMetrics(await dashboardService.getMetrics());
      setError(null);
    } catch {
      setError('Não foi possível carregar o resumo do aplicativo.');
    } finally {
      setLoading(false);
    }
  }, [dashboardService]);

  useFocusEffect(
    useCallback(() => {
      void loadMetrics();
    }, [loadMetrics]),
  );

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>MercadON</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introduction}>
          <Text style={styles.heading}>Visão geral</Text>
          <Text style={styles.description}>Acompanhe os principais números do seu MercadON.</Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <View style={styles.cards}>
            <DashboardMetricCard
              icon="✓"
              label="Compras realizadas"
              value={metrics.completedPurchases}
            />
            <DashboardMetricCard icon="□" label="Produtos cadastrados" value={metrics.products} />
            <DashboardMetricCard icon="⌂" label="Mercados cadastrados" value={metrics.markets} />
          </View>
        )}

        {error ? <FeedbackToast message={error} tone="danger" /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing.lg, paddingTop: 0 },
  header: {
    minHeight: 78,
    justifyContent: 'center',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
  },
  title: { ...typography.title, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  content: { flexGrow: 1, gap: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  introduction: { gap: spacing.xs, marginHorizontal: spacing.xs },
  heading: { ...typography.title, fontWeight: '800', color: colors.textPrimary },
  description: { ...typography.body, color: colors.textSecondary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
