import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function DetailsPurchaseScreen() {
  const { id:purchaseId } = useLocalSearchParams<{id: string}>(); 

  const router = useRouter();
  
  return(
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Detalhes da compra
        </Text>

        <Text style={styles.description}>Compra selecionada: {purchaseId}</Text>

        <PrimaryButton 
          title='Voltar'
          onPress={() => router.back()}
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