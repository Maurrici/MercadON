import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = { icon: string; title: string; description: string };

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text aria-hidden style={styles.icon}>
        {icon}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: spacing.lg },
  icon: { fontSize: 57, lineHeight: 72, color: colors.border, marginBottom: spacing.xxl },
  title: {
    ...typography.title,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  description: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
