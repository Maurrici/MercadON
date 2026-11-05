import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SpendingRowItem = {
  id: string;
  label: string;
  description?: string;
  valueCents: number;
};

type SpendingRowsProps = {
  items: SpendingRowItem[];
  onPress?: (item: SpendingRowItem) => void;
};

export function SpendingRows({ items, onPress }: SpendingRowsProps) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const content = (
          <>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.copy}>
              <Text numberOfLines={2} style={styles.label}>
                {item.label}
              </Text>
              {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
            </View>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
              {formatCurrencyFromCents(item.valueCents)}
            </Text>
          </>
        );
        return onPress ? (
          <Pressable
            accessibilityLabel={`${item.label}, ${formatCurrencyFromCents(item.valueCents)}`}
            accessibilityRole="button"
            key={item.id}
            onPress={() => onPress(item)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            {content}
          </Pressable>
        ) : (
          <View accessible key={item.id} style={styles.row}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: { ...typography.caption, width: 22, color: colors.textSecondary, fontWeight: '800' },
  copy: { flex: 1, minWidth: 0 },
  label: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '700' },
  description: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.bodySmall, maxWidth: '42%', color: colors.textPrimary, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
