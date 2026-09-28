import { AppInput } from '@/components/AppInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  const [productName, setProductName] = useState<string>('');

  return (
    <Screen>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>
            MercadON
          </Text>

          <Text style={styles.description}>
            Bem-vindo ao seu organizador de compras!
          </Text>
        </View>

        <AppInput
          label='Nome do produto'
          placeholder='Ex.: Arroz'
          value={productName}
          onChangeText={setProductName}
        />

        <PrimaryButton 
          title='Ir para Compras'
          onPress={() => router.push('/purchases')}
        />

        <PrimaryButton
          title="Adicionar produto (em breve)"
          onPress={() => {}}
          disabled
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
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