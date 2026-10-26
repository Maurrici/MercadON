import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { Screen } from '@/components/Screen';
import { toDraftSummary, type DraftSummary } from '@/features/purchases/presentation';
import { useMarketService } from '@/hooks/useMarketService';
import { usePurchaseService } from '@/hooks/usePurchaseService';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function PurchasesScreen() {
  const router = useRouter();
  const purchaseService = usePurchaseService();
  const marketService = useMarketService();
  const [draft, setDraft] = useState<DraftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDraft = useCallback(async () => {
    setLoading(true);
    try {
      const [details, markets] = await Promise.all([
        purchaseService.getDraft(),
        marketService.listMarkets(),
      ]);
      setDraft(details ? toDraftSummary(details, markets) : null);
      setError(null);
    } catch {
      setError('Não foi possível carregar a compra em andamento.');
    } finally {
      setLoading(false);
    }
  }, [marketService, purchaseService]);

  useFocusEffect(
    useCallback(() => {
      void loadDraft();
    }, [loadDraft]),
  );

  function openDraft() {
    if (!draft) return;
    router.push({ pathname: '/purchases/[id]', params: { id: draft.purchase.id } });
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Compras</Text>
        <Text style={styles.description}>Acompanhe sua compra enquanto escolhe os produtos.</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : draft ? (
        <View style={styles.activeContent}>
          <View style={styles.draftCard}>
            <View style={styles.draftHeading}>
              <View style={styles.iconContainer}>
                <Text aria-hidden style={styles.icon}>
                  ✓
                </Text>
              </View>
              <View style={styles.draftIdentity}>
                <Text style={styles.draftTitle}>Compra em andamento</Text>
                <Text numberOfLines={1} style={styles.marketName}>
                  {draft.marketName}
                </Text>
              </View>
            </View>
            <View style={styles.metrics}>
              <View>
                <Text style={styles.metricLabel}>Itens</Text>
                <Text style={styles.metricValue}>{draft.itemCount}</Text>
              </View>
              <View style={styles.totalMetric}>
                <Text style={styles.metricLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrencyFromCents(draft.totalPriceCents)}
                </Text>
              </View>
            </View>
          </View>
          <AppButton onPress={openDraft} title="Continuar compra" />
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <EmptyState
            description="Escolha um mercado para começar e adicione os produtos conforme compra."
            icon="✓"
            title="Nenhuma compra em andamento"
          />
          <AppButton title="Iniciar compra" onPress={() => router.push('/purchases/create')} />
        </View>
      )}

      {error ? <FeedbackToast message={error} tone="danger" /> : null}
      <AppButton
        onPress={() => router.push('/purchases/history')}
        title="Ver compras concluídas"
        tone="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing.lg, paddingTop: 0 },
  header: {
    gap: spacing.xs,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  title: { ...typography.title, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  description: { ...typography.bodySmall, color: colors.textSecondary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContent: { flex: 1, justifyContent: 'center', gap: 56, paddingBottom: 72 },
  activeContent: { flex: 1, justifyContent: 'center', gap: spacing.xl, paddingBottom: 60 },
  draftCard: {
    gap: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  draftHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  icon: { fontSize: 22, fontWeight: '700', color: colors.primary },
  draftIdentity: { flex: 1, gap: 2 },
  draftTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  marketName: { ...typography.bodySmall, color: colors.textSecondary },
  metrics: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  totalMetric: { alignItems: 'flex-end' },
  metricLabel: { ...typography.caption, color: colors.textSecondary },
  metricValue: { ...typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  totalValue: { ...typography.title, fontWeight: '800', color: colors.textPrimary },
});
