import { colors, radius, spacing } from '@/theme';
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.sm);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: {
          height: 58 + bottomInset,
          paddingTop: spacing.sm,
          paddingBottom: bottomInset,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="purchases"
        options={{
          title: 'Compra',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.purchaseIcon, focused && styles.purchaseIconFocused]}>
              <SymbolView
                name={{ ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' }}
                size={25}
                tintColor={colors.onPrimary}
              />
            </View>
          ),
          tabBarLabelStyle: styles.purchaseLabel,
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600' },
  purchaseLabel: { fontSize: 12, fontWeight: '800' },
  purchaseIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
    borderRadius: radius.full,
  },
  purchaseIconFocused: { backgroundColor: colors.primaryStrong },
});
