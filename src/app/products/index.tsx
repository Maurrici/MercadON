import { AppButton } from '@/components/AppButton';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { EmptyState } from '@/components/EmptyState';
import { FeedbackToast } from '@/components/FeedbackToast';
import { OptionPickerItem, OptionPickerSheet } from '@/components/OptionPickerSheet';
import { SearchInput } from '@/components/SearchInput';
import {
  ProductActionSheet,
  ProductForm,
  ProductFormValues,
  ProductRow,
} from '@/components/product';
import {
  getMeasurementUnitLabel,
  MEASUREMENT_UNIT_METADATA,
  MEASUREMENT_UNITS,
  type MeasurementUnit,
} from '@/domain/enums/MeasurementUnit';
import type { Category } from '@/domain/models/Category';
import type { ProductListItem } from '@/domain/repositories/product.repository';
import { useProductService } from '@/hooks/useProductService';
import { formatPackageQuantity, ProductValidationError } from '@/services/product.service';
import { colors, spacing, typography } from '@/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Picker = 'unit' | 'category' | null;
type Feedback = { tone: 'success' | 'danger' | 'warning'; message: string } | null;

const UNIT_OPTIONS = MEASUREMENT_UNITS.map((unit) => ({
  value: unit,
  label: MEASUREMENT_UNIT_METADATA[unit].label,
})) satisfies readonly OptionPickerItem<MeasurementUnit>[];

const EMPTY_FORM: ProductFormValues = {
  name: '',
  brand: '',
  commercializationType: 'FIXED',
  packageQuantity: '',
  packageUnit: null,
  categoryId: null,
};

