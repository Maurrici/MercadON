import { AppButton } from '@/components/AppButton';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { FeedbackToast } from '@/components/FeedbackToast';
import { useTestEnvironment } from '@/devtools/test-environment';
import { colors, radius, spacing, typography } from '@/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PendingAction = 'apply' | 'reset' | null;
type Feedback = { message: string; tone: 'success' | 'danger' | 'warning' } | null;

export default function TestEnvironmentScreen() {
  const testEnvironment = useTestEnvironment();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function confirmAction() {
    if (!pendingAction) return;
    setLoading(true);
    try {
      if (pendingAction === 'apply') {
        const summary = await testEnvironment.applyEnvironment1();
        setFeedback({
          tone: 'success',
          message: `Ambiente 1 aplicado: ${summary.markets} mercados, ${summary.products} produtos e ${summary.purchases} compras.`,
        });
      } else {
        await testEnvironment.reset();
        setFeedback({
          tone: 'success',
          message: 'Dados operacionais removidos. As categorias padrão foram preservadas.',
        });
      }
      setPendingAction(null);
    } catch {
      setFeedback({
        tone: 'danger',
        message:
          pendingAction === 'apply'
            ? 'Não foi possível aplicar o Ambiente 1.'
            : 'Não foi possível redefinir o banco local.',
      });
    } finally {
      setLoading(false);
    }
  }

  const applying = pendingAction === 'apply';

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Ambiente de teste</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Uso exclusivo para testes</Text>
          <Text style={styles.warningText}>
            As ações desta tela substituem ou removem os dados operacionais armazenados neste
            aparelho.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Ambiente 1</Text>
            <Text style={styles.cardDescription}>
              Popula seis meses de compras com mercados, categorias, produtos fixos e variáveis,
              altas e quedas de preço.
            </Text>
          </View>
          <View style={styles.actions}>
            <AppButton onPress={() => setPendingAction('apply')} title="Aplicar" />
            <AppButton onPress={() => setPendingAction('reset')} title="Redefinir" tone="danger" />
          </View>
        </View>

        {feedback ? <FeedbackToast message={feedback.message} tone={feedback.tone} /> : null}
      </ScrollView>

      <ConfirmationSheet
        confirmLabel={applying ? 'Aplicar Ambiente 1' : 'Redefinir banco local'}
        loading={loading}
        message={
          applying
            ? 'Todos os mercados, produtos, compras e itens atuais serão removidos e substituídos pela massa do Ambiente 1. As categorias padrão serão preservadas.'
            : 'Todos os mercados, produtos, compras e itens serão removidos deste aparelho. As categorias padrão e a estrutura do banco serão preservadas.'
        }
        onConfirm={() => void confirmAction()}
        onRequestClose={() => !loading && setPendingAction(null)}
        title={applying ? 'Aplicar ambiente de teste?' : 'Redefinir banco local?'}
        tone={applying ? 'primary' : 'danger'}
        visible={pendingAction !== null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  backButton: { width: 43, minHeight: 48, justifyContent: 'center' },
  backIcon: { fontSize: 30, lineHeight: 36, color: colors.primary },
  title: { ...typography.subtitle, color: colors.textPrimary, fontWeight: '800' },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  warning: {
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.warningBackground,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
  },
  warningTitle: { ...typography.bodySmall, color: colors.warning, fontWeight: '800' },
  warningText: { ...typography.caption, color: colors.textSecondary },
  card: {
    gap: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  cardCopy: { gap: spacing.xs },
  cardTitle: { ...typography.subtitle, color: colors.textPrimary, fontWeight: '800' },
  cardDescription: { ...typography.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.sm },
  pressed: { opacity: 0.65 },
});
