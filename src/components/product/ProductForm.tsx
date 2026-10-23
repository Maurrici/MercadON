import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { SelectField } from '@/components/SelectField';
import { colors, spacing, typography } from '@/theme';
import type { MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import {
  PRODUCT_COMMERCIALIZATION_TYPE_METADATA,
  PRODUCT_COMMERCIALIZATION_TYPES,
  type ProductCommercializationType,
} from '@/domain/enums/ProductCommercializationType';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ProductFormValues = {
  name: string;
  brand: string;
  commercializationType: ProductCommercializationType;
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
        placeholder={values.commercializationType === 'FIXED' ? 'Ex.: Café' : 'Ex.: Carne bovina'}
        value={values.name}
        error={errors.name}
        onChangeText={(value) => onChangeField('name', value)}
        returnKeyType="next"
      />
      <AppInput
        label="Marca"
        placeholder={values.commercializationType === 'FIXED' ? 'Ex.: Pilão' : 'Opcional'}
        value={values.brand}
        error={errors.brand}
        onChangeText={(value) => onChangeField('brand', value)}
        returnKeyType="next"
      />
      <View style={styles.commercialization}>
        <Text style={styles.fieldLabel}>Forma de comercialização</Text>
        <View style={styles.commercializationOptions}>
          {PRODUCT_COMMERCIALIZATION_TYPES.map((type) => {
            const selected = values.commercializationType === type;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={type}
                onPress={() => onChangeField('commercializationType', type)}
                style={[styles.commercializationOption, selected && styles.selectedOption]}
              >
                <Text style={[styles.radio, selected && styles.selectedOptionLabel]}>
                  {selected ? '●' : '○'}
                </Text>
                <Text style={[styles.optionLabel, selected && styles.selectedOptionLabel]}>
                  {PRODUCT_COMMERCIALIZATION_TYPE_METADATA[type].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.description}>
          {PRODUCT_COMMERCIALIZATION_TYPE_METADATA[values.commercializationType].description}
        </Text>
      </View>
      {values.commercializationType === 'FIXED' ? (
        <View>
          <Text style={styles.fieldLabel}>Conteúdo da embalagem (opcional)</Text>
          <View style={styles.packageRow}>
            <View style={styles.packageQuantity}>
              <AppInput
                inputMode="decimal"
                label="Quantidade"
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
        </View>
      ) : (
        <SelectField
          required
          label="Unidade de medida"
          placeholder="Selecionar unidade"
          value={unitLabel}
          error={errors.packageUnit}
          onPress={onSelectUnit}
        />
      )}
      <SelectField
        label="Categoria"
        placeholder="Selecionar categoria"
        value={categoryLabel}
        error={errors.categoryId}
        onPress={onSelectCategory}
      />
      <Text style={styles.hint}>
        {values.commercializationType === 'FIXED'
          ? 'Somente o nome é obrigatório'
          : 'Nome e unidade são obrigatórios'}
      </Text>
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
  commercialization: { gap: spacing.sm },
  fieldLabel: { ...typography.caption, fontWeight: '600', color: colors.textPrimary },
  commercializationOptions: { flexDirection: 'row', gap: spacing.sm },
  commercializationOption: {
    minHeight: 52,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  selectedOption: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  optionLabel: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  selectedOptionLabel: { fontWeight: '600', color: colors.primary },
  description: { ...typography.caption, fontSize: 13, color: colors.textSecondary },
  packageRow: { flexDirection: 'row', gap: 11, marginTop: spacing.xs },
  packageQuantity: { flex: 1 },
  packageUnit: { flex: 1 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xl },
  actions: { gap: spacing.xs, marginTop: 44 },
  cancel: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { ...typography.bodySmall, fontSize: 15, fontWeight: '600', color: colors.primary },
});
