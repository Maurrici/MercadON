import { BottomSheet } from '@/components/BottomSheet';
import { colors, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ProductActionSheetProps = {
  visible: boolean;
  productName: string;
  productDetails?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onRequestClose: () => void;
};

export function ProductActionSheet({
  visible,
  productName,
  productDetails,
  onEdit,
  onDelete,
  onRequestClose,
}: ProductActionSheetProps) {
  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose}>
      <Text style={styles.title}>{productName}</Text>
      {productDetails ? <Text style={styles.details}>{productDetails}</Text> : null}
      <View style={styles.actions}>
        <ActionRow icon="✎" label="Editar produto" onPress={onEdit} />
        <ActionRow danger icon="×" label="Excluir produto" onPress={onDelete} />
      </View>
    </BottomSheet>
  );
}

type ActionRowProps = { icon: string; label: string; onPress: () => void; danger?: boolean };

function ActionRow({ icon, label, onPress, danger = false }: ActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <Text style={[styles.actionIcon, danger && styles.danger]}>{icon}</Text>
      <Text style={[styles.actionLabel, danger && styles.danger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: 6,
  },
  details: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 6,
    marginTop: spacing.xs,
  },
  actions: { marginTop: 28 },
  action: {
    minHeight: 73,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionPressed: { backgroundColor: colors.background },
  actionIcon: {
    width: 22,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.primary,
  },
  actionLabel: { ...typography.body, fontWeight: '500', color: colors.textPrimary },
  danger: { color: colors.danger },
});
