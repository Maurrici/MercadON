import { AppButton } from '@/components/AppButton';
import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PurchaseTotalBarProps = {
  totalPriceCents: number;
  onAddProduct: () => void;
  onFinish: () => void;
  canFinish?: boolean;
  finishing?: boolean;
};

export function PurchaseTotalBar({
  totalPriceCents,
  onAddProduct,
  onFinish,
  canFinish = true,
  finishing = false,
}: PurchaseTotalBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total da compra</Text>
        <Text accessibilityLiveRegion="polite" style={styles.totalValue}>
          {formatCurrencyFromCents(totalPriceCents)}
        </Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.secondaryAction}>
          <AppButton title="+ Adicionar produto" tone="secondary" onPress={onAddProduct} />
        </View>
        <View style={styles.primaryAction}>
          <AppButton
            disabled={!canFinish}
            loading={finishing}
            title="Finalizar"
            onPress={onFinish}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary },
  totalValue: { ...typography.title, fontWeight: '800', color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  secondaryAction: { flex: 1.25 },
  primaryAction: { flex: 1 },
});
