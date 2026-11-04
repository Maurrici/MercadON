import { DatabaseErrorBoundary } from '@/components/DatabaseErrorBoundary';
import { BrandLogo } from '@/components/BrandLogo';
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
    notification: colors.danger,
  },
};

function DatabaseLoading() {
  return (
    <View style={styles.loading}>
      <BrandLogo style={styles.loadingLogo} variant="compact" />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Preparando seus dados...</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <DatabaseErrorBoundary>
          <Suspense fallback={<DatabaseLoading />}>
            <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: colors.surface,
                  },
                  headerTintColor: colors.primary,
                  contentStyle: {
                    backgroundColor: colors.background,
                  },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                <Stack.Screen name="products/index" options={{ headerShown: false }} />

                <Stack.Screen name="markets/index" options={{ headerShown: false }} />

                <Stack.Screen name="purchases/create" options={{ headerShown: false }} />

                <Stack.Screen name="purchases/[id]" options={{ headerShown: false }} />

                <Stack.Screen name="purchases/[id]/item" options={{ headerShown: false }} />

                <Stack.Screen name="purchases/history/index" options={{ headerShown: false }} />

                <Stack.Screen name="purchases/history/[id]" options={{ headerShown: false }} />

                <Stack.Screen name="analytics/monthly" options={{ headerShown: false }} />

                <Stack.Screen name="analytics/categories" options={{ headerShown: false }} />

                <Stack.Screen name="analytics/products" options={{ headerShown: false }} />

                <Stack.Screen name="analytics/products/[id]" options={{ headerShown: false }} />

                <Stack.Screen name="analytics/variations" options={{ headerShown: false }} />

                <Stack.Screen name="test-environment" options={{ headerShown: false }} />
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
  loadingLogo: {
    width: 224,
    height: 168,
  },
});
