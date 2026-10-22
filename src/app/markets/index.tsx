import { AppButton } from '@/components/AppButton';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { SearchInput } from '@/components/SearchInput';
import {
  MarketActionSheet,
  MarketForm,
  type MarketFormValues,
  MarketRow,
} from '@/components/market';
import type { Market } from '@/domain/models/Market';
import { useMarketService } from '@/hooks/useMarketService';
import { MarketValidationError } from '@/services/market.service';
import { colors, spacing, typography } from '@/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Feedback = { tone: 'success' | 'danger' | 'warning'; message: string } | null;

const EMPTY_FORM: MarketFormValues = { name: '' };

export default function MarketsScreen() {
  const marketService = useMarketService();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [editingMarketId, setEditingMarketId] = useState<string | null>(null);
  const [restoreMarket, setRestoreMarket] = useState<Market | null>(null);
  const [formValues, setFormValues] = useState<MarketFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MarketFormValues, string>>>({});
  const [formVisible, setFormVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadMarkets = useCallback(async () => {
    try {
      setMarkets(await marketService.listMarkets());
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível carregar os mercados' });
    } finally {
      setLoading(false);
    }
  }, [marketService]);

  useFocusEffect(
    useCallback(() => {
      void loadMarkets();
    }, [loadMarkets]),
  );

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const filteredMarkets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return markets;
    return markets.filter((market) =>
      market.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
    );
  }, [markets, query]);

  function changeFormField<Key extends keyof MarketFormValues>(
    field: Key,
    value: MarketFormValues[Key],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function openCreateForm() {
    setEditingMarketId(null);
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setFormVisible(true);
  }

  function openActions(market: Market) {
    setSelectedMarket(market);
    setActionsVisible(true);
  }

  function openEditForm() {
    if (!selectedMarket) return;
    setEditingMarketId(selectedMarket.id);
    setFormValues({ name: selectedMarket.name });
    setFormErrors({});
    setActionsVisible(false);
    setFormVisible(true);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const result = await marketService.save(formValues, editingMarketId ?? undefined);
      if (result.status === 'duplicate') {
        setFormErrors({ name: 'Já existe um mercado com esse nome.' });
        setFeedback({ tone: 'warning', message: 'Mercado já cadastrado' });
        return;
      }
      if (result.status === 'restorable') {
        setRestoreMarket(result.market);
        setFormVisible(false);
        setRestoreVisible(true);
        return;
      }

      setFormVisible(false);
      await loadMarkets();
      setFeedback({
        tone: 'success',
        message: editingMarketId
          ? 'Mercado atualizado com sucesso'
          : 'Mercado cadastrado com sucesso',
      });
    } catch (error) {
      if (error instanceof MarketValidationError) {
        setFormErrors(error.errors);
      } else {
        setFeedback({ tone: 'danger', message: 'Não foi possível salvar o mercado' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selectedMarket) return;
    try {
      await marketService.delete(selectedMarket.id);
      setDeleteVisible(false);
      setSelectedMarket(null);
      await loadMarkets();
      setFeedback({ tone: 'success', message: 'Mercado excluído com sucesso' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível excluir o mercado' });
    }
  }

  async function confirmRestore() {
    if (!restoreMarket) return;
    try {
      await marketService.restore(restoreMarket.id);
      setRestoreVisible(false);
      setRestoreMarket(null);
      await loadMarkets();
      setFeedback({ tone: 'success', message: 'Mercado restaurado com sucesso' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível restaurar o mercado' });
    }
  }

  const resultCount = filteredMarkets.length;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Mercados</Text>
      </View>

      <View style={styles.content}>
        <SearchInput
          accessibilityLabel="Buscar mercados"
          onChangeText={setQuery}
          placeholder="Buscar mercados..."
          value={query}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : resultCount > 0 ? (
          <>
            <Text style={styles.count}>{formatMarketCount(resultCount)}</Text>
            <FlatList
              contentContainerStyle={styles.list}
              data={filteredMarkets}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MarketRow name={item.name} onPressActions={() => openActions(item)} />
              )}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              description={
                query
                  ? 'Tente outro nome ou cadastre um novo mercado.'
                  : 'Cadastre os mercados onde você costuma comprar.'
              }
              icon={query ? '⌕' : '+'}
              title={query ? 'Nenhum mercado encontrado' : 'Ainda não há mercados'}
            />
          </View>
        )}

        <View style={styles.footer}>
          {feedback ? <FeedbackToast message={feedback.message} tone={feedback.tone} /> : null}
          <AppButton onPress={openCreateForm} title="＋ Novo mercado" />
        </View>
      </View>

      <MarketActionSheet
        marketName={selectedMarket?.name ?? ''}
        onDelete={() => {
          setActionsVisible(false);
          setDeleteVisible(true);
        }}
        onEdit={openEditForm}
        onRequestClose={() => setActionsVisible(false)}
        visible={actionsVisible}
      />

      <BottomSheet
        showCloseButton
        onRequestClose={() => setFormVisible(false)}
        title={editingMarketId ? 'Editar mercado' : 'Novo mercado'}
        visible={formVisible}
      >
        <MarketForm
          errors={formErrors}
          hint={
            formErrors.name
              ? 'Informe um nome diferente para continuar.'
              : editingMarketId
                ? 'Altere o nome e salve suas mudanças.'
                : 'Use um nome que ajude a identificar o mercado.'
          }
          loading={saving}
          onCancel={() => setFormVisible(false)}
          onChangeField={changeFormField}
          onSubmit={() => void handleSubmit()}
          submitLabel={editingMarketId ? 'Salvar alterações' : 'Salvar mercado'}
          values={formValues}
        />
      </BottomSheet>

      <ConfirmationSheet
        confirmLabel="Excluir mercado"
        message={`Deseja excluir ${selectedMarket?.name ?? 'este mercado'}?\nVocê poderá restaurá-lo posteriormente.`}
        onConfirm={() => void confirmDelete()}
        onRequestClose={() => setDeleteVisible(false)}
        title="Excluir mercado?"
        tone="danger"
        visible={deleteVisible}
      />

      <ConfirmationSheet
        confirmLabel="Restaurar mercado"
        message={`${restoreMarket?.name ?? 'Este mercado'} já foi excluído anteriormente.\nDeseja restaurar esse mercado?`}
        onConfirm={() => void confirmRestore()}
        onRequestClose={() => setRestoreVisible(false)}
        title="Restaurar mercado?"
        visible={restoreVisible}
      />
    </SafeAreaView>
  );
}

function formatMarketCount(count: number): string {
  return `${count} ${count === 1 ? 'mercado' : 'mercados'}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  backButton: { width: 43, minHeight: 48, justifyContent: 'center' },
  backIcon: { fontSize: 30, lineHeight: 36, color: colors.primary },
  title: { ...typography.title, fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 17 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  count: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginHorizontal: 1,
  },
  list: { gap: spacing.sm, paddingTop: 20, paddingBottom: 148 },
  emptyContainer: { flex: 1, justifyContent: 'center', paddingBottom: 100 },
  footer: {
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
});
