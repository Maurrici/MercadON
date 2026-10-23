import { colors, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SelectFieldProps = {
  label: string;
  value?: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
};

export function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  error,
  required = false,
}: SelectFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{required ? `${label} *` : label}</Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: false }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.control,
          error && styles.controlError,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <Text numberOfLines={1} style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text aria-hidden style={styles.chevron}>
          ⌄
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { ...typography.caption, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  control: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
  },
  controlError: { borderColor: colors.danger },
  pressed: { borderColor: colors.primary },
  disabled: { backgroundColor: colors.background, opacity: 0.7 },
  value: { ...typography.bodySmall, flex: 1, color: colors.textPrimary },
  placeholder: { color: colors.textSecondary },
  chevron: { fontSize: 20, lineHeight: 24, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
});
