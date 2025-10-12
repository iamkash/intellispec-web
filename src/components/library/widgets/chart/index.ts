/**
 * Chart Widgets - Index
 * 
 * This file exports all chart widgets used by chart gadgets.
 */

import { LineChartWidget, LineChartComponent } from './LineChart';
import { BarChartWidget, BarChartComponent } from './BarChart';
import { AreaChartWidget, AreaChartComponent } from './AreaChart';
import { PieChartWidget, PieChartComponent } from './PieChart';

// Export widgets
export { LineChartWidget, BarChartWidget, AreaChartWidget, PieChartWidget };
export { LineChartComponent, BarChartComponent, AreaChartComponent, PieChartComponent };

// Export for easy access
export const chartWidgets = {
  lineChart: LineChartWidget,
  barChart: BarChartWidget,
  areaChart: AreaChartWidget,
  pieChart: PieChartWidget
}; 