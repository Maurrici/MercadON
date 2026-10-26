import { colors, radius, typography } from '@/theme';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type FilterButtonProps = {
  activeCount: number;
  onPress: () => void;
};

export function FilterButton({ activeCount, onPress }: FilterButtonProps) {
  const active = activeCount > 0;

  return (
    <Pressable
      accessibilityLabel={active ? `Filtrar, ${activeCount} ativos` : 'Filtrar'}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.activeButton,
        pressed && styles.pressed,
      ]}
    >
      <SymbolView
        fallback={<Text style={[styles.fallbackIcon, active && styles.activeIcon]}>≡</Text>}
        name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }}
        size={23}
        tintColor={active ? colors.onPrimary : colors.primary}
      />
      {active ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{activeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  activeButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.78 },
  fallbackIcon: { ...typography.subtitle, color: colors.primary, transform: [{ rotate: '90deg' }] },
  activeIcon: { color: colors.onPrimary },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: colors.primaryStrong,
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: radius.full,
  },
  badgeLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});
