import { getMeasurementUnitLabel } from '@/domain/enums/MeasurementUnit';
import type { PriceComparison } from '@/services/purchase-item.service';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { StyleSheet, Text, View } from 'react-native';

export type PriceComparisonIndicatorProps = {
  comparison: PriceComparison;
  compact?: boolean;
};

export function PriceComparisonIndicator({
  comparison,
  compact = false,
}: PriceComparisonIndicatorProps) {
  const presentation = getPresentation(comparison);

  return (
    <View
      accessibilityLabel={presentation.accessibilityLabel}
      accessibilityRole="text"
      style={[
        styles.container,
        { backgroundColor: presentation.backgroundColor },
        compact && styles.compact,
      ]}
    >
      <Text aria-hidden style={[styles.label, { color: presentation.color }]}>
        {presentation.icon} {presentation.label}
      </Text>
    </View>
  );
}

function getPresentation(comparison: PriceComparison) {
  const unit = getMeasurementUnitLabel(comparison.unit);

  if (comparison.status === 'no_history') {
    return {
      icon: '—',
      label: 'Sem histórico de preço',
      accessibilityLabel: 'Sem histórico de preço para comparação',
      color: colors.textSecondary,
      backgroundColor: colors.background,
    };
  }

  if (comparison.status === 'same_price') {
    return {
      icon: '=',
      label: 'Mesmo preço',
      accessibilityLabel: `Mesmo preço por ${unit} da compra anterior`,
      color: colors.textSecondary,
      backgroundColor: colors.background,
    };
  }

  const difference = `${formatCurrencyFromCents(comparison.differenceCents ?? 0)}/${unit}`;
  if (comparison.status === 'cheaper') {
    return {
      icon: '↓',
      label: `Mais barato · ${difference}`,
      accessibilityLabel: `Mais barato que a compra anterior em ${difference}`,
      color: colors.priceDecrease,
      backgroundColor: colors.successBackground,
    };
  }

  return {
    icon: '↑',
    label: `Mais caro · ${difference}`,
    accessibilityLabel: `Mais caro que a compra anterior em ${difference}`,
    color: colors.priceIncrease,
    backgroundColor: colors.dangerBackground,
  };
}

const styles = StyleSheet.create({
  container: {
    minHeight: 28,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  compact: { minHeight: 24, paddingVertical: 2 },
  label: { ...typography.caption, fontWeight: '600' },
});
