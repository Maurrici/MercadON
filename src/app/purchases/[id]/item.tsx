import { AppButton } from '@/components/AppButton';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { type OptionPickerItem, OptionPickerSheet } from '@/components/OptionPickerSheet';
import { ProductForm, type ProductFormValues, ProductRow } from '@/components/product';
import {
  ProductAlreadyAddedNotice,
  PurchaseItemForm,
  type PurchaseItemFormValues,
} from '@/components/purchase';
import { SearchInput } from '@/components/SearchInput';
import {
  getMeasurementUnitLabel,
  MEASUREMENT_UNIT_METADATA,
  MEASUREMENT_UNITS,
  type MeasurementUnit,
} from '@/domain/enums/MeasurementUnit';
import type { Category } from '@/domain/models/Category';
import type { ProductListItem } from '@/domain/repositories/product.repository';
import { formatProductDetails } from '@/features/products/presentation';
import { toPurchaseItemFormValues } from '@/features/purchases/presentation';
import { useProductService } from '@/hooks/useProductService';
import { useCompletedPurchaseService } from '@/hooks/useCompletedPurchaseService';
import { usePurchaseItemService } from '@/hooks/usePurchaseItemService';
import { usePurchaseService } from '@/hooks/usePurchaseService';
import { ProductValidationError, type ProductFormErrors } from '@/services/product.service';
import {
  PurchaseItemValidationError,
  type PriceComparison,
} from '@/services/purchase-item.service';
import { colors, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Picker = 'unit' | 'category' | null;
type Feedback = { tone: 'success' | 'danger' | 'warning'; message: string } | null;

const UNIT_OPTIONS = MEASUREMENT_UNITS.map((unit) => ({
  value: unit,
  label: MEASUREMENT_UNIT_METADATA[unit].label,
})) satisfies readonly OptionPickerItem<MeasurementUnit>[];

const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  brand: '',
  commercializationType: 'FIXED',
  packageQuantity: '',
  packageUnit: null,
  categoryId: null,
};

const EMPTY_ITEM_FORM: PurchaseItemFormValues = { quantity: '', price: '' };