export default function ProductsScreen() {
  const productService = useProductService();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [restoreProductId, setRestoreProductId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>(
    {},
  );
  const [formVisible, setFormVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [duplicateVisible, setDuplicateVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadData = useCallback(async () => {
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        productService.listProducts(),
        productService.listCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível carregar os produtos' });
    } finally {
      setLoading(false);
    }
  }, [productService]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      [product.name, product.brand, product.categoryName].some((value) =>
        value?.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
      ),
    );
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
  const unitLabel = formValues.packageUnit
    ? getMeasurementUnitLabel(formValues.packageUnit)
    : undefined;
  const categoryLabel = categories.find((category) => category.id === formValues.categoryId)?.name;

  function openCreateForm() {
    setEditingProductId(null);
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setFormVisible(true);
  }

  function openActions(product: ProductListItem) {
    setSelectedProduct(product);
    setActionsVisible(true);
  }

  function openEditForm() {
    if (!selectedProduct) return;
    setEditingProductId(selectedProduct.id);
    setFormValues({
      name: selectedProduct.name,
      brand: selectedProduct.brand ?? '',
      commercializationType: selectedProduct.commercializationType,
      packageQuantity: formatPackageQuantity(selectedProduct.packageQuantityMilli),
      packageUnit: selectedProduct.packageUnit,
      categoryId: selectedProduct.categoryId,
    });
    setFormErrors({});
    setActionsVisible(false);
    setFormVisible(true);
  }

  function changeFormField<Key extends keyof ProductFormValues>(
    field: Key,
    value: ProductFormValues[Key],
  ) {
    setFormValues((current) =>
      field === 'commercializationType' && current.commercializationType !== value
        ? {
            ...current,
            commercializationType: value as ProductFormValues['commercializationType'],
            packageQuantity: '',
            packageUnit: null,
          }
        : { ...current, [field]: value },
    );
    setFormErrors((current) =>
      field === 'commercializationType'
        ? { ...current, packageQuantity: undefined, packageUnit: undefined }
        : { ...current, [field]: undefined },
    );
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const result = await productService.save(formValues, editingProductId ?? undefined);
      if (result.status === 'duplicate') {
        setDuplicateVisible(true);
        return;
      }
      if (result.status === 'restorable') {
        setRestoreProductId(result.product.id);
        setRestoreVisible(true);
        return;
      }

      setFormVisible(false);
      await loadData();
      setFeedback({
        tone: 'success',
        message: editingProductId
          ? 'Produto atualizado com sucesso'
          : 'Produto cadastrado com sucesso',
      });
    } catch (error) {
      if (error instanceof ProductValidationError) {
        setFormErrors(error.errors);
      } else {
        setFeedback({ tone: 'danger', message: 'Não foi possível salvar o produto' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selectedProduct) return;
    try {
      await productService.delete(selectedProduct.id);
      setDeleteVisible(false);
      setSelectedProduct(null);
      await loadData();
      setFeedback({ tone: 'success', message: 'Produto excluído com sucesso' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível excluir o produto' });
    }
  }

  async function confirmRestore() {
    if (!restoreProductId) return;
    try {
      await productService.restore(restoreProductId);
      setRestoreVisible(false);
      setFormVisible(false);
      setRestoreProductId(null);
      await loadData();
      setFeedback({ tone: 'success', message: 'Produto restaurado com sucesso' });
    } catch {
      setFeedback({ tone: 'danger', message: 'Não foi possível restaurar o produto' });
    }
  }

  function handleSelectUnit(option: OptionPickerItem<MeasurementUnit>) {
    changeFormField('packageUnit', option.value);
    setPicker(null);
    setFormVisible(true);
  }

  function handleSelectCategory(option: OptionPickerItem) {
    changeFormField('categoryId', option.value);
    setPicker(null);
    setFormVisible(true);
  }

  function openPicker(nextPicker: Exclude<Picker, null>) {
    setFormVisible(false);
    setPicker(nextPicker);
  }

  function closePicker() {
    setPicker(null);
    setFormVisible(true);
  }

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
        <Text style={styles.title}>Produtos</Text>
      </View>

      <View style={styles.content}>
        <SearchInput
          accessibilityLabel="Buscar produtos"
          onChangeText={setQuery}
          placeholder="Buscar produtos..."
          value={query}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : filteredProducts.length > 0 ? (
          <>
            <Text style={styles.count}>{formatProductCount(filteredProducts.length)}</Text>
            <FlatList
              contentContainerStyle={styles.list}
              data={filteredProducts}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProductRow
                  details={formatDetails(item)}
                  name={item.name}
                  onPressActions={() => openActions(item)}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              description={
                query
                  ? 'Tente outro termo ou cadastre um produto.'
                  : 'Cadastre os produtos que você mais compra.'
              }
              icon={query ? '⌕' : '□'}
              title={query ? 'Nenhum produto encontrado' : 'Ainda não há produtos'}
            />
          </View>
        )}

        <View style={styles.footer}>
          {feedback ? <FeedbackToast message={feedback.message} tone={feedback.tone} /> : null}
          <AppButton onPress={openCreateForm} title="＋ Novo produto" />
        </View>
      </View>

      <ProductActionSheet
        onDelete={() => {
          setActionsVisible(false);
          setDeleteVisible(true);
        }}
        onEdit={openEditForm}
        onRequestClose={() => setActionsVisible(false)}
        productDetails={selectedProduct ? formatDetails(selectedProduct) : null}
        productName={selectedProduct?.name ?? ''}
        visible={actionsVisible}
      />

      <BottomSheet
        scrollable
        showCloseButton
        onRequestClose={() => setFormVisible(false)}
        title={editingProductId ? 'Editar produto' : 'Novo produto'}
        visible={formVisible}
      >
        <ProductForm
          categoryLabel={categoryLabel}
          errors={formErrors}
          loading={saving}
          onCancel={() => setFormVisible(false)}
          onChangeField={changeFormField}
          onSelectCategory={() => openPicker('category')}
          onSelectUnit={() => openPicker('unit')}
          onSubmit={() => void handleSubmit()}
          submitLabel={editingProductId ? 'Salvar alterações' : 'Salvar produto'}
          unitLabel={unitLabel}
          values={formValues}
        />
      </BottomSheet>

      <OptionPickerSheet
        onRequestClose={closePicker}
        onSelect={handleSelectUnit}
        options={UNIT_OPTIONS}
        selectedValue={formValues.packageUnit}
        title="Selecionar unidade"
        visible={picker === 'unit'}
      />
      <OptionPickerSheet
        onRequestClose={closePicker}
        onSelect={handleSelectCategory}
        options={categoryOptions}
        selectedValue={formValues.categoryId}
        title="Selecionar categoria"
        visible={picker === 'category'}
      />

      <ConfirmationSheet
        confirmLabel="Excluir produto"
        message={`Deseja excluir ${selectedProduct?.name ?? 'este produto'}? Você poderá restaurá-lo depois.`}
        onConfirm={() => void confirmDelete()}
        onRequestClose={() => setDeleteVisible(false)}
        title="Excluir produto?"
        tone="danger"
        visible={deleteVisible}
      />
      <ConfirmationSheet
        confirmLabel="Restaurar produto"
        message="Este produto foi excluído anteriormente. Deseja restaurá-lo?"
        onConfirm={() => void confirmRestore()}
        onRequestClose={() => setRestoreVisible(false)}
        title="Produto encontrado"
        visible={restoreVisible}
      />

      <BottomSheet onRequestClose={() => setDuplicateVisible(false)} visible={duplicateVisible}>
        <Text style={styles.noticeTitle}>Produto já cadastrado</Text>
        <Text style={styles.noticeText}>
          Já existe um produto com a mesma combinação de nome, marca e forma de comercialização.
        </Text>
        <Text style={styles.noticeText}>Altere os detalhes ou volte ao produto existente.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDuplicateVisible(false)}
          style={styles.noticeAction}
        >
          <Text style={styles.noticeActionLabel}>Continuar editando</Text>
        </Pressable>
      </BottomSheet>
    </SafeAreaView>
  );
}

function formatDetails(product: ProductListItem) {
  const unit = product.packageUnit ? getMeasurementUnitLabel(product.packageUnit) : null;
  const quantity = formatPackageQuantity(product.packageQuantityMilli);
  const commercialization =
    product.commercializationType === 'VARIABLE'
      ? unit
        ? `Vendido por ${unit}`
        : null
      : quantity && unit
        ? `${quantity} ${unit}`
        : null;
  return [product.brand, commercialization, product.categoryName].filter(Boolean).join(' · ');
}

function formatProductCount(count: number): string {
  return `${count} ${count === 1 ? 'produto' : 'produtos'}`;
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
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 13 },
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
    gap: 28,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  noticeTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: spacing.xs,
  },
  noticeText: {
    ...typography.bodySmall,
    fontSize: 15,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
    marginTop: spacing.xl,
  },
  noticeAction: { minHeight: 70, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  noticeActionLabel: { ...typography.body, fontWeight: '600', color: colors.primary },
});
