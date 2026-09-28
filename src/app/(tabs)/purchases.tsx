import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function PurchasesScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.title}>
        Compras
      </Text>

      <Text style={styles.description}>Suas listas de compras aparecerão aqui.</Text>

      <View style={styles.content}>
        <PrimaryButton 
          title='+ Cadastrar compra'
          onPress={() => router.push('/purchases/create')}
        />

        <PrimaryButton 
          title='Visualizar compra de exemplo'
          onPress={() => router.push({
              pathname: '/purchases/[id]',
              params: { id: '1' },
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: spacing.md,
    gap: spacing.xl,
  },

  title: {
    ...typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});