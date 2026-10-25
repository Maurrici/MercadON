import { AppButton } from '@/components/AppButton';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { type MarketFormValues } from '@/components/market';
import {
  MarketSelectionSheet,
  PurchaseItemActionSheet,
  PurchaseItemRow,
  PurchaseTotalBar,
} from '@/components/purchase';
import { SearchInput } from '@/components/SearchInput';
import { getMeasurementUnitLabel } from '@/domain/enums/MeasurementUnit';
import type { Market } from '@/domain/models/Market';
import type { PurchaseItem } from '@/domain/models/PurchaseItem';
import type { ProductListItem } from '@/domain/repositories/product.repository';
import { formatProductDetails } from '@/features/products/presentation';
import { toPurchaseItemFormValues } from '@/features/purchases/presentation';
import { useMarketService } from '@/hooks/useMarketService';
import { useProductService } from '@/hooks/useProductService';
import { usePurchaseItemService } from '@/hooks/usePurchaseItemService';
import { usePurchaseService } from '@/hooks/usePurchaseService';
import { MarketValidationError } from '@/services/market.service';
import type { PriceComparison } from '@/services/purchase-item.service';
import type { PurchaseDraftDetails } from '@/services/purchase.service';
import { colors, spacing, typography } from '@/theme';
import { formatCurrencyFromCents, formatQuantityMilli } from '@/utils/formatters';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CartItem = {
  item: PurchaseItem;
  product: ProductListItem | null;
  comparison: PriceComparison | null;
};
type Feedback = { tone: 'success' | 'danger' | 'warning'; message: string } | null;
const EMPTY_MARKET_FORM: MarketFormValues = { name: '' };

