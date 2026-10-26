import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { useCompletedPurchaseService } from '@/hooks/useCompletedPurchaseService';
import type { PurchaseSummary } from '@/domain/repositories/purchase.repository';
import { formatPurchaseDate } from '@/features/purchases/presentation';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PurchaseHistoryScreen() {
  const router = useRouter();
  const completedPurchaseService = useCompletedPurchaseService();
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      setPurchases(await completedPurchaseService.list());
      setError(null);
    } catch {
      setError('Não foi possível carregar as compras concluídas.');
    } finally {
      setLoading(false);
    }
  }, [completedPurchaseService]);

  useFocusEffect(
    useCallback(() => {
      void loadPurchases();
    }, [loadPurchases]),
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Compras concluídas</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : purchases.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            description="As compras finalizadas aparecerão aqui."
            icon="✓"
            title="Nenhuma compra concluída"
          />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={purchases}
          keyExtractor={(purchase) => purchase.id}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/purchases/history/[id]', params: { id: item.id } })
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardHeading}>
                <View style={styles.cardIdentity}>
                  <Text style={styles.marketName}>{item.marketName}</Text>
                  <Text style={styles.date}>{formatPurchaseDate(item.purchasedAt)}</Text>
                </View>
                <Text style={styles.total}>{formatCurrencyFromCents(item.totalPriceCents)}</Text>
              </View>
              <Text style={styles.itemCount}>
                {item.itemCount} {item.itemCount === 1 ? 'item' : 'itens'}
              </Text>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {error ? (
        <View style={styles.feedback}>
          <FeedbackToast message={error} tone="danger" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  backButton: { width: 43, minHeight: 48, justifyContent: 'center' },
  backIcon: { fontSize: 30, lineHeight: 36, color: colors.primary },
  title: { ...typography.title, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  list: { gap: spacing.sm, padding: spacing.lg },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  pressed: { backgroundColor: colors.primarySoft },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardIdentity: { flex: 1, gap: 2 },
  marketName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textSecondary },
  total: { ...typography.subtitle, fontWeight: '800', color: colors.textPrimary },
  itemCount: { ...typography.bodySmall, color: colors.textSecondary },
  feedback: { padding: spacing.lg },
});
