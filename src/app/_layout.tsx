import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name='(tabs)'
          options={{headerShown: false}}
        />

        <Stack.Screen
          name='purchase/create'
          options={{title: 'Cadastrar compra'}}
        />

        <Stack.Screen
          name='purchase/[id]'
          options={{title: 'Detalhes da compra'}}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
