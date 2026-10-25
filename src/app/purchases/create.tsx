import { AppButton } from '@/components/AppButton';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { FeedbackToast } from '@/components/FeedbackToast';
import { type MarketFormValues } from '@/components/market/MarketForm';
import { MarketSelectionSheet } from '@/components/purchase';
import { SelectField } from '@/components/SelectField';
import type { Market } from '@/domain/models/Market';
import { useMarketService } from '@/hooks/useMarketService';
import { usePurchaseService } from '@/hooks/usePurchaseService';
import { MarketValidationError } from '@/services/market.service';
import { colors, spacing, typography } from '@/theme';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Feedback = { tone: 'success' | 'danger' | 'warning'; message: string } | null;
const EMPTY_FORM: MarketFormValues = { name: '' };

export default function CreatePurchaseScreen() {
  const router = useRouter();
  const purchaseService = usePurchaseService();
  const marketService = useMarketService();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'select' | 'create'>('select');
  const [formValues, setFormValues] = useState<MarketFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<'name', string>>>({});
  const [restoreMarket, setRestoreMarket] = useState<Market | null>(null);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingMarket, setSavingMarket] = useState(false);
  const [starting, setStarting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let active = true;
    Promise.all([marketService.listMarkets(), purchaseService.getDraft()])
      .then(([availableMarkets, draft]) => {
        if (!active) return;
        if (draft) {
          router.replace({ pathname: '/purchases/[id]', params: { id: draft.purchase.id } });
          return;
        }
        setMarkets(availableMarkets);
      })
      .catch(() => {
        if (active) setFeedback({ tone: 'danger', message: 'Não foi possível preparar a compra.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [marketService, purchaseService, router]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const filteredMarkets = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return normalized
      ? markets.filter((market) => market.name.toLocaleLowerCase('pt-BR').includes(normalized))
      : markets;
  }, [markets, query]);

  const selectedMarket = markets.find((market) => market.id === selectedMarketId) ?? null;

  async function reloadMarkets(preferredId?: string) {
    const availableMarkets = await marketService.listMarkets();
    setMarkets(availableMarkets);
    if (preferredId) setSelectedMarketId(preferredId);
  }

  function changeFormField(field: 'name', value: string) {
    setFormValues({ [field]: value });
    setFormErrors({});
  }

  function openPicker() {
    setPickerMode('select');
    setPickerVisible(true);
  }

  function openCreateMarket() {
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setPickerMode('create');
  }

  async function saveMarket() {
    setSavingMarket(true);
    try {
      const result = await marketService.save(formValues);
      if (result.status === 'duplicate') {
        setFormErrors({ name: 'Já existe um mercado com esse nome.' });
        return;
      }
      if (result.status === 'restorable') {
        setRestoreMarket(result.market);
        setPickerVisible(false);
        setRestoreVisible(true);
        return;
      }

      await reloadMarkets(result.market.id);
      setPickerMode('select');
      setFeedback({ tone: 'success', message: 'Mercado cadastrado e selecionado.' });
    } catch (error) {
      if (error instanceof MarketValidationError) setFormErrors(error.errors);
      else setFeedback({ tone: 'danger', message: 'Não foi possível salvar o mercado.' });
    } finally {
      setSavingMarket(false);
    }
  }

  async function restoreDeletedMarket() {
    if (!restoreMarket) return;
    setSavingMarket(true);
    try {
      const restored = await marketService.restore(restoreMarket.id);
      await reloadMarkets(restored.id);
      setRestoreVisible(false);
      setRestoreMarket(null);
      setPickerMode('select');
      setPickerVisible(true);
      setFeedback({ tone: 'success', message: 'Mercado restaurado e selecionado.' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível restaurar o mercado.' });
    } finally {
      setSavingMarket(false);
    }
  }

  async function startPurchase() {
    if (!selectedMarketId) return;
    setStarting(true);
    try {
      const draft = await purchaseService.startDraft(selectedMarketId);
      router.replace({ pathname: '/purchases/[id]', params: { id: draft.purchase.id } });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível iniciar a compra.' });
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Cancelar e voltar"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Preparar compra</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.introduction}>
            <Text style={styles.heading}>Onde você vai comprar?</Text>
            <Text style={styles.description}>
              O mercado é obrigatório e poderá ser alterado durante a compra.
            </Text>
          </View>

          <SelectField
            required
            label="Mercado"
            onPress={openPicker}
            placeholder="Selecionar mercado"
            value={selectedMarket?.name}
          />

          <View style={styles.footer}>
            {feedback ? <FeedbackToast message={feedback.message} tone={feedback.tone} /> : null}
            <AppButton
              disabled={!selectedMarketId}
              loading={starting}
              onPress={() => void startPurchase()}
              title="Iniciar compra"
            />
            <Pressable
              accessibilityRole="button"
              disabled={starting}
              onPress={() => router.back()}
              style={styles.cancel}
            >
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <MarketSelectionSheet
        confirming={false}
        createFormProps={{
          values: formValues,
          errors: formErrors,
          hint: formErrors.name
            ? 'Informe um nome diferente para continuar.'
            : 'Use um nome que ajude a identificar o mercado.',
          loading: savingMarket,
          onChangeField: changeFormField,
          onSubmit: () => void saveMarket(),
          submitLabel: 'Salvar mercado',
        }}
        markets={filteredMarkets}
        mode={pickerMode}
        onCancelCreate={() => setPickerMode('select')}
        onChangeQuery={setQuery}
        onConfirm={() => setPickerVisible(false)}
        onRequestClose={() => setPickerVisible(false)}
        onSelectMarket={setSelectedMarketId}
        onStartCreate={openCreateMarket}
        query={query}
        selectedMarketId={selectedMarketId}
        visible={pickerVisible}
      />

      <ConfirmationSheet
        confirmLabel="Restaurar mercado"
        loading={savingMarket}
        message={`${restoreMarket?.name ?? 'Este mercado'} já foi excluído anteriormente. Deseja restaurá-lo para esta compra?`}
        onConfirm={() => void restoreDeletedMarket()}
        onRequestClose={() => {
          setRestoreVisible(false);
          setPickerVisible(true);
        }}
        title="Restaurar mercado?"
        visible={restoreVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  keyboardArea: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  backButton: { width: 43, minHeight: 48, justifyContent: 'center' },
  backIcon: { fontSize: 30, lineHeight: 36, color: colors.primary },
  title: { ...typography.title, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  introduction: { gap: spacing.sm, marginBottom: spacing.xxl },
  heading: { ...typography.title, fontSize: 21, fontWeight: '700', color: colors.textPrimary },
  description: { ...typography.bodySmall, color: colors.textSecondary },
  footer: { flex: 1, justifyContent: 'flex-end', gap: spacing.sm, paddingBottom: spacing.sm },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { ...typography.bodySmall, fontSize: 15, fontWeight: '600', color: colors.primary },
});
