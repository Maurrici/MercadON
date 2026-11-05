import { colors, radius } from '@/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

export type PurchaseAddProductFabProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function PurchaseAddProductFab({ onPress, disabled = false }: PurchaseAddProductFabProps) {
  return (
    <Pressable
      accessibilityHint="Abre a seleção de produtos da compra"
      accessibilityLabel="Adicionar produto"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text aria-hidden style={styles.icon}>
        +
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: '#0D1C40',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  icon: {
    marginTop: -3,
    fontSize: 37,
    lineHeight: 42,
    fontWeight: '500',
    color: colors.onPrimary,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
});
