import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PurchaseTotalBarProps = {
  totalPriceCents: number;
  onFinish: () => void;
  canFinish?: boolean;
  finishing?: boolean;
};

export function PurchaseTotalBar({
  totalPriceCents,
  onFinish,
  canFinish = true,
  finishing = false,
}: PurchaseTotalBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.totalRow}>
        <View style={styles.totalGroup}>
          <Text style={styles.totalLabel}>Total da compra</Text>
          <Text accessibilityLiveRegion="polite" style={styles.totalValue}>
            {formatCurrencyFromCents(totalPriceCents)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Finalizar compra"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canFinish, busy: finishing }}
          disabled={!canFinish || finishing}
          onPress={onFinish}
          style={({ pressed }) => [
            styles.finishButton,
            pressed && styles.pressed,
            (!canFinish || finishing) && styles.disabled,
          ]}
        >
          {finishing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.finishLabel}>Finalizar ›</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalGroup: { gap: 2 },
  totalLabel: { ...typography.caption, fontSize: 13, color: colors.textSecondary },
  totalValue: { ...typography.title, fontSize: 27, fontWeight: '800', color: colors.textPrimary },
  finishButton: {
    minWidth: 96,
    minHeight: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: spacing.md,
  },
  finishLabel: { ...typography.bodySmall, fontSize: 15, fontWeight: '700', color: colors.primary },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
