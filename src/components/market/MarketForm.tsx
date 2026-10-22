import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { colors, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MarketFormValues = {
  name: string;
};

export type MarketFormProps = {
  values: MarketFormValues;
  onChangeField: <Key extends keyof MarketFormValues>(
    field: Key,
    value: MarketFormValues[Key],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  hint: string;
  errors?: Partial<Record<keyof MarketFormValues, string>>;
  loading?: boolean;
};

export function MarketForm({
  values,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  hint,
  errors = {},
  loading = false,
}: MarketFormProps) {
  return (
    <View style={styles.form}>
      <AppInput
        required
        autoCapitalize="words"
        autoCorrect={false}
        error={errors.name}
        label="Nome"
        onChangeText={(value) => onChangeField('name', value)}
        placeholder="Ex.: Assaí Mister Hull"
        returnKeyType="done"
        value={values.name}
      />

      <Text style={styles.hint}>{hint}</Text>

      <View style={styles.actions}>
        <AppButton loading={loading} onPress={onSubmit} title={submitLabel} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          onPress={onCancel}
          style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
        >
          <Text style={styles.cancelLabel}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  hint: { ...typography.caption, fontSize: 13, color: colors.textSecondary },
  actions: { gap: spacing.xs, marginTop: 25 },
  cancel: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  cancelPressed: { backgroundColor: colors.primarySoft },
  cancelLabel: {
    ...typography.bodySmall,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
