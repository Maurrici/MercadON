import { colors, radius, spacing, typography } from '@/theme';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AnalyticsCardProps = PropsWithChildren<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  trailing?: ReactNode;
}>;

export function AnalyticsCard({
  title,
  description,
  actionLabel,
  onAction,
  trailing,
  children,
}: AnalyticsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {trailing}
      </View>
      {children}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.action}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headingCopy: { flex: 1, gap: spacing.xs },
  title: { ...typography.body, color: colors.textPrimary, fontWeight: '800' },
  description: { ...typography.caption, color: colors.textSecondary },
  action: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
