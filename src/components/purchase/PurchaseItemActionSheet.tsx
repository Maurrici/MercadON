import { BottomSheet } from '@/components/BottomSheet';
import { colors, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type PurchaseItemActionSheetProps = {
  visible: boolean;
  productName: string;
  onEdit: () => void;
  onRemove: () => void;
  onRequestClose: () => void;
};

export function PurchaseItemActionSheet({
  visible,
  productName,
  onEdit,
  onRemove,
  onRequestClose,
}: PurchaseItemActionSheetProps) {
  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.heading}>
        <Text style={styles.title}>{productName}</Text>
        <Text style={styles.description}>O que deseja fazer com este item?</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>Editar item</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onRemove}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={[styles.actionLabel, styles.removeLabel]}>Remover da compra</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs, marginHorizontal: spacing.xs },
  title: { ...typography.title, fontSize: 21, fontWeight: '700', color: colors.textPrimary },
  description: { ...typography.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.xs, marginTop: spacing.xl },
  action: { minHeight: 52, justifyContent: 'center', paddingHorizontal: spacing.lg },
  pressed: { backgroundColor: colors.primarySoft },
  actionLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  removeLabel: { color: colors.danger },
});
