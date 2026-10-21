import { BottomSheet } from '@/components/BottomSheet';
import { colors, radius, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type OptionPickerItem<Value extends string = string> = { label: string; value: Value };

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
    <BottomSheet visible={visible} title={title} onRequestClose={onRequestClose}>
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
              <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
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
    borderRadius: radius.lg,
  },
  selected: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.75 },
  label: { ...typography.body, flex: 1, color: colors.textPrimary },
  selectedLabel: { fontWeight: '600', color: colors.primary },
  check: { ...typography.body, fontWeight: '700', color: colors.primary },
});
