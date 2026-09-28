import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function CreatePurchaseScreen() {
    const router = useRouter();

    return (
        <Screen edges={['left', 'right', 'bottom']}>
            <View style={styles.content}>
                <Text style={styles.title}>
                    Nova compra
                </Text>

                <Text style={styles.description}>
                    O formulário de cadastro será implementado em uma task futura.
                </Text>

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