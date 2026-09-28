import { colors, radius, spacing, typography } from "@/theme";
import { Pressable, StyleSheet, Text } from "react-native";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false
} : PrimaryButtonProps) {
  return(
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Text
        style={[
          styles.label,
          disabled && styles.disabledLabel
        ]}
      >
        {title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pressed: {
    backgroundColor: colors.primaryStrong,
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

  disabledLabel: {
    color: colors.textSecondary,
  },
});