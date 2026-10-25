import { AccessCard } from '@/components/AccessCard';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>MercadON</Text>
      </View>

      <Text style={styles.description}>Organize suas compras</Text>

      <View style={styles.cards}>
        <AccessCard disabled description="Suas listas e compras" icon="✓" title="Compras" />
        <AccessCard
          description="Seu catálogo pessoal"
          icon="□"
          onPress={() => router.push('/products')}
          title="Produtos"
        />
        <AccessCard
          description="Locais onde você compra"
          icon="⌂"
          onPress={() => router.push('/markets')}
          title="Mercados"
        />
        <AccessCard
          description="Preços e gastos"
          icon="▤"
          onPress={() => router.push('/purchases/history')}
          title="Histórico"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing.lg, paddingTop: 0 },
  header: {
    minHeight: 78,
    justifyContent: 'center',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
  },
  title: { ...typography.title, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 10,
    marginHorizontal: spacing.xs,
  },
  cards: { gap: spacing.lg, marginTop: 48 },
});
