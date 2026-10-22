import { BottomSheet } from '@/components/BottomSheet';
import { colors, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MarketActionSheetProps = {
  visible: boolean;
  marketName: string;
  onEdit: () => void;
  onDelete: () => void;
  onRequestClose: () => void;
};

export function MarketActionSheet({
  visible,
  marketName,
  onEdit,
  onDelete,
  onRequestClose,
}: MarketActionSheetProps) {
  return (
    <BottomSheet
      showCloseButton
      onRequestClose={onRequestClose}
      title={marketName}
      visible={visible}
    >
      <View style={styles.actions}>
        <ActionRow icon="✎" label="Editar mercado" onPress={onEdit} />
        <ActionRow danger icon="×" label="Excluir mercado" onPress={onDelete} />
      </View>
    </BottomSheet>
  );
}

type ActionRowProps = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function ActionRow({ icon, label, onPress, danger = false }: ActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        danger && styles.dividedAction,
        pressed && styles.actionPressed,
      ]}
    >
      <Text style={[styles.actionIcon, danger && styles.danger]}>{icon}</Text>
      <Text style={[styles.actionLabel, danger && styles.danger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 20 },
  action: {
    minHeight: 73,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  dividedAction: { borderTopWidth: 1, borderTopColor: colors.border },
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
