import { colors, spacing, typography } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AccessCardProps = {
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
};

export function AccessCard({
  title,
  description,
  icon,
  onPress,
  disabled = false,
  selected = false,
}: AccessCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.iconContainer, selected && styles.selectedIcon]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  pressed: { backgroundColor: colors.primarySoft },
  selected: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary },
  disabled: { opacity: 0.55 },
  iconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
  },
  selectedIcon: { backgroundColor: colors.surface },
  icon: { fontSize: 24, lineHeight: 30, fontWeight: '600', color: colors.primary },
  copy: { flex: 1, gap: spacing.xs },
  title: { ...typography.body, fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  description: { ...typography.caption, fontSize: 13, color: colors.textSecondary },
});
