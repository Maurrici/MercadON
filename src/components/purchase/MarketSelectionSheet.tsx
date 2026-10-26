import { AppButton } from '@/components/AppButton';
import { BottomSheet } from '@/components/BottomSheet';
import { MarketForm, type MarketFormProps } from '@/components/market/MarketForm';
import { SearchInput } from '@/components/SearchInput';
import { colors, radius, spacing, typography } from '@/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SelectableMarket = {
  id: string;
  name: string;
};

export type MarketSelectionSheetProps = {
  visible: boolean;
  mode: 'select' | 'create';
  query: string;
  markets: readonly SelectableMarket[];
  selectedMarketId: string | null;
  onChangeQuery: (value: string) => void;
  onSelectMarket: (marketId: string) => void;
  onConfirm: () => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onRequestClose: () => void;
  createFormProps: Omit<MarketFormProps, 'onCancel'>;
  createFeedback?: ReactNode;
  confirming?: boolean;
};

export function MarketSelectionSheet({
  visible,
  mode,
  query,
  markets,
  selectedMarketId,
  onChangeQuery,
  onSelectMarket,
  onConfirm,
  onStartCreate,
  onCancelCreate,
  onRequestClose,
  createFormProps,
  createFeedback,
  confirming = false,
}: MarketSelectionSheetProps) {
  return (
    <BottomSheet
      scrollable
      showCloseButton
      title={mode === 'create' ? 'Cadastrar mercado' : 'Selecionar mercado'}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      {mode === 'create' ? (
        <View style={styles.createContent}>
          {createFeedback}
          <MarketForm {...createFormProps} onCancel={onCancelCreate} />
        </View>
      ) : (
        <View style={styles.selectionContent}>
          <SearchInput
            accessibilityLabel="Buscar mercado"
            placeholder="Buscar mercado..."
            value={query}
            onChangeText={onChangeQuery}
          />

          <View accessibilityRole="radiogroup" style={styles.marketList}>
            {markets.length === 0 ? (
              <Text style={styles.emptyMessage}>Nenhum mercado encontrado.</Text>
            ) : (
              markets.map((market) => {
                const selected = market.id === selectedMarketId;
                return (
                  <Pressable
                    accessibilityLabel={market.name}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={market.id}
                    onPress={() => onSelectMarket(market.id)}
                    style={({ pressed }) => [
                      styles.marketOption,
                      selected && styles.marketOptionSelected,
                      pressed && styles.marketOptionPressed,
                    ]}
                  >
                    <Text aria-hidden style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? '●' : '○'}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.marketName, selected && styles.marketNameSelected]}
                    >
                      {market.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onStartCreate}
            style={({ pressed }) => [styles.createAction, pressed && styles.marketOptionPressed]}
          >
            <Text style={styles.createActionLabel}>+ Cadastrar novo mercado</Text>
          </Pressable>

          <AppButton
            disabled={!selectedMarketId}
            loading={confirming}
            onPress={onConfirm}
            title="Confirmar mercado"
          />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  selectionContent: { gap: spacing.lg, paddingBottom: spacing.sm },
  createContent: { paddingBottom: spacing.sm },
  marketList: { gap: spacing.sm },
  marketOption: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  marketOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  marketOptionPressed: { opacity: 0.76 },
  radio: { fontSize: 17, color: colors.textSecondary },
  radioSelected: { color: colors.primary },
  marketName: { ...typography.bodySmall, flex: 1, fontWeight: '600', color: colors.textPrimary },
  marketNameSelected: { color: colors.primary },
  emptyMessage: {
    ...typography.bodySmall,
    paddingVertical: spacing.xl,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  createAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  createActionLabel: { ...typography.bodySmall, fontWeight: '700', color: colors.primary },
});
