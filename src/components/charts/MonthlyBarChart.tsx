import { formatShortMonth } from '@/features/analytics/presentation';
import type { MonthlySpendingPoint } from '@/services/analytics.service';
import { colors, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type MonthlyBarChartProps = {
  points: MonthlySpendingPoint[];
};

export function MonthlyBarChart({ points }: MonthlyBarChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(220, Math.min(width - 88, 560));
  const maximum = Math.max(...points.map((point) => point.totalPriceCents), 1);
  const data: barDataItem[] = points.map((point) => ({
    value: point.totalPriceCents,
    label: formatShortMonth(point.period.month),
    frontColor: point.period.isPartial ? colors.primary : '#BFDBFE',
  }));

  return (
    <View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <BarChart
          adjustToWidth
          barBorderRadius={5}
          barWidth={22}
          data={data}
          disablePress
          disableScroll
          endSpacing={4}
          height={150}
          hideRules
          hideYAxisText
          initialSpacing={8}
          isAnimated
          maxValue={maximum * 1.12}
          noOfSections={4}
          parentWidth={chartWidth}
          rulesColor={colors.border}
          width={chartWidth}
          xAxisColor={colors.border}
          xAxisLabelTextStyle={styles.axisLabel}
          xAxisThickness={1}
          yAxisThickness={0}
        />
      </View>
      <View accessible accessibilityLabel={accessibleSummary(points)} style={styles.srSummary}>
        <Text style={styles.srText}>Resumo textual disponível para leitor de tela.</Text>
      </View>
    </View>
  );
}

function accessibleSummary(points: MonthlySpendingPoint[]): string {
  return `Evolução dos gastos. ${points
    .map(
      (point) =>
        `${formatShortMonth(point.period.month)}: ${formatCurrencyFromCents(point.totalPriceCents)}${
          point.period.isPartial ? ', mês parcial' : ''
        }`,
    )
    .join('; ')}.`;
}

const styles = StyleSheet.create({
  axisLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
  srSummary: { height: 1, overflow: 'hidden' },
  srText: { fontSize: 1, color: 'transparent' },
});
