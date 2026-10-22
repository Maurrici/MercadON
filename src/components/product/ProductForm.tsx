import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { SelectField } from '@/components/SelectField';
import { colors, spacing, typography } from '@/theme';
import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ProductFormValues = {
  name: string;
  brand: string;
  packageQuantity: string;
  packageUnit: MeasurementUnit | null;
  categoryId: string | null;
};

export type ProductFormProps = {
  values: ProductFormValues;
  categoryLabel?: string | null;
  unitLabel?: string | null;
  onChangeField: <Key extends keyof ProductFormValues>(
    field: Key,
    value: ProductFormValues[Key],
  ) => void;
  onSelectUnit: () => void;
  onSelectCategory: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  errors?: Partial<Record<keyof ProductFormValues, string>>;
  loading?: boolean;
};

export function ProductForm({
  values,
  categoryLabel,
  unitLabel,
  onChangeField,
  onSelectUnit,
  onSelectCategory,
  onSubmit,
  onCancel,
  submitLabel,
  errors = {},
  loading = false,
}: ProductFormProps) {
  return (
    <View style={styles.form}>
      <AppInput
        required
        label="Nome"
        placeholder="Ex.: Café"
        value={values.name}
        error={errors.name}
        onChangeText={(value) => onChangeField('name', value)}
        returnKeyType="next"
      />
      <AppInput
        label="Marca"
        placeholder="Ex.: Pilão"
        value={values.brand}
        error={errors.brand}
        onChangeText={(value) => onChangeField('brand', value)}
        returnKeyType="next"
      />
      <View style={styles.packageRow}>
        <View style={styles.packageQuantity}>
          <AppInput
            inputMode="decimal"
            label="Quantidade da embalagem"
            placeholder="Ex.: 500"
            value={values.packageQuantity}
            error={errors.packageQuantity}
            onChangeText={(value) => onChangeField('packageQuantity', value)}
          />
        </View>
        <View style={styles.packageUnit}>
          <SelectField
            label="Unidade"
            placeholder="Selecionar"
            value={unitLabel}
            error={errors.packageUnit}
            onPress={onSelectUnit}
          />
        </View>
      </View>
      <SelectField
        label="Categoria"
        placeholder="Selecionar categoria"
        value={categoryLabel}
        error={errors.categoryId}
        onPress={onSelectCategory}
      />
      <Text style={styles.hint}>Apenas o nome é obrigatório</Text>
      <View style={styles.actions}>
        <AppButton loading={loading} onPress={onSubmit} title={submitLabel} />
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={onCancel}
          style={styles.cancel}
        >
          <Text style={styles.cancelLabel}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  packageRow: { flexDirection: 'row', gap: 11, marginTop: spacing.sm },
  packageQuantity: { flex: 1 },
  packageUnit: { flex: 1 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xl },
  actions: { gap: spacing.xs, marginTop: 44 },
  cancel: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { ...typography.bodySmall, fontSize: 15, fontWeight: '600', color: colors.primary },
});
