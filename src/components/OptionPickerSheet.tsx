import { BottomSheet } from '@/components/BottomSheet';
import { colors, radius, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type OptionPickerItem<Value extends string = string> = {
  label: string;
  value: Value;
  description?: string;
};

type OptionPickerSheetProps<Value extends string> = {
  visible: boolean;
  title: string;
  options: readonly OptionPickerItem<Value>[];
  selectedValue?: Value | null;
  onSelect: (option: OptionPickerItem<Value>) => void;
  onRequestClose: () => void;
};

export function OptionPickerSheet<Value extends string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onRequestClose,
}: OptionPickerSheetProps<Value>) {
  return (
    <BottomSheet visible={visible} title={title} onRequestClose={onRequestClose} scrollable>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === selectedValue;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
                {option.description ? (
                  <Text style={styles.description}>{option.description}</Text>
                ) : null}
              </View>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm, paddingBottom: spacing.sm },
  option: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  selected: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.75 },
  optionContent: { flex: 1, gap: spacing.xs },
  label: { ...typography.body, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary },
  selectedLabel: { fontWeight: '600', color: colors.primary },
  check: { ...typography.body, fontWeight: '700', color: colors.primary },
});
