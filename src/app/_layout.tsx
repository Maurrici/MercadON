import { DatabaseErrorBoundary } from '@/components/DatabaseErrorBoundary';
import { DATABASE_NAME } from '@/database/config';
import { initializeDatabase } from '@/database/initialize';
import { colors, spacing, typography } from '@/theme';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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

function DatabaseLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Preparando o MercadON...</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <DatabaseErrorBoundary>
          <Suspense fallback={<DatabaseLoading />}>
            <SQLiteProvider
              databaseName={DATABASE_NAME}
              onInit={initializeDatabase}
              useSuspense
            >
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
            </SQLiteProvider>
          </Suspense>
        </DatabaseErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});