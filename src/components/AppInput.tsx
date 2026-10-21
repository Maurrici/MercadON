import { colors, spacing, typography } from '@/theme';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type AppInputProps = Pick<
  TextInputProps,
  'autoCapitalize' | 'autoCorrect' | 'inputMode' | 'keyboardType' | 'maxLength' | 'returnKeyType'
> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
};

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  disabled = false,
  required = false,
  error,
  ...inputProps
}: AppInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
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
          error && styles.inputError,
        ]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
  },

  label: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,

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

  inputError: {
    borderColor: colors.danger,
  },

  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
