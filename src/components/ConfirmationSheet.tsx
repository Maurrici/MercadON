import { BottomSheet } from '@/components/BottomSheet';
import { AppButton } from '@/components/AppButton';
import { colors, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

type ConfirmationSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onRequestClose: () => void;
  tone?: 'primary' | 'danger';
  loading?: boolean;
};

export function ConfirmationSheet({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onRequestClose,
  tone = 'primary',
  loading = false,
}: ConfirmationSheetProps) {
  return (
    <BottomSheet visible={visible} onRequestClose={onRequestClose}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <AppButton loading={loading} onPress={onConfirm} title={confirmLabel} tone={tone} />
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={onRequestClose}
        style={styles.cancel}
      >
        <Text style={styles.cancelLabel}>Cancelar</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: spacing.xs,
  },
  message: {
    ...typography.bodySmall,
    fontSize: 15,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
    marginTop: 22,
    marginBottom: 48,
  },
  cancel: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  cancelLabel: { ...typography.bodySmall, fontSize: 15, fontWeight: '600', color: colors.primary },
});
