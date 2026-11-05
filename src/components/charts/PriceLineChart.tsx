import { formatCivilDate, formatNormalizedPrice } from '@/features/analytics/presentation';
import type { AnalyticPriceUnit, PriceHistoryOccurrence } from '@/services/analytics.service';
import { colors, typography } from '@/theme';
import { LineChart, type lineDataItem } from 'react-native-gifted-charts';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type PriceLineChartProps = {
  occurrences: PriceHistoryOccurrence[];
  unit: AnalyticPriceUnit;
};

export function PriceLineChart({ occurrences, unit }: PriceLineChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(220, Math.min(width - 88, 560));
  const maximum = Math.max(...occurrences.map((item) => item.normalizedPriceCents), 1);
  const data: lineDataItem[] = occurrences.map((item) => ({
    value: item.normalizedPriceCents,
    label: item.purchasedAt.slice(5).replace('-', '/'),
  }));

  return (
    <View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LineChart
          adjustToWidth
          color={colors.primary}
          curved={occurrences.length > 2}
          data={data}
          dataPointsColor={colors.primaryStrong}
          dataPointsRadius={4}
          disableScroll
          endSpacing={8}
          height={180}
          hideRules
          hideYAxisText
          initialSpacing={10}
          isAnimated
          maxValue={maximum * 1.12}
          noOfSections={4}
          parentWidth={chartWidth}
          spacing={Math.max(48, chartWidth / Math.max(data.length, 2))}
          thickness={3}
          width={chartWidth}
          xAxisColor={colors.border}
          xAxisLabelTextStyle={styles.axisLabel}
          xAxisThickness={1}
          yAxisThickness={0}
        />
      </View>
      <View
        accessible
        accessibilityLabel={accessibleSummary(occurrences, unit)}
        style={styles.srSummary}
      >
        <Text style={styles.srText}>Resumo textual disponível para leitor de tela.</Text>
      </View>
    </View>
  );
}

function accessibleSummary(occurrences: PriceHistoryOccurrence[], unit: AnalyticPriceUnit): string {
  return `Histórico de preço. ${occurrences
    .map(
      (item) =>
        `${formatCivilDate(item.purchasedAt)}: ${formatNormalizedPrice(
          item.normalizedPriceCents,
          unit,
        )} em ${item.marketName}`,
    )
    .join('; ')}.`;
}

const styles = StyleSheet.create({
  axisLabel: { ...typography.caption, color: colors.textSecondary },
  srSummary: { height: 1, overflow: 'hidden' },
  srText: { fontSize: 1, color: 'transparent' },
});
