import { colors, radius, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ProductRowProps = {
  name: string;
  details?: string | null;
  onPress?: () => void;
  onPressActions?: () => void;
};

export function ProductRow({ name, details, onPress, onPressActions }: ProductRowProps) {
  const content = (
    <>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
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
          style={({ pressed }) => [styles.actions, pressed && styles.actionsPressed]}
        >
          <Text style={styles.actionsIcon}>⋮</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.container}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 14,
    paddingRight: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  content: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  name: { ...typography.bodySmall, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  details: { ...typography.caption, color: colors.textSecondary },
  actions: {
    width: 40,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  actionsPressed: { backgroundColor: colors.primarySoft },
  rowPressed: { backgroundColor: colors.primarySoft },
  actionsIcon: { fontSize: 25, lineHeight: 30, fontWeight: '600', color: colors.textSecondary },
});
