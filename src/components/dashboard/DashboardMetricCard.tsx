import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

type DashboardMetricCardProps = {
  icon: string;
  label: string;
  value: number;
};

export function DashboardMetricCard({ icon, label, value }: DashboardMetricCardProps) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.card}>
      <View style={styles.iconContainer}>
        <Text aria-hidden style={styles.icon}>
          {icon}
        </Text>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.value}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    minHeight: 142,
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  icon: { fontSize: 20, lineHeight: 25, fontWeight: '700', color: colors.primary },
  value: { ...typography.display, fontWeight: '800', color: colors.textPrimary },
  label: { ...typography.bodySmall, color: colors.textSecondary },
});
