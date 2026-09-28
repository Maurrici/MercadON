import { colors } from '@/theme';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.danger
  }
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.surface
            },
            headerTintColor: colors.primary,
            contentStyle: {
              backgroundColor: colors.background
            }
          }}
        >
          <Stack.Screen
            name='(tabs)'
            options={{headerShown: false}}
          />

          <Stack.Screen
            name='purchases/create'
            options={{title: 'Cadastrar compra'}}
          />

          <Stack.Screen
            name='purchases/[id]'
            options={{title: 'Detalhes da compra'}}
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
