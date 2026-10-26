import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { getMeasurementUnitLabel, type MeasurementUnit } from '@/domain/enums/MeasurementUnit';
import type { ProductCommercializationType } from '@/domain/enums/ProductCommercializationType';
import type { PriceComparison } from '@/services/purchase-item.service';
import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PriceComparisonIndicator } from './PriceComparisonIndicator';

export type PurchaseItemFormValues = {
  quantity: string;
  price: string;
};

export type PurchaseItemFormProps = {
  commercializationType: ProductCommercializationType;
  measurementUnit: MeasurementUnit;
  values: PurchaseItemFormValues;
  onChangeField: <Key extends keyof PurchaseItemFormValues>(
    field: Key,
    value: PurchaseItemFormValues[Key],
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  errors?: Partial<Record<keyof PurchaseItemFormValues, string>>;
  comparison?: PriceComparison | null;
  totalPriceCents?: number | null;
  loading?: boolean;
};

export function PurchaseItemForm({
  commercializationType,
  measurementUnit,
  values,
  onChangeField,
  onSubmit,
  onCancel,
  submitLabel,
  errors = {},
  comparison,
  totalPriceCents,
  loading = false,
}: PurchaseItemFormProps) {
  const fixed = commercializationType === 'FIXED';
  const unitLabel = getMeasurementUnitLabel(measurementUnit);

  return (
    <View style={styles.form}>
      <AppInput
        required
        error={errors.quantity}
        inputMode={fixed ? 'numeric' : 'decimal'}
        keyboardType={fixed ? 'number-pad' : 'decimal-pad'}
        label={fixed ? 'Quantidade de unidades' : `Quantidade (${unitLabel})`}
        maxLength={18}
        onChangeText={(value) => onChangeField('quantity', value)}
        placeholder={fixed ? 'Ex.: 2' : 'Ex.: 1,275'}
        returnKeyType="next"
        value={values.quantity}
      />
      <AppInput
        required
        error={errors.price}
        inputMode="decimal"
        keyboardType="decimal-pad"
        label={fixed ? 'Preço por unidade' : 'Preço total pago'}
        maxLength={18}
        onChangeText={(value) => onChangeField('price', value)}
        placeholder="R$ 0,00"
        returnKeyType="done"
        value={values.price}
      />

      <Text style={styles.hint}>
        {fixed
          ? 'Informe quantos pacotes ou unidades comerciais foram comprados.'
          : `Informe a quantidade efetivamente adquirida em ${unitLabel} e o valor total pago.`}
      </Text>

      {comparison || (totalPriceCents !== null && totalPriceCents !== undefined) ? (
        <View style={styles.summary}>
          {totalPriceCents !== null && totalPriceCents !== undefined ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrencyFromCents(totalPriceCents)}</Text>
            </View>
          ) : null}
          {comparison ? <PriceComparisonIndicator comparison={comparison} /> : null}
        </View>
      ) : null}

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
  hint: { ...typography.caption, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  summary: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { ...typography.bodySmall, color: colors.textSecondary },
  summaryValue: { ...typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  actions: { gap: spacing.xs, marginTop: spacing.lg },
  cancel: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cancelPressed: { backgroundColor: colors.primarySoft },
  cancelLabel: { ...typography.bodySmall, fontSize: 15, fontWeight: '600', color: colors.primary },
});
