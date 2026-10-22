import { colors, radius, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MarketRowProps = {
  name: string;
  onPressActions: () => void;
};

export function MarketRow({ name, onPressActions }: MarketRowProps) {
  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <Pressable
        accessibilityLabel={`Ações de ${name}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPressActions}
        style={({ pressed }) => [styles.actions, pressed && styles.actionsPressed]}
      >
        <Text style={styles.actionsIcon}>⋮</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  name: {
    ...typography.body,
    flex: 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actions: {
    width: 40,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  actionsPressed: { backgroundColor: colors.primarySoft },
  actionsIcon: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
