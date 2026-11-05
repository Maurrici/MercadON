import type { MonthKey } from '@/domain/analytics-period';
import { formatMonth, shiftMonth } from '@/features/analytics/presentation';
import { colors, radius, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type MonthSelectorProps = {
  value: MonthKey;
  maximum: MonthKey;
  onChange: (month: MonthKey) => void;
};

export function MonthSelector({ value, maximum, onChange }: MonthSelectorProps) {
  const next = shiftMonth(value, 1);
  const canGoForward = next <= maximum;

  return (
    <View
      accessibilityLabel={`Período selecionado: ${formatMonth(value)}`}
      style={styles.container}
    >
      <Pressable
        accessibilityLabel="Mês anterior"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onChange(shiftMonth(value, -1))}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.icon}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{formatMonth(value)}</Text>
      <Pressable
        accessibilityLabel="Próximo mês"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canGoForward }}
        disabled={!canGoForward}
        hitSlop={8}
        onPress={() => onChange(next)}
        style={({ pressed }) => [
          styles.button,
          pressed && canGoForward && styles.pressed,
          !canGoForward && styles.disabled,
        ]}
      >
        <Text style={styles.icon}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
  },
  button: {
    width: 42,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  pressed: { backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.35 },
  icon: { fontSize: 28, lineHeight: 30, color: colors.primary },
  label: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '700' },
});
