import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

type SearchInputProps = Pick<
  TextInputProps,
  'autoFocus' | 'editable' | 'onBlur' | 'onFocus' | 'onSubmitEditing' | 'returnKeyType'
> & {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  accessibilityLabel = 'Buscar',
  returnKeyType = 'search',
  ...inputProps
}: SearchInputProps) {
  return (
    <View style={styles.container}>
      <Text aria-hidden style={styles.icon}>
        ⌕
      </Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType={returnKeyType}
        selectionColor={colors.primary}
        style={styles.input}
        value={value}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  icon: { fontSize: 25, lineHeight: 30, color: colors.primary },
  input: {
    ...typography.bodySmall,
    flex: 1,
    minHeight: 44,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
