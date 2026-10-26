import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { FeedbackToast } from '@/components/FeedbackToast';
import { OptionPickerSheet } from '@/components/OptionPickerSheet';
import { PurchaseItemActionSheet, PurchaseItemRow } from '@/components/purchase';
import { SelectField } from '@/components/SelectField';
import { getMeasurementUnitLabel } from '@/domain/enums/MeasurementUnit';
import type { Market } from '@/domain/models/Market';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type { ProductListItem } from '@/domain/repositories/product.repository';
import { formatProductDetails } from '@/features/products/presentation';
import {
  formatPurchaseDate,
  parsePurchaseDateInput,
  toPurchaseItemFormValues,
} from '@/features/purchases/presentation';
import { useCompletedPurchaseService } from '@/hooks/useCompletedPurchaseService';
import { useMarketService } from '@/hooks/useMarketService';
import { useProductService } from '@/hooks/useProductService';
import {
  LastCompletedPurchaseItemError,
  type CompletedPurchaseDetails,
} from '@/services/completed-purchase.service';
import type { PriceComparison } from '@/services/purchase-item.service';
import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents, formatQuantityMilli } from '@/utils/formatters';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HistoricalItem = {
  item: PurchaseItem;
  product: ProductListItem | null;
  comparison: PriceComparison | null;
};
type Feedback = { tone: 'success' | 'danger' | 'warning'; message: string } | null;

