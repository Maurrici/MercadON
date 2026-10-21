import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

type FeedbackTone = 'success' | 'danger' | 'warning';
type FeedbackToastProps = { message: string; tone?: FeedbackTone };

const tones: Record<FeedbackTone, { icon: string; color: string; backgroundColor: string }> = {
  success: { icon: '✓', color: colors.success, backgroundColor: colors.successBackground },
  danger: { icon: '×', color: colors.danger, backgroundColor: colors.dangerBackground },
  warning: { icon: '!', color: colors.warning, backgroundColor: colors.warningBackground },
};

export function FeedbackToast({ message, tone = 'success' }: FeedbackToastProps) {
  const config = tones[tone];
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: config.backgroundColor }]}
    >
      <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  icon: { width: 24, fontSize: 19, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  message: { ...typography.caption, flex: 1, fontSize: 13, fontWeight: '500' },
});
