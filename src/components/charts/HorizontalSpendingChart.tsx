import { truncateLabel } from '@/features/analytics/presentation';
import { colors, typography } from '@/theme';
import { formatCurrencyFromCents } from '@/utils/formatters';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export type HorizontalSpendingPoint = {
  label: string;
  valueCents: number;
};

type HorizontalSpendingChartProps = {
  points: HorizontalSpendingPoint[];
};

export function HorizontalSpendingChart({ points }: HorizontalSpendingChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(220, Math.min(width - 88, 560));
  const visiblePoints = points.slice(0, 10);
  const maximum = Math.max(...visiblePoints.map((point) => point.valueCents), 1);
  const data: barDataItem[] = visiblePoints.map((point) => ({
    value: point.valueCents,
    label: truncateLabel(point.label, 16),
    frontColor: colors.primary,
  }));

  return (
    <View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <BarChart
          barBorderRadius={5}
          barWidth={18}
          data={data}
          disablePress
          disableScroll
          endSpacing={8}
          height={Math.max(160, visiblePoints.length * 40)}
          hideRules
          hideYAxisText
          horizontal
          initialSpacing={8}
          isAnimated
          maxValue={maximum * 1.08}
          noOfSections={4}
          width={chartWidth}
          xAxisColor={colors.border}
          xAxisLabelTextStyle={styles.axisLabel}
          xAxisTextNumberOfLines={2}
          xAxisThickness={1}
          yAxisThickness={0}
        />
      </View>
      <View
        accessible
        accessibilityLabel={accessibleSummary(visiblePoints)}
        style={styles.srSummary}
      >
        <Text style={styles.srText}>Resumo textual disponível para leitor de tela.</Text>
      </View>
    </View>
  );
}

function accessibleSummary(points: HorizontalSpendingPoint[]): string {
  return `Gastos ordenados. ${points
    .map((point) => `${point.label}: ${formatCurrencyFromCents(point.valueCents)}`)
    .join('; ')}.`;
}

const styles = StyleSheet.create({
  axisLabel: { ...typography.caption, color: colors.textSecondary },
  srSummary: { height: 1, overflow: 'hidden' },
  srText: { fontSize: 1, color: 'transparent' },
});
