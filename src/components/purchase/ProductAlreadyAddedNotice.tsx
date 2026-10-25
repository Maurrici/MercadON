import { AppButton } from '@/components/AppButton';
import type { ProductCommercializationType } from '@/domain/enums/ProductCommercializationType';
import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

export type ProductAlreadyAddedNoticeProps = {
  productName: string;
  commercializationType: ProductCommercializationType;
  onEdit: () => void;
  onIncrement?: () => void;
  incrementing?: boolean;
};

export function ProductAlreadyAddedNotice({
  productName,
  commercializationType,
  onEdit,
  onIncrement,
  incrementing = false,
}: ProductAlreadyAddedNoticeProps) {
  const canIncrement = commercializationType === 'FIXED' && onIncrement;

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Produto já está na compra</Text>
        <Text style={styles.description}>
          {canIncrement
            ? `${productName} já foi adicionado. Some uma unidade mantendo o preço ou edite os valores.`
            : `${productName} já foi adicionado. Edite a quantidade medida e o preço total do item.`}
        </Text>
      </View>
      <View style={styles.actions}>
        {canIncrement ? (
          <View style={styles.action}>
            <AppButton loading={incrementing} title="+1 unidade" onPress={onIncrement} />
          </View>
        ) : null}
        <View style={styles.action}>
          <AppButton title="Editar item" tone="secondary" onPress={onEdit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    backgroundColor: colors.warningBackground,
  },
  content: { gap: spacing.xs },
  title: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  description: { ...typography.bodySmall, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
