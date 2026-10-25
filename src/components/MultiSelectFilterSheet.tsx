import { AppButton } from '@/components/AppButton';
import { BottomSheet } from '@/components/BottomSheet';
import { colors, radius, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterGroup = {
  key: string;
  title: string;
  options: readonly FilterOption[];
};

type MultiSelectFilterSheetProps = {
  visible: boolean;
  groups: readonly FilterGroup[];
  selectedValues: Readonly<Record<string, readonly string[]>>;
  onToggle: (groupKey: string, value: string) => void;
  onClear: () => void;
  onApply: () => void;
  onRequestClose: () => void;
};

export function MultiSelectFilterSheet({
  visible,
  groups,
  selectedValues,
  onToggle,
  onClear,
  onApply,
  onRequestClose,
}: MultiSelectFilterSheetProps) {
  const activeCount = Object.values(selectedValues).reduce(
    (total, values) => total + values.length,
    0,
  );

  return (
    <BottomSheet
      scrollable
      showCloseButton
      onRequestClose={onRequestClose}
      title="Filtros"
      visible={visible}
    >
      <View style={styles.content}>
        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.tickets}>
              {group.options.map((option) => {
                const selected = selectedValues[group.key]?.includes(option.value) ?? false;
                return (
                  <Pressable
                    accessibilityLabel={option.label}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    key={option.value}
                    onPress={() => onToggle(group.key, option.value)}
                    style={({ pressed }) => [
                      styles.ticket,
                      selected && styles.selectedTicket,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.ticketLabel, selected && styles.selectedTicketLabel]}>
                      {selected ? '✓ ' : ''}
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={activeCount === 0}
            onPress={onClear}
            style={({ pressed }) => [
              styles.clearButton,
              activeCount === 0 && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.clearLabel}>Limpar filtros</Text>
          </Pressable>
          <View style={styles.applyButton}>
            <AppButton
              onPress={onApply}
              title={activeCount > 0 ? `Aplicar filtros (${activeCount})` : 'Aplicar filtros'}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingBottom: spacing.sm },
  group: { gap: spacing.md },
  groupTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  tickets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ticket: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
  },
  selectedTicket: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  ticketLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary },
  selectedTicketLabel: { color: colors.primaryStrong },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  clearButton: { minHeight: 50, justifyContent: 'center', paddingHorizontal: spacing.sm },
  clearLabel: { ...typography.bodySmall, fontWeight: '700', color: colors.primary },
  applyButton: { flex: 1 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});
