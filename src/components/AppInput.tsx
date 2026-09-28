import { colors, radius, spacing, typography } from '@/theme';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, } from 'react-native';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  disabled = false,
}: AppInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && styles.focused,
          disabled && styles.disabled,
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,

    paddingHorizontal: spacing.lg,

    ...typography.body,
    color: colors.textPrimary,
  },

  focused: {
    borderColor: colors.primary,
  },

  disabled: {
    backgroundColor: colors.background,
    color: colors.textSecondary,
  },
});