export default function PurchaseCartScreen() {
  const { id: purchaseId, highlightedItemId } = useLocalSearchParams<{
    id: string;
    highlightedItemId?: string;
  }>();
  const router = useRouter();
  const purchaseService = usePurchaseService();
  const purchaseItemService = usePurchaseItemService();
  const productService = useProductService();
  const marketService = useMarketService();
  const [draft, setDraft] = useState<PurchaseDraftDetails | null>(null);
  const [dismissedHighlightId, setDismissedHighlightId] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [marketQuery, setMarketQuery] = useState('');
  const [marketPickerMode, setMarketPickerMode] = useState<'select' | 'create'>('select');
  const [marketFormValues, setMarketFormValues] = useState<MarketFormValues>(EMPTY_MARKET_FORM);
  const [marketFormErrors, setMarketFormErrors] = useState<Partial<Record<'name', string>>>({});
  const [restoreMarket, setRestoreMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [itemActionsVisible, setItemActionsVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [finishVisible, setFinishVisible] = useState(false);
  const [marketPickerVisible, setMarketPickerVisible] = useState(false);
  const [restoreMarketVisible, setRestoreMarketVisible] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const [details, availableMarkets, products] = await Promise.all([
        purchaseService.getDraft(),
        marketService.listMarkets(),
        productService.listProducts(),
      ]);
      if (!details || details.purchase.id !== purchaseId) {
        setDraft(null);
        setFeedback({ tone: 'danger', message: 'Compra em andamento não encontrada.' });
        return;
      }

      const items = await Promise.all(
        details.items.map(async (item): Promise<CartItem> => {
          const product = products.find((candidate) => candidate.id === item.productId) ?? null;
          if (!product) return { item, product: null, comparison: null };
          try {
            const preview = await purchaseItemService.previewItem(
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

      setDraft(details);
      setMarkets(availableMarkets);
      setSelectedMarketId(details.purchase.marketId);
      setCartItems(items);
      setFeedback(null);
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível carregar a compra.' });
    } finally {
      setLoading(false);
    }
  }, [marketService, productService, purchaseId, purchaseItemService, purchaseService]);

  useFocusEffect(
    useCallback(() => {
      void loadCart();
    }, [loadCart]),
  );

  useEffect(() => {
    if (!highlightedItemId) return;
    const timeout = setTimeout(() => setDismissedHighlightId(highlightedItemId), 2500);
    return () => clearTimeout(timeout);
  }, [highlightedItemId]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return cartItems;
    return cartItems.filter(({ product }) =>
      [product?.name, product?.brand, product?.categoryName].some((value) =>
        value?.toLocaleLowerCase('pt-BR').includes(normalized),
      ),
    );
  }, [cartItems, query]);

  const filteredMarkets = useMemo(() => {
    const normalized = marketQuery.trim().toLocaleLowerCase('pt-BR');
    return normalized
      ? markets.filter((market) => market.name.toLocaleLowerCase('pt-BR').includes(normalized))
      : markets;
  }, [marketQuery, markets]);

  const currentMarket = markets.find((market) => market.id === draft?.purchase.marketId) ?? null;

  function openItemActions(item: CartItem) {
    setSelectedItem(item);
    setItemActionsVisible(true);
  }

  function editSelectedItem() {
    if (!selectedItem) return;
    setItemActionsVisible(false);
    router.push({
      pathname: '/purchases/[id]/item',
      params: { id: purchaseId, itemId: selectedItem.item.id },
    });
  }

  async function removeSelectedItem() {
    if (!selectedItem) return;
    setBusy(true);
    try {
      await purchaseItemService.removeItem(purchaseId, selectedItem.item.id);
      setRemoveVisible(false);
      setSelectedItem(null);
      await loadCart();
      setFeedback({ tone: 'success', message: 'Item removido da compra.' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível remover o item.' });
    } finally {
      setBusy(false);
    }
  }

  function openMarketPicker() {
    setMenuVisible(false);
    setSelectedMarketId(draft?.purchase.marketId ?? null);
    setMarketPickerMode('select');
    setMarketPickerVisible(true);
  }

  async function changeMarket() {
    if (!draft || !selectedMarketId) return;
    setBusy(true);
    try {
      await purchaseService.changeDraftMarket(draft.purchase.id, selectedMarketId);
      setMarketPickerVisible(false);
      await loadCart();
      setFeedback({ tone: 'success', message: 'Mercado alterado.' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível alterar o mercado.' });
    } finally {
      setBusy(false);
    }
  }

  function openCreateMarket() {
    setMarketFormValues(EMPTY_MARKET_FORM);
    setMarketFormErrors({});
    setMarketPickerMode('create');
  }

  async function saveMarket() {
    setBusy(true);
    try {
      const result = await marketService.save(marketFormValues);
      if (result.status === 'duplicate') {
        setMarketFormErrors({ name: 'Já existe um mercado com esse nome.' });
        return;
      }
      if (result.status === 'restorable') {
        setRestoreMarket(result.market);
        setMarketPickerVisible(false);
        setRestoreMarketVisible(true);
        return;
      }

      const availableMarkets = await marketService.listMarkets();
      setMarkets(availableMarkets);
      setSelectedMarketId(result.market.id);
      setMarketPickerMode('select');
    } catch (error) {
      if (error instanceof MarketValidationError) setMarketFormErrors(error.errors);
      else setFeedback({ tone: 'danger', message: 'Não foi possível salvar o mercado.' });
    } finally {
      setBusy(false);
    }
  }

  async function restoreDeletedMarket() {
    if (!restoreMarket) return;
    setBusy(true);
    try {
      const restored = await marketService.restore(restoreMarket.id);
      setMarkets(await marketService.listMarkets());
      setSelectedMarketId(restored.id);
      setRestoreMarket(null);
      setRestoreMarketVisible(false);
      setMarketPickerMode('select');
      setMarketPickerVisible(true);
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível restaurar o mercado.' });
    } finally {
      setBusy(false);
    }
  }

  async function discardPurchase() {
    if (!draft) return;
    setBusy(true);
    try {
      await purchaseService.discardDraft(draft.purchase.id);
      router.replace('/(tabs)/purchases');
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível descartar a compra.' });
      setBusy(false);
    }
  }

  async function finishPurchase() {
    if (!draft) return;
    setBusy(true);
    try {
      await purchaseService.completeDraft(draft.purchase.id);
      router.replace('/(tabs)/purchases');
    } catch {
      setFinishVisible(false);
      setFeedback({ tone: 'danger', message: 'Não foi possível finalizar a compra.' });
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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar para Compras"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.replace('/(tabs)/purchases')}
          style={styles.headerButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Pressable
          accessibilityHint="Permite trocar o mercado"
          accessibilityRole="button"
          onPress={openMarketPicker}
          style={styles.marketHeading}
        >
          <Text style={styles.title}>Compra em andamento</Text>
          <Text numberOfLines={1} style={styles.marketName}>
            {currentMarket?.name ?? 'Mercado não disponível'} · Alterar
          </Text>
        </Pressable>
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

      <View style={styles.content}>
        <SearchInput
          accessibilityLabel="Buscar no carrinho"
          onChangeText={setQuery}
          placeholder="Buscar no carrinho..."
          value={query}
        />

        {cartItems.length === 0 ? (
          <View style={styles.centered}>
            <EmptyState
              description="Adicione o primeiro produto para acompanhar o total."
              icon="＋"
              title="Seu carrinho está vazio"
            />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.centered}>
            <EmptyState
              description="Tente buscar por outro nome, marca ou categoria."
              icon="⌕"
              title="Nenhum item encontrado"
            />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.list}
            data={filteredItems}
            keyboardShouldPersistTaps="handled"
            keyExtractor={({ item }) => item.id}
            renderItem={({ item: cartItem }) => (
              <PurchaseItemRow
                comparison={cartItem.comparison}
                details={cartItem.product ? formatProductDetails(cartItem.product) : null}
                highlighted={
                  highlightedItemId !== dismissedHighlightId &&
                  cartItem.item.id === highlightedItemId
                }
                name={cartItem.product?.name ?? 'Produto não disponível'}
                onPress={() =>
                  router.push({
                    pathname: '/purchases/[id]/item',
                    params: { id: purchaseId, itemId: cartItem.item.id },
                  })
                }
                onPressActions={() => openItemActions(cartItem)}
                priceLabel={formatComparablePrice(cartItem)}
                quantityLabel={formatQuantityMilli(
                  cartItem.item.quantityMilli,
                  cartItem.item.quantityUnit,
                )}
                totalPriceCents={cartItem.item.totalPriceCents}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {feedback ? (
        <View style={styles.feedback}>
          <FeedbackToast message={feedback.message} tone={feedback.tone} />
        </View>
      ) : null}

      <PurchaseTotalBar
        canFinish={(draft?.items.length ?? 0) > 0}
        finishing={busy && finishVisible}
        onAddProduct={() =>
          router.push({ pathname: '/purchases/[id]/item', params: { id: purchaseId } })
        }
        onFinish={() => setFinishVisible(true)}
        totalPriceCents={draft?.totalPriceCents ?? 0}
      />

      <BottomSheet
        showCloseButton
        onRequestClose={() => setMenuVisible(false)}
        title="Ações da compra"
        visible={menuVisible}
      >
        <View style={styles.menuActions}>
          <AppButton onPress={openMarketPicker} title="Alterar mercado" tone="secondary" />
          <AppButton
            onPress={() => {
              setMenuVisible(false);
              setDiscardVisible(true);
            }}
            title="Descartar compra"
            tone="danger"
          />
        </View>
      </BottomSheet>

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

      <MarketSelectionSheet
        confirming={busy}
        createFormProps={{
          values: marketFormValues,
          errors: marketFormErrors,
          hint: marketFormErrors.name
            ? 'Informe um nome diferente para continuar.'
            : 'Use um nome que ajude a identificar o mercado.',
          loading: busy,
          onChangeField: (_field, value) => {
            setMarketFormValues({ name: value });
            setMarketFormErrors({});
          },
          onSubmit: () => void saveMarket(),
          submitLabel: 'Salvar mercado',
        }}
        markets={filteredMarkets}
        mode={marketPickerMode}
        onCancelCreate={() => setMarketPickerMode('select')}
        onChangeQuery={setMarketQuery}
        onConfirm={() => void changeMarket()}
        onRequestClose={() => setMarketPickerVisible(false)}
        onSelectMarket={setSelectedMarketId}
        onStartCreate={openCreateMarket}
        query={marketQuery}
        selectedMarketId={selectedMarketId}
        visible={marketPickerVisible}
      />

      <ConfirmationSheet
        confirmLabel="Remover item"
        loading={busy}
        message={`Deseja remover ${selectedItem?.product?.name ?? 'este produto'} da compra?`}
        onConfirm={() => void removeSelectedItem()}
        onRequestClose={() => setRemoveVisible(false)}
        title="Remover item?"
        tone="danger"
        visible={removeVisible}
      />
      <ConfirmationSheet
        confirmLabel="Descartar compra"
        loading={busy}
        message="Todos os itens deste rascunho serão removidos. Deseja continuar?"
        onConfirm={() => void discardPurchase()}
        onRequestClose={() => setDiscardVisible(false)}
        title="Descartar compra?"
        tone="danger"
        visible={discardVisible}
      />
      <ConfirmationSheet
        confirmLabel="Finalizar compra"
        loading={busy}
        message={`Confirme a compra no total de ${formatCurrencyFromCents(draft?.totalPriceCents ?? 0)}.`}
        onConfirm={() => void finishPurchase()}
        onRequestClose={() => setFinishVisible(false)}
        title="Finalizar compra?"
        visible={finishVisible}
      />
      <ConfirmationSheet
        confirmLabel="Restaurar mercado"
        loading={busy}
        message={`${restoreMarket?.name ?? 'Este mercado'} foi excluído. Deseja restaurá-lo?`}
        onConfirm={() => void restoreDeletedMarket()}
        onRequestClose={() => {
          setRestoreMarketVisible(false);
          setMarketPickerVisible(true);
        }}
        title="Restaurar mercado?"
        visible={restoreMarketVisible}
      />
    </SafeAreaView>
  );
}

function formatComparablePrice({ item, comparison }: CartItem): string {
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
  marketHeading: { flex: 1, alignItems: 'center', gap: 1 },
  title: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  marketName: { ...typography.caption, color: colors.primary },
  content: { flex: 1, gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  feedback: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  menuActions: { gap: spacing.md, paddingBottom: spacing.sm },
});
