/**
 * Chart Widgets - Index
 * 
 * This file exports all chart widgets used by chart gadgets.
 */

// Import all chart widgets and components
import { AreaChartComponent, AreaChartWidget } from './AreaChart';
import { BarChartComponent, BarChartWidget } from './BarChart';
import { LineChartComponent, LineChartWidget } from './LineChart';
import { PieChartComponent, PieChartWidget } from './PieChart';

// Re-export widgets
export { AreaChartWidget, BarChartWidget, LineChartWidget, PieChartWidget };

// Re-export components
    export { AreaChartComponent, BarChartComponent, LineChartComponent, PieChartComponent };

// Export for easy access
export const chartWidgets = {
  lineChart: LineChartWidget,
  barChart: BarChartWidget,
  areaChart: AreaChartWidget,
  pieChart: PieChartWidget
}; 