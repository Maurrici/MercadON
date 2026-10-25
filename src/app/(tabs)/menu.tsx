import { AccessCard } from '@/components/AccessCard';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MenuScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introduction}>
          <Text style={styles.heading}>Gerenciamento</Text>
          <Text style={styles.description}>Acesse e organize os dados do aplicativo.</Text>
        </View>

        <View style={styles.cards}>
          <AccessCard
            description="Consulte e corrija compras realizadas"
            icon="✓"
            onPress={() => router.push('/purchases/history')}
            title="Compras"
          />
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
          <AccessCard disabled description="Análises e estatísticas" icon="▤" title="Histórico" />
        </View>
      </ScrollView>
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
  content: { gap: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  introduction: { gap: spacing.xs, marginHorizontal: spacing.xs },
  heading: { ...typography.subtitle, fontWeight: '800', color: colors.textPrimary },
  description: { ...typography.body, color: colors.textSecondary },
  cards: { gap: spacing.lg },
});
