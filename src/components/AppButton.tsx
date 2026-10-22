import { colors, radius, spacing, typography } from '@/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

export type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
};

export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  tone = 'primary',
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'secondary' && styles.secondary,
        tone === 'danger' && styles.danger,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone === 'secondary' ? colors.primary : colors.onPrimary} />
      ) : (
        <Text
          style={[
            styles.label,
            tone === 'secondary' && styles.secondaryLabel,
            isDisabled && styles.disabledLabel,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pressed: {
    opacity: 0.82,
  },

  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  danger: {
    backgroundColor: colors.danger,
  },

  disabled: {
    backgroundColor: colors.border,
  },

  label: {
    ...typography.body,
    color: colors.onPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },

  secondaryLabel: {
    color: colors.textPrimary,
  },

  disabledLabel: {
    color: colors.textSecondary,
  },
});