export default function CompletedPurchaseDetailsScreen() {
  const { id: purchaseId, highlightedItemId } = useLocalSearchParams<{
    id: string;
    highlightedItemId?: string;
  }>();
  const router = useRouter();
  const completedPurchaseService = useCompletedPurchaseService();
  const productService = useProductService();
  const marketService = useMarketService();
  const [details, setDetails] = useState<CompletedPurchaseDetails | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);
  const [items, setItems] = useState<HistoricalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoricalItem | null>(null);
  const [editMarketId, setEditMarketId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState<string | undefined>();
  const [dismissedHighlightId, setDismissedHighlightId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [marketPickerVisible, setMarketPickerVisible] = useState(false);
  const [itemActionsVisible, setItemActionsVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [nextDetails, availableMarkets] = await Promise.all([
        completedPurchaseService.getDetails(purchaseId),
        marketService.listMarkets(),
      ]);
      const historicalMarket = await marketService.getMarket(nextDetails.purchase.marketId);
      const historicalItems = await Promise.all(
        nextDetails.items.map(async (item): Promise<HistoricalItem> => {
          const storedProduct = await productService.getProduct(item.productId);
          const product = storedProduct ?? null;
          if (!product) return { item, product: null, comparison: null };
          try {
            const preview = await completedPurchaseService.previewItem(
              purchaseId,
              product.id,
              toPurchaseItemFormValues(item),
            );
            return { item, product, comparison: preview.comparison };
          } catch {
            return { item, product, comparison: null };
          }
        }),
      );
      setDetails(nextDetails);
      setMarkets(availableMarkets);
      setCurrentMarket(historicalMarket);
      setItems(historicalItems);
      setFeedback(null);
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível carregar a compra concluída.' });
    } finally {
      setLoading(false);
    }
  }, [completedPurchaseService, marketService, productService, purchaseId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetails();
    }, [loadDetails]),
  );

  useEffect(() => {
    if (!highlightedItemId) return;
    const timeout = setTimeout(() => setDismissedHighlightId(highlightedItemId), 2500);
    return () => clearTimeout(timeout);
  }, [highlightedItemId]);

  const editMarket = markets.find((market) => market.id === editMarketId) ?? null;

  function openEditPurchase() {
    if (!details) return;
    setEditMarketId(details.purchase.marketId);
    setDateInput(formatPurchaseDate(details.purchase.purchasedAt));
    setDateError(undefined);
    setMenuVisible(false);
    setEditVisible(true);
  }

  async function savePurchaseDetails() {
    if (!details || !editMarketId) return;
    const purchasedAt = parsePurchaseDateInput(dateInput);
    if (!purchasedAt) {
      setDateError('Informe a data no formato dd/mm/aaaa.');
      return;
    }

    setBusy(true);
    try {
      await completedPurchaseService.updateDetails(details.purchase.id, editMarketId, purchasedAt);
      setEditVisible(false);
      await loadDetails();
      setFeedback({ tone: 'success', message: 'Compra atualizada.' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível atualizar a compra.' });
    } finally {
      setBusy(false);
    }
  }

  function openItemActions(item: HistoricalItem) {
    setSelectedItem(item);
    setItemActionsVisible(true);
  }

  function editSelectedItem() {
    if (!selectedItem) return;
    setItemActionsVisible(false);
    router.push({
      pathname: '/purchases/[id]/item',
      params: { id: purchaseId, itemId: selectedItem.item.id, mode: 'history' },
    });
  }

  async function removeSelectedItem() {
    if (!selectedItem) return;
    setBusy(true);
    try {
      await completedPurchaseService.removeItem(purchaseId, selectedItem.item.id);
      setRemoveVisible(false);
      setSelectedItem(null);
      await loadDetails();
      setFeedback({ tone: 'success', message: 'Item removido do histórico.' });
    } catch (error) {
      setRemoveVisible(false);
      setFeedback({
        tone: error instanceof LastCompletedPurchaseItemError ? 'warning' : 'danger',
        message:
          error instanceof LastCompletedPurchaseItemError
            ? error.message
            : 'Não foi possível remover o item.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function deletePurchase() {
    setBusy(true);
    try {
      await completedPurchaseService.deletePurchase(purchaseId);
      router.replace('/purchases/history');
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível excluir a compra.' });
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.headerIdentity}>
          <Text style={styles.title}>Compra concluída</Text>
          <Text style={styles.subtitle}>
            {details ? formatPurchaseDate(details.purchase.purchasedAt) : ''}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Ações da compra"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setMenuVisible(true)}
          style={styles.headerButton}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>Mercado</Text>
          <Text style={styles.summaryValue}>{currentMarket?.name ?? 'Mercado não disponível'}</Text>
        </View>
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.total}>{formatCurrencyFromCents(details?.totalPriceCents ?? 0)}</Text>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={({ item }) => item.id}
        ListFooterComponent={
          <AppButton
            onPress={() =>
              router.push({
                pathname: '/purchases/[id]/item',
                params: { id: purchaseId, mode: 'history' },
              })
            }
            title="＋ Adicionar produto"
            tone="secondary"
          />
        }
        renderItem={({ item: historicalItem }) => (
          <PurchaseItemRow
            comparison={historicalItem.comparison}
            details={historicalItem.product ? formatProductDetails(historicalItem.product) : null}
            highlighted={
              highlightedItemId !== dismissedHighlightId &&
              historicalItem.item.id === highlightedItemId
            }
            name={historicalItem.product?.name ?? 'Produto não disponível'}
            onPress={() => {
              router.push({
                pathname: '/purchases/[id]/item',
                params: { id: purchaseId, itemId: historicalItem.item.id, mode: 'history' },
              });
            }}
            onPressActions={() => openItemActions(historicalItem)}
            priceLabel={formatComparablePrice(historicalItem)}
            quantityLabel={formatQuantityMilli(
              historicalItem.item.quantityMilli,
              historicalItem.item.quantityUnit,
            )}
            totalPriceCents={historicalItem.item.totalPriceCents}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {feedback ? (
        <View style={styles.feedback}>
          <FeedbackToast message={feedback.message} tone={feedback.tone} />
        </View>
      ) : null}

      <BottomSheet
        showCloseButton
        onRequestClose={() => setMenuVisible(false)}
        title="Ações da compra"
        visible={menuVisible}
      >
        <View style={styles.menuActions}>
          <AppButton onPress={openEditPurchase} title="Corrigir compra" tone="secondary" />
          <AppButton
            onPress={() => {
              setMenuVisible(false);
              setDeleteVisible(true);
            }}
            title="Excluir definitivamente"
            tone="danger"
          />
        </View>
      </BottomSheet>

      <BottomSheet
        showCloseButton
        onRequestClose={() => setEditVisible(false)}
        title="Corrigir compra"
        visible={editVisible}
      >
        <View style={styles.editForm}>
          <SelectField
            required
            label="Mercado"
            onPress={() => {
              setEditVisible(false);
              setMarketPickerVisible(true);
            }}
            placeholder="Selecionar mercado"
            value={editMarket?.name}
          />
          <AppInput
            required
            error={dateError}
            inputMode="numeric"
            keyboardType="number-pad"
            label="Data da compra"
            maxLength={10}
            onChangeText={(value) => {
              setDateInput(value);
              setDateError(undefined);
            }}
            placeholder="dd/mm/aaaa"
            value={dateInput}
          />
          <AppButton
            loading={busy}
            onPress={() => void savePurchaseDetails()}
            title="Salvar alterações"
          />
        </View>
      </BottomSheet>

      <OptionPickerSheet
        onRequestClose={() => {
          setMarketPickerVisible(false);
          setEditVisible(true);
        }}
        onSelect={(option) => {
          setEditMarketId(option.value);
          setMarketPickerVisible(false);
          setEditVisible(true);
        }}
        options={markets.map((market) => ({ value: market.id, label: market.name }))}
        selectedValue={editMarketId}
        title="Selecionar mercado"
        visible={marketPickerVisible}
      />

      <PurchaseItemActionSheet
        onEdit={editSelectedItem}
        onRemove={() => {
          setItemActionsVisible(false);
          setRemoveVisible(true);
        }}
        onRequestClose={() => setItemActionsVisible(false)}
        productName={selectedItem?.product?.name ?? 'Produto'}
        visible={itemActionsVisible}
      />

      <ConfirmationSheet
        confirmLabel="Remover item"
        loading={busy}
        message={`Deseja remover ${selectedItem?.product?.name ?? 'este produto'} desta compra concluída?`}
        onConfirm={() => void removeSelectedItem()}
        onRequestClose={() => setRemoveVisible(false)}
        title="Remover item?"
        tone="danger"
        visible={removeVisible}
      />
      <ConfirmationSheet
        confirmLabel="Excluir definitivamente"
        loading={busy}
        message="Esta compra e seus itens sairão definitivamente do histórico. Comparações futuras de preço poderão mudar."
        onConfirm={() => void deletePurchase()}
        onRequestClose={() => setDeleteVisible(false)}
        title="Excluir compra?"
        tone="danger"
        visible={deleteVisible}
      />
    </SafeAreaView>
  );
}

function formatComparablePrice({ item, comparison }: HistoricalItem): string {
  if (item.commercializationType === 'FIXED') {
    return `${formatCurrencyFromCents(item.unitPriceCents)}/un`;
  }
  const normalized =
    comparison?.currentNormalizedPriceCents ??
    Math.round((item.totalPriceCents * 1000) / item.quantityMilli);
  return `${formatCurrencyFromCents(normalized)}/${getMeasurementUnitLabel(item.quantityUnit)}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  headerButton: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, lineHeight: 36, color: colors.primary },
  menuIcon: { fontSize: 25, lineHeight: 30, color: colors.textSecondary },
  headerIdentity: { flex: 1, alignItems: 'center' },
  title: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryTotal: { alignItems: 'flex-end' },
  summaryLabel: { ...typography.caption, color: colors.textSecondary },
  summaryValue: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  total: { ...typography.title, fontWeight: '800', color: colors.textPrimary },
  list: { gap: spacing.sm, padding: spacing.lg },
  feedback: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  menuActions: { gap: spacing.md, paddingBottom: spacing.sm },
  editForm: { gap: spacing.lg, paddingBottom: spacing.sm },
});