export default function PurchaseItemScreen() {
  const {
    id: purchaseId,
    itemId,
    mode,
  } = useLocalSearchParams<{
    id: string;
    itemId?: string;
    mode?: 'history';
  }>();
  const historyMode = mode === 'history';
  const router = useRouter();
  const purchaseService = usePurchaseService();
  const purchaseItemService = usePurchaseItemService();
  const productService = useProductService();
  const completedPurchaseService = useCompletedPurchaseService();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchaseProductIds, setPurchaseProductIds] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [query, setQuery] = useState('');
  const [itemValues, setItemValues] = useState<PurchaseItemFormValues>(EMPTY_ITEM_FORM);
  const [itemErrors, setItemErrors] = useState<
    Partial<Record<keyof PurchaseItemFormValues, string>>
  >({});
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [productFormValues, setProductFormValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [productFormErrors, setProductFormErrors] = useState<ProductFormErrors>({});
  const [productFormVisible, setProductFormVisible] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<ProductListItem | null>(null);
  const [restoreProductId, setRestoreProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      historyMode ? completedPurchaseService.getDetails(purchaseId) : purchaseService.getDraft(),
      productService.listProducts(),
      productService.listCategories(),
    ])
      .then(async ([draft, availableProducts, availableCategories]) => {
        if (!active) return;
        if (!draft || draft.purchase.id !== purchaseId) {
          setFeedback({ tone: 'danger', message: 'Compra em andamento não encontrada.' });
          return;
        }

        setProducts(availableProducts);
        setCategories(availableCategories);
        setPurchaseProductIds(new Set(draft.items.map((item) => item.productId)));

        if (itemId) {
          const item = draft.items.find((candidate) => candidate.id === itemId);
          const activeProduct = item
            ? availableProducts.find((candidate) => candidate.id === item.productId)
            : null;
          const archivedProduct =
            historyMode && item && !activeProduct
              ? await productService.getProduct(item.productId)
              : null;
          const product = activeProduct ?? archivedProduct;
          if (!item || !product) {
            setFeedback({ tone: 'danger', message: 'Item não encontrado para edição.' });
            return;
          }
          setSelectedProduct(product);
          setItemValues(toPurchaseItemFormValues(item));
        }
      })
      .catch(() => setFeedback({ tone: 'danger', message: 'Não foi possível carregar os dados.' }))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [completedPurchaseService, historyMode, itemId, productService, purchaseId, purchaseService]);

  useEffect(() => {
    if (!selectedProduct || alreadyAdded || !itemValues.quantity || !itemValues.price) {
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      const preview = historyMode
        ? completedPurchaseService.previewItem(purchaseId, selectedProduct.id, itemValues)
        : purchaseItemService.previewItem(purchaseId, selectedProduct.id, itemValues);
      preview
        .then((preview) => {
          if (!active) return;
          setComparison(preview.comparison);
          setPreviewTotal(preview.totalPriceCents);
        })
        .catch(() => {
          if (!active) return;
          setComparison(null);
          setPreviewTotal(null);
        });
    }, 180);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [
    alreadyAdded,
    completedPurchaseService,
    historyMode,
    itemValues,
    purchaseId,
    purchaseItemService,
    selectedProduct,
  ]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return normalized
      ? products.filter((product) =>
          [product.name, product.brand, product.categoryName].some((value) =>
            value?.toLocaleLowerCase('pt-BR').includes(normalized),
          ),
        )
      : products;
  }, [products, query]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
        description: category.description,
      })),
    [categories],
  );
  const unitLabel = productFormValues.packageUnit
    ? getMeasurementUnitLabel(productFormValues.packageUnit)
    : undefined;
  const categoryLabel = categories.find(
    (category) => category.id === productFormValues.categoryId,
  )?.name;

  function selectProduct(product: ProductListItem) {
    if (historyMode && purchaseProductIds.has(product.id)) {
      completedPurchaseService
        .getDetails(purchaseId)
        .then((details) => {
          const item = details.items.find((candidate) => candidate.productId === product.id);
          if (!item) throw new Error();
          setSelectedProduct(product);
          setItemValues(toPurchaseItemFormValues(item));
          setAlreadyAdded(false);
        })
        .catch(() => setFeedback({ tone: 'danger', message: 'Não foi possível abrir o item.' }));
      return;
    }
    setSelectedProduct(product);
    setAlreadyAdded(purchaseProductIds.has(product.id) && !itemId);
    setItemValues(EMPTY_ITEM_FORM);
    setItemErrors({});
    setComparison(null);
    setPreviewTotal(null);
  }

  function changeItemField<Key extends keyof PurchaseItemFormValues>(
    field: Key,
    value: PurchaseItemFormValues[Key],
  ) {
    setItemValues((current) => ({ ...current, [field]: value }));
    setItemErrors((current) => ({ ...current, [field]: undefined }));
    setComparison(null);
    setPreviewTotal(null);
  }

  function editExistingItem() {
    if (!selectedProduct) return;
    purchaseService
      .getDraft()
      .then((draft) => {
        const item = draft?.items.find((candidate) => candidate.productId === selectedProduct.id);
        if (!item) throw new Error();
        setItemValues(toPurchaseItemFormValues(item));
        setAlreadyAdded(false);
      })
      .catch(() => setFeedback({ tone: 'danger', message: 'Não foi possível abrir o item.' }));
  }

  async function incrementExistingItem() {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const result = await purchaseItemService.incrementFixedItem(purchaseId, selectedProduct.id);
      returnToCart(result.item.id);
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível aumentar a quantidade.' });
      setSaving(false);
    }
  }

  async function saveItem() {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const result = historyMode
        ? await completedPurchaseService.saveItem(purchaseId, selectedProduct.id, itemValues)
        : await purchaseItemService.saveItem(purchaseId, selectedProduct.id, itemValues);
      returnToCart(result.item.id);
    } catch (error) {
      if (error instanceof PurchaseItemValidationError) setItemErrors(error.errors);
      else setFeedback({ tone: 'danger', message: 'Não foi possível salvar o item.' });
      setSaving(false);
    }
  }

  function returnToCart(highlightedItemId: string) {
    if (historyMode) {
      router.replace({
        pathname: '/purchases/history/[id]',
        params: { id: purchaseId, highlightedItemId },
      });
      return;
    }
    router.replace({
      pathname: '/purchases/[id]',
      params: { id: purchaseId, highlightedItemId },
    });
  }

  function openProductForm() {
    setProductFormValues(EMPTY_PRODUCT_FORM);
    setProductFormErrors({});
    setProductFormVisible(true);
  }

  function changeProductField<Key extends keyof ProductFormValues>(
    field: Key,
    value: ProductFormValues[Key],
  ) {
    setProductFormValues((current) =>
      field === 'commercializationType' && current.commercializationType !== value
        ? {
            ...current,
            commercializationType: value as ProductFormValues['commercializationType'],
            packageQuantity: '',
            packageUnit: null,
          }
        : { ...current, [field]: value },
    );
    setProductFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function reloadProducts(preferredId?: string) {
    const availableProducts = await productService.listProducts();
    setProducts(availableProducts);
    const preferred = availableProducts.find((product) => product.id === preferredId);
    if (preferred) selectProduct(preferred);
  }

  async function saveProduct() {
    setSavingProduct(true);
    try {
      const result = await productService.save(productFormValues);
      if (result.status === 'duplicate') {
        const existing = products.find((product) => product.id === result.product.id) ?? null;
        setDuplicateProduct(existing);
        setProductFormVisible(false);
        return;
      }
      if (result.status === 'restorable') {
        setRestoreProductId(result.product.id);
        setProductFormVisible(false);
        return;
      }
      if (result.status === 'structure_locked') return;

      await reloadProducts(result.product.id);
      setProductFormVisible(false);
      setFeedback({ tone: 'success', message: 'Produto cadastrado e selecionado.' });
    } catch (error) {
      if (error instanceof ProductValidationError) setProductFormErrors(error.errors);
      else setFeedback({ tone: 'danger', message: 'Não foi possível salvar o produto.' });
    } finally {
      setSavingProduct(false);
    }
  }

  async function restoreProduct() {
    if (!restoreProductId) return;
    setSavingProduct(true);
    try {
      const product = await productService.restore(restoreProductId);
      await reloadProducts(product.id);
      setRestoreProductId(null);
      setFeedback({ tone: 'success', message: 'Produto restaurado e selecionado.' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível restaurar o produto.' });
    } finally {
      setSavingProduct(false);
    }
  }

  function useDuplicateProduct() {
    if (duplicateProduct) selectProduct(duplicateProduct);
    setDuplicateProduct(null);
  }

  function openPicker(nextPicker: Exclude<Picker, null>) {
    setProductFormVisible(false);
    setPicker(nextPicker);
  }

  function closePicker() {
    setPicker(null);
    setProductFormVisible(true);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
      >
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
          <Text style={styles.title}>{itemId ? 'Editar item' : 'Adicionar produto'}</Text>
        </View>

        {!selectedProduct ? (
          <View style={styles.selectionContent}>
            <SearchInput
              autoFocus
              accessibilityLabel="Buscar produtos"
              onChangeText={setQuery}
              placeholder="Buscar produtos..."
              value={query}
            />
            {filteredProducts.length > 0 ? (
              <ScrollView
                automaticallyAdjustKeyboardInsets
                contentContainerStyle={styles.productList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.count}>
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
                </Text>
                {filteredProducts.map((product) => (
                  <ProductRow
                    details={formatProductDetails(product)}
                    key={product.id}
                    name={product.name}
                    onPress={() => selectProduct(product)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.centered}>
                <EmptyState
                  description="Tente outro termo ou cadastre este produto."
                  icon="⌕"
                  title="Nenhum produto encontrado"
                />
              </View>
            )}
            <AppButton onPress={openProductForm} title="＋ Cadastrar produto" />
          </View>
        ) : (
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.selectedProduct}>
              <View style={styles.selectedIdentity}>
                <Text style={styles.selectedName}>{selectedProduct.name}</Text>
                <Text style={styles.selectedDetails}>{formatProductDetails(selectedProduct)}</Text>
              </View>
              {!itemId ? (
                <Pressable accessibilityRole="button" onPress={() => setSelectedProduct(null)}>
                  <Text style={styles.changeProduct}>Trocar</Text>
                </Pressable>
              ) : null}
            </View>

            {alreadyAdded ? (
              <ProductAlreadyAddedNotice
                commercializationType={selectedProduct.commercializationType}
                incrementing={saving}
                onEdit={editExistingItem}
                onIncrement={
                  selectedProduct.commercializationType === 'FIXED'
                    ? () => void incrementExistingItem()
                    : undefined
                }
                productName={selectedProduct.name}
              />
            ) : (
              <PurchaseItemForm
                commercializationType={selectedProduct.commercializationType}
                comparison={comparison}
                errors={itemErrors}
                loading={saving}
                measurementUnit={
                  selectedProduct.commercializationType === 'FIXED'
                    ? 'UNIT'
                    : (selectedProduct.packageUnit ?? 'UNIT')
                }
                onCancel={() => router.back()}
                onChangeField={changeItemField}
                onSubmit={() => void saveItem()}
                submitLabel={itemId ? 'Salvar alterações' : 'Adicionar à compra'}
                totalPriceCents={previewTotal}
                values={itemValues}
              />
            )}
          </ScrollView>
        )}

        {feedback ? (
          <View style={styles.feedback}>
            <FeedbackToast message={feedback.message} tone={feedback.tone} />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <BottomSheet
        scrollable
        showCloseButton
        onRequestClose={() => setProductFormVisible(false)}
        title="Novo produto"
        visible={productFormVisible}
      >
        <ProductForm
          categoryLabel={categoryLabel}
          errors={productFormErrors}
          loading={savingProduct}
          onCancel={() => setProductFormVisible(false)}
          onChangeField={changeProductField}
          onSelectCategory={() => openPicker('category')}
          onSelectUnit={() => openPicker('unit')}
          onSubmit={() => void saveProduct()}
          submitLabel="Salvar produto"
          unitLabel={unitLabel}
          values={productFormValues}
        />
      </BottomSheet>

      <OptionPickerSheet
        onRequestClose={closePicker}
        onSelect={(option) => {
          changeProductField('packageUnit', option.value);
          closePicker();
        }}
        options={UNIT_OPTIONS}
        selectedValue={productFormValues.packageUnit}
        title="Selecionar unidade"
        visible={picker === 'unit'}
      />
      <OptionPickerSheet
        onRequestClose={closePicker}
        onSelect={(option) => {
          changeProductField('categoryId', option.value);
          closePicker();
        }}
        options={categoryOptions}
        selectedValue={productFormValues.categoryId}
        title="Selecionar categoria"
        visible={picker === 'category'}
      />

      <ConfirmationSheet
        confirmLabel="Usar produto existente"
        message="Já existe um produto com a mesma identificação. Deseja usá-lo nesta compra?"
        onConfirm={useDuplicateProduct}
        onRequestClose={() => {
          setDuplicateProduct(null);
          setProductFormVisible(true);
        }}
        title="Produto já cadastrado"
        visible={duplicateProduct !== null}
      />
      <ConfirmationSheet
        confirmLabel="Restaurar produto"
        loading={savingProduct}
        message="Este produto foi excluído anteriormente. Deseja restaurá-lo e usá-lo nesta compra?"
        onConfirm={() => void restoreProduct()}
        onRequestClose={() => {
          setRestoreProductId(null);
          setProductFormVisible(true);
        }}
        title="Produto encontrado"
        visible={restoreProductId !== null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  keyboardArea: { flex: 1 },
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  selectionContent: { flex: 1, gap: spacing.lg, padding: spacing.lg },
  productList: { gap: spacing.sm, paddingBottom: spacing.lg },
  count: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
  formContent: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  selectedIdentity: { flex: 1, gap: 2 },
  selectedName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  selectedDetails: { ...typography.caption, color: colors.textSecondary },
  changeProduct: { ...typography.bodySmall, fontWeight: '700', color: colors.primary },
  feedback: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
