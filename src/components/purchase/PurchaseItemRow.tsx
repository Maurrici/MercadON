import type { PriceComparison } from '@/services/purchase-item.service';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PriceComparisonIndicator } from './PriceComparisonIndicator';

export type PurchaseItemRowProps = {
  name: string;
  details?: string | null;
  quantityLabel: string;
  priceLabel: string;
  totalPriceCents: number;
  comparison?: PriceComparison | null;
  highlighted?: boolean;
  onPress?: () => void;
  onPressActions?: () => void;
};

export function PurchaseItemRow({
  name,
  details,
  quantityLabel,
  priceLabel,
  totalPriceCents,
  comparison,
  highlighted = false,
  onPress,
  onPressActions,
}: PurchaseItemRowProps) {
  const content = (
    <>
      <View style={styles.heading}>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.name}>
              {name}
            </Text>
            {highlighted ? <Text style={styles.highlightLabel}>Adicionado agora</Text> : null}
          </View>
          {details ? (
            <Text numberOfLines={1} style={styles.details}>
              {details}
            </Text>
          ) : null}
        </View>
        {onPressActions ? (
          <Pressable
            accessibilityLabel={`Ações de ${name}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onPressActions}
            style={({ pressed }) => [styles.actions, pressed && styles.pressed]}
          >
            <Text style={styles.actionsIcon}>⋮</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceDetails}>
          <Text style={styles.quantity}>{quantityLabel}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.unitPrice}>{priceLabel}</Text>
        </View>
        <Text
          accessibilityLabel={`Subtotal ${formatCurrencyFromCents(totalPriceCents)}`}
          style={styles.total}
        >
          {formatCurrencyFromCents(totalPriceCents)}
        </Text>
      </View>

      {comparison ? <PriceComparisonIndicator compact comparison={comparison} /> : null}
    </>
  );

  const containerStyle = [styles.container, highlighted && styles.highlighted];
  if (!onPress) return <View style={containerStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityHint="Abre a edição do item"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  highlighted: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.78 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  identity: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: {
    ...typography.bodySmall,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  highlightLabel: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.surface,
  },
  details: { ...typography.caption, color: colors.textSecondary },
  actions: {
    width: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  actionsIcon: { fontSize: 24, lineHeight: 28, color: colors.textSecondary },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  priceDetails: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  quantity: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
  separator: { ...typography.bodySmall, color: colors.textSecondary },
  unitPrice: { ...typography.bodySmall, color: colors.textSecondary },
  total: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
});
