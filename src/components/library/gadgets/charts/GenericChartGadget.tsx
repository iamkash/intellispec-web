/**
 * Generic Chart Gadget
 * 
 * A comprehensive chart gadget that supports multiple chart types using ECharts.
 * Fully metadata-driven with no hardcoded business logic.
 */

import * as echarts from 'echarts';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import WorkspaceFilterContext, { WorkspaceFilterContextValue } from '../../../../contexts/WorkspaceFilterContext';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

export interface ChartDataSource {
  endpoint: string;
  method?: 'GET' | 'POST';
  body?: any;
  dataPath?: string;
}

export interface ChartAxis {
  type: 'category' | 'value' | 'time' | 'log';
  dataKey?: string;
  name?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  axisLabel?: {
    rotate?: number;
    fontSize?: number;
    interval?: number;
    formatter?: (value: any) => string;
  };
}

export interface ChartSeries {
  name: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'treemap' | 'gauge' | 'funnel';
  dataKey: string;
  color?: string;
  yAxisIndex?: number;
  label?: {
    show?: boolean;
    position?: string;
    fontSize?: number;
    formatter?: string;
    color?: string;
  };
  itemStyle?: any;
}

export interface DataZoomConfig {
  type: 'slider' | 'inside';
  xAxisIndex?: number | number[];
  yAxisIndex?: number | number[];
  start?: number; // Initial zoom start percentage (0-100)
  end?: number;   // Initial zoom end percentage (0-100)
  startValue?: number | string | Date; // Alternative to start/end percentages
  endValue?: number | string | Date;   // Alternative to start/end percentages
  orient?: 'horizontal' | 'vertical'; // For slider type
  show?: boolean; // Whether to show the dataZoom component
  realtime?: boolean; // Whether to update in real-time
  filterMode?: 'filter' | 'weakFilter' | 'empty' | 'none'; // Data filtering mode
  throttle?: number; // Throttle delay for real-time updates
  height?: number | string; // Height for slider type
  bottom?: number | string; // Bottom position for slider type
  handleSize?: number | string; // Size of drag handles
  handleStyle?: any; // Style for drag handles
  textStyle?: any; // Style for text labels
  backgroundColor?: string; // Background color
  fillerColor?: string; // Color of selected area
  borderColor?: string; // Border color
  selectedDataBackground?: {
    lineStyle?: any;
    areaStyle?: any;
  };
}

export interface ChartConfig {
  id: string;
  title: string;
  description?: string;
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'treemap' | 'gauge' | 'funnel' | 'mixed';
  dataSource: ChartDataSource;
  xAxis?: ChartAxis;
  yAxis?: ChartAxis | ChartAxis[];
  series: ChartSeries[];
  dataPath?: string;
  radar_data?: any;
  grid?: {
    left?: string;
    right?: string;
    bottom?: string;
    top?: string;
    containLabel?: boolean;
  };
  legend?: {
    show?: boolean;
    top?: number;
    bottom?: number;
    textStyle?: {
      color?: string;
      fontSize?: number;
      fontFamily?: string;
    };
    itemGap?: number;
  };
  // Data zoom configuration for interactive zooming
  dataZoom?: DataZoomConfig | DataZoomConfig[];
  // Simple zoom toggle - enables default zoom controls when true
  showZoomBar?: boolean;
  // Simple labels toggle - enables default label configuration when true
  showLabels?: boolean;
  // Simple legend toggle - enables default legend configuration when true
  showLegend?: boolean;
  // Aggregation configuration for time series data
  aggregationConfig?: {
    dateField: string; // e.g., "purchaseDate" - field containing the date to aggregate by
    arrayField?: string; // e.g., "lineItems" - array field to unwind (optional)
    valueField: string; // e.g., "lineItems.quantityPurchased" or "quantity" - field to sum
    resultField: string; // e.g., "total_quantity" - name for the aggregated result field
  };
  // Flattened metadata properties
  type?: 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'treemap' | 'gauge' | 'funnel';
  xField?: string;
  yField?: string;
  xLabel?: string;
  yLabel?: string;
  seriesName?: string;
  units?: string;
  nameField?: string;
  categoryField?: string;
  valueField?: string;
}

export interface GenericChartGadgetConfig extends GadgetConfig {
  charts: ChartConfig[];
  chartLayout?: 'single' | 'grid';
  columns?: number;
  height?: number;
  showAggregationToolbar?: boolean;
  defaultAggregationPeriod?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Reconstructs full ECharts configuration from flattened metadata
 *
 * Supports two metadata formats:
 *
 * 1. FLATTENED FORMAT (Ultra-compact):
 * ```json
 * {
 *   "type": "bar",
 *   "xField": "category",
 *   "yField": "value",
 *   "xLabel": "Category Axis",
 *   "yLabel": "Value Axis",
 *   "seriesName": "My Data"
 * }
 * ```
 *
 * 2. DETAILED FORMAT (Full control):
 * ```json
 * {
 *   "chartType": "bar",
 *   "xAxis": { "type": "category", "dataKey": "category", "name": "Category Axis" },
 *   "yAxis": { "type": "value", "name": "Value Axis" },
 *   "series": [{ "name": "My Data", "type": "bar", "dataKey": "value" }]
 * }
 * ```
 *
 * The flattened format automatically applies optimized defaults for the chart type.
 */
const reconstructChartConfig = (chart: ChartConfig): ChartConfig => {
  // If chart already has detailed configuration, use it as-is (backward compatibility)
  if (chart.xAxis && chart.yAxis && chart.series && chart.series.length > 0) {
    return chart;
  }

  // Reconstruct from flattened metadata with intelligent defaults
  const reconstructed: ChartConfig = {
    ...chart,
    chartType: chart.type || chart.chartType || 'bar',
    xAxis: chart.xAxis || {
      type: 'category',
      dataKey: chart.xField,
      name: chart.xLabel
    },
    yAxis: chart.yAxis || {
      type: 'value',
      name: chart.yLabel
    },
    series: chart.series || [{
      name: chart.seriesName || 'Data',
      type: chart.type || 'bar',
      dataKey: chart.yField || 'value'
    }]
  };

  return reconstructed;
};

// Aggregation Toolbar Component
const AggregationToolbar: React.FC<{
  aggregationPeriod: 'day' | 'week' | 'month' | 'quarter' | 'year';
  onAggregationChange: (period: 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
}> = ({ aggregationPeriod, onAggregationChange }) => {
  const periods = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' }
  ] as const;

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        gap: '8px',
        padding: '8px',
        backgroundColor: 'hsl(var(--card))',
        borderBottom: '1px solid hsl(var(--border))',
        alignItems: 'center'
      }
    },
    React.createElement(
      'span',
      {
        style: {
          fontSize: '12px',
          fontWeight: '500',
          color: 'hsl(var(--muted-foreground))',
          marginRight: '8px'
        }
      },
      'Aggregate by:'
    ),
    ...periods.map(period =>
      React.createElement(
        'button',
        {
          key: period.key,
          onClick: () => onAggregationChange(period.key),
          style: {
            padding: '4px 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: '4px',
            backgroundColor: aggregationPeriod === period.key ? 'hsl(var(--primary))' : 'hsl(var(--background))',
            color: aggregationPeriod === period.key ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }
        },
        period.label
      )
    )
  );
};

// Helper function to format chart titles for time series charts
const getFormattedTitle = (baseTitle: string, period: 'day' | 'week' | 'month' | 'quarter' | 'year'): string => {
  const periodLabels = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    quarter: 'Quarterly',
    year: 'Yearly'
  };

  const periodLabel = periodLabels[period] || period.charAt(0).toUpperCase() + period.slice(1);

  // For time series charts, use a more readable format
  if (baseTitle.toLowerCase().includes('over time') || baseTitle.toLowerCase().includes('emissions')) {
    return `${periodLabel} ${baseTitle.replace(/\s+Over\s+Time/i, '').replace(/\s+emissions/i, 'Emissions')}`;
  }

  // For other time series charts, append the period
  return `${baseTitle} (${periodLabel.toLowerCase()})`;
};

// Simplified ECharts canvas - initialize once, update option when data changes
const EChartCanvas: React.FC<{ chartId: string; option: any; height: string }>= ({ chartId, option, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Initialize chart once on mount
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    
    console.log('EChartCanvas: Initializing chart', { chartId });
    const instance = echarts.init(containerRef.current);
    chartRef.current = instance;
    
    const onResize = () => { 
      if (chartRef.current && !chartRef.current.isDisposed()) {
        chartRef.current.resize();
      }
    };
    
    window.addEventListener('resize', onResize);
    
    return () => {
      window.removeEventListener('resize', onResize);
      if (chartRef.current && !chartRef.current.isDisposed()) {
        console.log('EChartCanvas: Disposing chart', { chartId });
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update chart option when it changes
  useEffect(() => {
    if (!chartRef.current || chartRef.current.isDisposed() || !option) return;
    
    console.log('EChartCanvas: Setting/Updating option', { 
      chartId, 
      dataPoints: option.series?.[0]?.data?.length,
      firstDataPoint: option.series?.[0]?.data?.[0],
      xAxisData: option.xAxis?.data?.slice(0, 3)
    });
    
    // Clear and set new option
    chartRef.current.clear();
    chartRef.current.setOption(option, true, false);
    chartRef.current.resize();
  }, [option, chartId]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height, minHeight: '300px' }} 
      data-chart-id={chartId}
    />
  );
};

// Generic chart renderer component
const GenericChartRenderer: React.FC<{
  chart: ChartConfig;
  height?: number;
  showAggregationToolbar?: boolean;
  aggregationPeriod?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  onAggregationChange?: (period: 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
}> = ({ chart: originalChart, height, showAggregationToolbar, aggregationPeriod, onAggregationChange }) => {
  // Reconstruct full chart configuration from flattened metadata
  const chart = reconstructChartConfig(originalChart);


  // Removed direct DOM refs; use EChartCanvas
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeVersion, setThemeVersion] = useState(0);
  // Removed chartReady/ensureChartInstance; handled by EChartCanvas
  const [currentAggregationPeriod, setCurrentAggregationPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>(
    aggregationPeriod || 'month'
  );
  const [isLoading, setIsLoading] = useState(false); // Prevent concurrent API calls
  const lastAggregationPeriodRef = useRef<string>('');
  const lastRefreshTriggerRef = useRef<number>(0); // Track last refresh trigger to prevent duplicate calls
  const latestRequestIdRef = useRef<number>(0); // Prevent stale responses overwriting fresh data

  // Log initial aggregation period
  useEffect(() => {
}, []);

  // Get filter context
  const filterContext = useContext(WorkspaceFilterContext) as WorkspaceFilterContextValue | undefined;

  // Generate aggregation pipeline based on period - METADATA-DRIVEN APPROACH
  const generateAggregationPipeline = (period: 'day' | 'week' | 'month' | 'quarter' | 'year') => {

    // Use metadata-driven fields if available, fallback to hardcoded for backward compatibility
    const dateField = chart.aggregationConfig?.dateField || 'purchaseDate';
    const arrayField = chart.aggregationConfig?.arrayField !== undefined ? chart.aggregationConfig.arrayField : 'lineItems';
    const valueField = chart.aggregationConfig?.valueField !== undefined ? chart.aggregationConfig.valueField : `${arrayField}.quantityPurchased`;
    const resultField = chart.aggregationConfig?.resultField || 'total_quantity';

    // Helper function to handle both string and Date formats
    const createDateString = (fieldPath: string) => ({
      $cond: {
        if: { $eq: [{ $type: fieldPath }, "date"] },
        then: { $dateToString: { format: "%Y-%m-%d", date: fieldPath } },
        else: fieldPath
      }
    });

    // Helper function to handle both string and Date formats for date operations
    const createDateValue = (fieldPath: string) => ({
      $cond: {
        if: { $eq: [{ $type: fieldPath }, "date"] },
        then: fieldPath,
        else: { $dateFromString: { dateString: fieldPath } }
      }
    });

    // Use string operations only to avoid date conversion errors
    let substringLength: number = 7; // Default to month format
    let groupBy: any;

    switch (period) {
      case 'day':
        // Extract YYYY-MM-DD from ISO string
        substringLength = 10; // "2024-01-15"
        groupBy = { $substr: [`$${dateField}`, 0, substringLength] };
        break;
      case 'week':
        // For weekly: extract year and week number
        // Use ISO week calculation: YYYY-WWW format
        // Handle both string and Date formats
        const dateFieldPath = `$${dateField}`;
        groupBy = {
          $concat: [
            {
              $substr: [
                { $toString: createDateString(dateFieldPath) },
                0, 4
              ]
            }, // Year
            "-W",
            {
              $toString: {
                $ceil: {
                  $divide: [
                    { $dayOfYear: createDateValue(dateFieldPath) },
                    7
                  ]
                }
              }
            }
          ]
        };
        break;
      case 'month':
        // Extract YYYY-MM from ISO string
        substringLength = 7; // "2024-01"
        groupBy = { $substr: [`$${dateField}`, 0, substringLength] };
        break;
      case 'quarter':
        // For quarterly: extract year and calculate quarter
        // Handle both string and Date formats
        const quarterDateFieldPath = `$${dateField}`;
        groupBy = {
          $concat: [
            {
              $substr: [
                { $toString: createDateString(quarterDateFieldPath) },
                0, 4
              ]
            }, // Year
            "-Q",
            {
              $switch: {
                branches: [
                  { case: { $lte: [{ $substr: [{ $toString: createDateString(quarterDateFieldPath) }, 5, 2] }, "03"] }, then: "1" },
                  { case: { $lte: [{ $substr: [{ $toString: createDateString(quarterDateFieldPath) }, 5, 2] }, "06"] }, then: "2" },
                  { case: { $lte: [{ $substr: [{ $toString: createDateString(quarterDateFieldPath) }, 5, 2] }, "09"] }, then: "3" }
                ],
                default: "4"
              }
            }
          ]
        };
        break;
      case 'year':
        // Extract YYYY from ISO string
        substringLength = 4; // "2024"
        groupBy = { $substr: [`$${dateField}`, 0, substringLength] };
        break;
      default:
        // Default to month format
        groupBy = { $substr: [`$${dateField}`, 0, substringLength] };
    }

    // Build pipeline - include lookups and unwind if needed
    const pipeline: any[] = [];

    if (arrayField) {
      pipeline.push({ "$unwind": `$${arrayField}` });

      // Add paint specification lookup for emissions calculations
      if (resultField === 'total_emissions') {
pipeline.push({
          "$lookup": {
            "from": "documents",
            "let": { "paintSpecId": "$lineItems.paintSpecId" },
            "pipeline": [
              {
                "$match": {
                  "$expr": {
                    "$and": [
                      { "$eq": ["$id", "$$paintSpecId"] },
                      { "$eq": ["$type", "paint_specifications"] },
                      { "$ne": ["$deleted", true] }
                    ]
                  }
                }
              }
            ],
            "as": "paintSpec"
          }
        });
        pipeline.push({ "$unwind": "$paintSpec" });
}
    }

    pipeline.push({
      "$group": {
        "_id": groupBy,
        "period": {
          "$first": period === 'quarter' ?
            {
              $concat: [
                {
                  $substr: [
                    { $toString: createDateString(`$${dateField}`) },
                    0, 4
                  ]
                },
                "-Q",
                {
                  $switch: {
                    branches: [
                      { case: { $lte: [{ $substr: [{ $toString: createDateString(`$${dateField}`) }, 5, 2] }, "03"] }, then: "1" },
                      { case: { $lte: [{ $substr: [{ $toString: createDateString(`$${dateField}`) }, 5, 2] }, "06"] }, then: "2" },
                      { case: { $lte: [{ $substr: [{ $toString: createDateString(`$${dateField}`) }, 5, 2] }, "09"] }, then: "3" }
                    ],
                    default: "4"
                  }
                }
              ]
            } :
            period === 'week' ?
              {
                $concat: [
                  {
                    $substr: [
                      { $toString: createDateString(`$${dateField}`) },
                      0, 4
                    ]
                  },
                  "-W",
                  {
                    $toString: {
                      $ceil: {
                        $divide: [
                          { $dayOfYear: createDateValue(`$${dateField}`) },
                          7
                        ]
                      }
                    }
                  }
                ]
              } :
              period === 'day' ?
                { $toString: createDateString(`$${dateField}`) } :
                { $substr: [{ $toString: createDateString(`$${dateField}`) }, 0, substringLength] }
        },
        [resultField]: resultField === 'total_emissions'
          ? {
              "$sum": {
                "$multiply": [
                  `$${valueField}`,
                  { "$ifNull": ["$paintSpec.voc_content", 0] }
                ]
              }
            }
          : !valueField || valueField === '' 
            ? { "$sum": 1 }  // Count documents when no valueField specified
            : { "$sum": `$${valueField}` }
      }
    });

    pipeline.push({ "$sort": { "_id": 1 } });

    pipeline.push({
      "$project": {
        "_id": 0,
        "period": 1,
        [resultField]: 1
      }
    });
// Debug: Show the groupBy expression for verification
return pipeline;
  };

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
// Prevent concurrent API calls that could cause issues
    if (isLoading) {
return;
    }

    try {
      // Sequence guard: increment request id
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      setIsLoading(true);
      setLoading(true);
      setError(null);
// Authentication is handled by BaseGadget.makeAuthenticatedFetch

      const requestOptions: RequestInit = {
        method: chart.dataSource.method || 'GET',
      };

      let bodyWithFilters: any = null;

      // Add body for POST requests with filter context
      if (chart.dataSource.method === 'POST' && chart.dataSource.body) {
        bodyWithFilters = { ...chart.dataSource.body };

        // Generate or replace the pipeline with the current aggregation period
        if (showAggregationToolbar) {
          const newPipeline = generateAggregationPipeline(currentAggregationPeriod);

          // Set pipeline in the appropriate location
          if (bodyWithFilters.config) {
            bodyWithFilters.config.pipeline = newPipeline;
} else if (bodyWithFilters.pipeline !== undefined) {
            bodyWithFilters.pipeline = newPipeline;
} else {
            // Create config object if it doesn't exist
            bodyWithFilters.config = { pipeline: newPipeline };
}
        } else {
}

        // Add filter context if available (using same pattern as GenericKPIGadget)
        if (filterContext?.filters) {
// Process all filters and check if any have actual values
          const filters: Record<string, any> = {};

          Object.entries(filterContext.filters).forEach(([filterKey, filterObj]) => {

            const filterValue = filterObj?.value;
if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
              // Pass filter values with proper operator suffix for aggregation API
              if (Array.isArray(filterValue) && filterValue.length > 0) {
                // Add __in suffix for array values (multiselect filters)
                filters[`${filterKey}__in`] = filterValue;
} else if (!Array.isArray(filterValue)) {
                filters[filterKey] = filterValue;
} else {
}
            } else {
}
          });

          const hasActiveFilters = Object.keys(filters).length > 0;
// Only add filters if there are any active filters
          if (hasActiveFilters) {
            bodyWithFilters.filters = filters;
            console.log('Chart sending filters to aggregation API:', {
              chartId: chart.id,
              filters: filters,
              bodyWithFilters: bodyWithFilters
            });
} else {
            console.log('Chart has no active filters', { chartId: chart.id });
          }
        } else {
          console.log('Chart has no filter context', { chartId: chart.id });
}

        requestOptions.body = JSON.stringify(bodyWithFilters);
      } else {
      }

      // Log the exact request being sent
      console.log('Chart API request:', {
        chartId: chart.id,
        endpoint: chart.dataSource.endpoint,
        method: requestOptions.method,
        body: bodyWithFilters || null
      });
      
      // Use BaseGadget's authenticated fetch method
      const response = await BaseGadget.makeAuthenticatedFetch(chart.dataSource.endpoint, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('Chart API response:', {
        chartId: chart.id,
        requestId,
        fullResult: result,
        dataLength: result.data?.length || 0,
        filters: bodyWithFilters?.filters,
        config: bodyWithFilters?.config?.name
      });
      
      // Extract data using dataPath if specified
      let chartData = result;
      if (chart.dataSource.dataPath || chart.dataPath) {
        const path = chart.dataSource.dataPath || chart.dataPath;
const pathParts = path!.split('.');
        for (const part of pathParts) {
          if (chartData && typeof chartData === 'object') {
            chartData = chartData[part];
}
        }
      }

      // Validate data structure
      if (chart.xAxis?.dataKey && Array.isArray(chartData) && chartData.length > 0) {
        const sampleRecord = chartData[0];
        if (sampleRecord[chart.xAxis.dataKey] === undefined) {
} else {
}
      }

      chart.series.forEach(series => {
        if (Array.isArray(chartData) && chartData.length > 0) {
          const sampleRecord = chartData[0];
          if (sampleRecord[series.dataKey] === undefined) {
} else {
}
        }
      });

      const processedData = Array.isArray(chartData) ? chartData : [chartData];

      // Check if we got an empty result (same pattern as KPI gadget)
      if (processedData.length === 0 || (Array.isArray(result.data) && result.data.length === 0)) {
        console.log('Chart received empty data from API:', { chartId: chart.id, result });
      } else {
        console.log('Chart received data from API:', { 
          chartId: chart.id, 
          dataLength: processedData.length,
          firstItem: processedData[0]
        });
      }

      // Only apply if this is the latest request
      if (requestId === latestRequestIdRef.current) {
        console.log('Chart setting data:', {
          chartId: chart.id,
          processedDataLength: processedData.length,
          sampleData: processedData.slice(0, 3),
          filters: bodyWithFilters?.filters
        });
        setData(processedData);
      } else {
        // Ignore stale response
        console.log('Ignored stale chart response', { chartId: chart.id, requestId, latest: latestRequestIdRef.current });
      }
} catch (err) {
      const error = err as Error;
      // Only set error if latest request
      if (latestRequestIdRef.current !== 0) {
        setError(error.message);
      }
    } finally {
setLoading(false);
      setIsLoading(false);
    }
  }, [chart.dataSource.endpoint, chart.dataSource.method, chart.id, chart, currentAggregationPeriod, showAggregationToolbar, filterContext?.filters]); // Match KPI gadget pattern

  // Handle aggregation period change
  const handleAggregationChange = useCallback((period: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
setCurrentAggregationPeriod(period);
    if (onAggregationChange) {
      onAggregationChange(period);
    }
  }, [onAggregationChange, currentAggregationPeriod]);

  // Get theme colors from CSS custom properties
  const getThemeColors = () => {
    if (typeof window === 'undefined') return {};
    
    const getThemeColor = (variable: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    };

    return {
      primary: `hsl(${getThemeColor('--primary')})`,
      secondary: `hsl(${getThemeColor('--secondary')})`,
      accent: `hsl(${getThemeColor('--accent')})`,
      muted: `hsl(${getThemeColor('--muted')})`,
      foreground: `hsl(${getThemeColor('--foreground')})`,
      mutedForeground: `hsl(${getThemeColor('--muted-foreground')})`,
      border: `hsl(${getThemeColor('--border')})`,
      background: `hsl(${getThemeColor('--background')})`,
      card: `hsl(${getThemeColor('--card')})`,
      chart1: `hsl(${getThemeColor('--chart-1')})` || 'hsl(12 76% 61%)',
      chart2: `hsl(${getThemeColor('--chart-2')})` || 'hsl(173 58% 39%)',
      chart3: `hsl(${getThemeColor('--chart-3')})` || 'hsl(197 37% 24%)',
      chart4: `hsl(${getThemeColor('--chart-4')})` || 'hsl(43 74% 66%)',
      chart5: `hsl(${getThemeColor('--chart-5')})` || 'hsl(27 87% 67%)'
    };
  };

      // Generate ECharts option from chart config and data
  const generateEChartsOption = (chartData: any[]) => {
    const themeColors = getThemeColors();
    const chartColorPalette = [
      themeColors.primary,
      themeColors.chart1,
      themeColors.chart2,
      themeColors.chart3,
      themeColors.chart4,
      themeColors.chart5,
      themeColors.accent,
      themeColors.secondary
    ].filter(color => color && color !== 'hsl()');

    if (!chartData || chartData.length === 0) {
return {
        title: {
          text: 'No data available',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: themeColors.mutedForeground || '#999',
            fontSize: 14,
            fontFamily: 'Inter, system-ui, sans-serif'
          }
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: '60%',
          style: {
            text: 'Please check your filters or try refreshing the data',
            fontSize: 12,
            fill: themeColors.mutedForeground || '#666',
            fontFamily: 'Inter, system-ui, sans-serif'
          }
        },
        backgroundColor: 'transparent',
        xAxis: { show: false },
        yAxis: { show: false },
        series: []
      };
    }

    const option: any = {
      backgroundColor: 'transparent',
      color: chartColorPalette,
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicOut',
      animationDelay: 0,
      title: {
        text: showAggregationToolbar
          ? getFormattedTitle(chart.title, currentAggregationPeriod)
          : chart.title,
        left: 'center',
        top: 5,
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: themeColors.foreground || '#333',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      tooltip: {
        trigger: ['pie', 'radar', 'gauge', 'treemap', 'funnel'].includes(chart.chartType) ? 'item' : 'axis',
        axisPointer: ['pie', 'radar', 'gauge', 'treemap', 'funnel'].includes(chart.chartType) ? undefined : {
          type: chart.chartType === 'line' ? 'cross' : 'shadow',
          lineStyle: chart.chartType === 'line' ? {
            color: themeColors.border || '#e5e7eb',
            width: 1,
            type: 'dashed'
          } : undefined,
          shadowStyle: chart.chartType !== 'line' ? {
            color: themeColors.muted || 'rgba(0,0,0,0.1)',
            opacity: 0.2
          } : undefined
        },
        formatter: function(params: any) {
          // Helper function to format dates in tooltips
          const formatTooltipDate = (dateString: string) => {
            if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
              try {
                const date = new Date(dateString);
                if (!isNaN(date.getTime())) {
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                }
              } catch (e) {
                // Ignore date parsing errors
              }
            }
            return dateString; // Return original if not a date
          };

          // Determine units based on explicit units field, yLabel, or yField
          const getUnits = () => {
            // First check for explicit units field
            if (chart.units) {
              return chart.units;
            }

            // Then check yLabel for keywords
            if (chart.yLabel) {
              if (chart.yLabel.toLowerCase().includes('emissions') || chart.yLabel.toLowerCase().includes('lbs')) {
                return 'lbs';
              }
              if (chart.yLabel.toLowerCase().includes('paint quantity') || chart.yLabel.toLowerCase().includes('gal')) {
                return 'gal';
              }
            }

            // Finally check yField for keywords
            if (chart.yField && chart.yField.toLowerCase().includes('emissions')) {
              return 'lbs';
            }
            if (chart.yField && (chart.yField.toLowerCase().includes('voc_content') ||
                                 chart.yField.toLowerCase().includes('voc') ||
                                 chart.yField.toLowerCase().includes('grams'))) {
              return 'g/L';
            }

            // Check data source pipeline for unit hints
            if (chart.dataSource?.body?.config?.pipeline) {
              const pipeline = JSON.stringify(chart.dataSource.body.config.pipeline);
              if (pipeline.toLowerCase().includes('voc_content') ||
                  pipeline.toLowerCase().includes('$multiply') && pipeline.toLowerCase().includes('voc')) {
                return 'g/L';
              }
            }

            return ''; // default fallback
          };

          const units = getUnits();

          if (Array.isArray(params)) {
            const param = params[0];
            // For line charts, try different data properties
            const dateValue = param.name || param.axisValue || param.axisValueLabel || param.data?.period || param.data?.name;
            const formattedName = formatTooltipDate(dateValue);
            const value = typeof param.value === 'number' ? param.value.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 1
            }) : param.value;



            if (chart.chartType === 'bar') {
              return `<strong>${formattedName}</strong><br/>${param.seriesName}: ${value} ${units}`;
            } else {
              return `${formattedName}: ${value}`;
            }
          } else {
            const dateValue = params.name || params.axisValue || params.axisValueLabel || params.data?.period || params.data?.name;
            const formattedName = formatTooltipDate(dateValue);
            const value = typeof params.value === 'number' ? params.value.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 1
            }) : params.value;



            if (chart.chartType === 'bar') {
              return `<strong>${formattedName}</strong><br/>${params.seriesName}: ${value} ${units}`;
            } else {
              return `${formattedName}: ${value}`;
            }
          }
        },
        backgroundColor: themeColors.card || themeColors.background || '#fff',
        borderColor: themeColors.border || '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: {
          color: themeColors.foreground || '#333',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12
        },
        padding: [8, 12],
        extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);'
      },
      legend: {
        show: (() => {
          // If explicit legend config exists, use it
          if (chart.legend?.show !== undefined) {
            return chart.legend.show;
          }
          // If showLegend is explicitly set, use it
          if (chart.showLegend !== undefined) {
            return chart.showLegend;
          }
          // Default to false
          return false;
        })(),
        top: chart.legend?.top || (chart.chartType === 'bar' ? undefined : 25),
        bottom: chart.legend?.bottom || (chart.chartType === 'bar' ? 0 : undefined),
        data: chart.series.map(s => s.name),
        textStyle: {
          color: chart.legend?.textStyle?.color || themeColors.mutedForeground || '#666',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: chart.legend?.textStyle?.fontSize || 11
        },
        itemGap: chart.legend?.itemGap || 15
      },
      grid: {
        left: chart.grid?.left || (chart.chartType === 'pie' ? '3%' : '3%'),
        right: chart.grid?.right || (chart.chartType === 'pie' ? '3%' : '3%'),
        bottom: chart.grid?.bottom || (chart.chartType === 'pie' ? '3%' : (chart.chartType === 'bar' ? '12%' : '12%')),
        top: chart.grid?.top || (chart.chartType === 'pie' ? '10%' : '10%'),
        containLabel: chart.grid?.containLabel !== false,
        borderColor: themeColors.border || '#e5e7eb'
      }
    };

    // Add dataZoom configuration if enabled
    if (chart.dataZoom || chart.showZoomBar) {
      let dataZoomConfigs: DataZoomConfig[];

      // If explicit dataZoom is provided, use it
      if (chart.dataZoom) {
        dataZoomConfigs = Array.isArray(chart.dataZoom) ? chart.dataZoom : [chart.dataZoom];
      }
      // If showZoomBar is true, apply default zoom configuration
      else if (chart.showZoomBar) {
        dataZoomConfigs = [
          {
            type: 'slider',
            start: 0,
            end: 100,
            show: true,
            orient: 'horizontal',
            height: 20,
            bottom: 30,
            handleSize: '100%',
            realtime: true,
            filterMode: 'filter'
          },
          {
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'filter',
            realtime: true
          }
        ];
      } else {
        dataZoomConfigs = [];
      }

      option.dataZoom = dataZoomConfigs.map((zoomConfig, index) => {
        // Create default dataZoom configuration with theme integration
        const defaultConfig: any = {
          type: zoomConfig.type || 'slider',
          show: zoomConfig.show !== false,
          realtime: zoomConfig.realtime !== false,
          filterMode: zoomConfig.filterMode || 'filter',
          throttle: zoomConfig.throttle || 100,
          // Position and styling with theme integration
          backgroundColor: zoomConfig.backgroundColor || (zoomConfig.type === 'slider' ? themeColors.card || 'rgba(255,255,255,0.8)' : undefined),
          borderColor: zoomConfig.borderColor || themeColors.border || '#e5e7eb',
          fillerColor: zoomConfig.fillerColor || themeColors.primary + '20', // Add transparency
          handleStyle: {
            color: zoomConfig.handleStyle?.color || themeColors.primary || '#007acc',
            borderColor: zoomConfig.handleStyle?.borderColor || themeColors.primary || '#007acc',
            ...zoomConfig.handleStyle
          },
          textStyle: {
            color: zoomConfig.textStyle?.color || themeColors.mutedForeground || '#666',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: zoomConfig.textStyle?.fontSize || 11,
            ...zoomConfig.textStyle
          },
          selectedDataBackground: zoomConfig.selectedDataBackground || {
            lineStyle: {
              color: themeColors.primary || '#007acc',
              opacity: 0.3
            },
            areaStyle: {
              color: themeColors.primary + '10',
              opacity: 0.3
            }
          }
        };

        // Apply axis indices
        if (zoomConfig.xAxisIndex !== undefined) {
          defaultConfig.xAxisIndex = zoomConfig.xAxisIndex;
        }
        if (zoomConfig.yAxisIndex !== undefined) {
          defaultConfig.yAxisIndex = zoomConfig.yAxisIndex;
        }

        // Apply zoom range (start/end or startValue/endValue)
        if (zoomConfig.start !== undefined) {
          defaultConfig.start = zoomConfig.start;
        }
        if (zoomConfig.end !== undefined) {
          defaultConfig.end = zoomConfig.end;
        }
        if (zoomConfig.startValue !== undefined) {
          defaultConfig.startValue = zoomConfig.startValue;
        }
        if (zoomConfig.endValue !== undefined) {
          defaultConfig.endValue = zoomConfig.endValue;
        }

        // Slider-specific properties
        if (zoomConfig.type === 'slider') {
          defaultConfig.orient = zoomConfig.orient || 'horizontal';
          defaultConfig.height = zoomConfig.height || 20;
          defaultConfig.bottom = zoomConfig.bottom || 30;
          defaultConfig.handleSize = zoomConfig.handleSize || '100%';
        }

        return defaultConfig;
      });

      // Adjust grid bottom margin if slider dataZoom is present
      const hasSliderZoom = option.dataZoom.some((zoom: any) => zoom.type === 'slider');
      if (hasSliderZoom && !chart.grid?.bottom) {
        option.grid.bottom = '15%'; // Increase bottom margin for slider
      }
    }

    // Handle special chart types
    if (chart.chartType === 'treemap') {
      return {
        backgroundColor: 'transparent',
        color: chartColorPalette,
        title: option.title,
        tooltip: {
          formatter: '{b}: {c}',
          backgroundColor: themeColors.card || themeColors.background || '#fff',
          borderColor: themeColors.border || '#e5e7eb',
          textStyle: { color: themeColors.foreground || '#333' }
        },
        series: [{
          type: 'treemap',
          data: chartData.map(item => ({
            name: item.name || item[chart.series[0]?.dataKey] || 'Unknown',
            value: item.value || item[chart.series[0]?.dataKey] || 0
          }))
        }]
      };
    }

    if (chart.chartType === 'radar') {
      const radarData = chart.radar_data || chartData[0]?.radar_data || [];
      return {
        backgroundColor: 'transparent',
        color: chartColorPalette,
        title: option.title,
        tooltip: {
          backgroundColor: themeColors.card || themeColors.background || '#fff',
          borderColor: themeColors.border || '#e5e7eb',
          textStyle: { color: themeColors.foreground || '#333' }
        },
        radar: {
          indicator: radarData.map((item: any) => ({
            name: item.name,
            max: item.max || 100
          })),
          name: {
            textStyle: {
              color: themeColors.mutedForeground || '#666',
              fontFamily: 'Inter, system-ui, sans-serif'
            }
          },
          axisLine: {
            lineStyle: { color: themeColors.border || '#e5e7eb' }
          },
          splitLine: {
            lineStyle: { color: themeColors.border || '#e5e7eb' }
          }
        },
        series: [{
          type: 'radar',
          data: [{
            value: radarData.map((item: any) => item.value),
            name: chart.title
          }]
        }]
      };
    }

    if (chart.chartType === 'gauge') {
      const gaugeValue = chartData[0]?.score || chartData[0]?.value || 0;
      return {
        backgroundColor: 'transparent',
        series: [{
          type: 'gauge',
          data: [{ value: gaugeValue, name: chart.title }],
          detail: { 
            fontSize: 20,
            color: themeColors.foreground || '#333'
          },
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, themeColors.chart1 || '#67e0e3'], 
                [0.7, themeColors.chart2 || '#37a2da'], 
                [1, themeColors.chart3 || '#fd666d']
              ]
            }
          },
          axisTick: {
            lineStyle: { color: themeColors.border || '#e5e7eb' }
          },
          axisLabel: {
            color: themeColors.mutedForeground || '#666'
          }
        }]
      };
    }

    // Standard charts (line, bar, pie, scatter, mixed)
    if (chart.xAxis && chart.xAxis.dataKey) {
      if (chart.xAxis.type === 'category') {
        option.xAxis = {
          type: 'category',
          data: chartData.map(item => item[chart.xAxis!.dataKey!]),
          name: chart.xAxis.name,
          nameTextStyle: {
            color: themeColors.mutedForeground || '#666',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12
          },
          axisLabel: {
            color: themeColors.mutedForeground || '#666',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: chart.xAxis?.axisLabel?.fontSize || (chart.chartType === 'bar' ? 11 : 11),
            rotate: chart.xAxis?.axisLabel?.rotate !== undefined ? chart.xAxis.axisLabel.rotate : (chart.chartType === 'bar' ? 0 : 0),
            interval: chart.xAxis?.axisLabel?.interval !== undefined ? chart.xAxis.axisLabel.interval : (chart.chartType === 'bar' ? 0 : 0),
            margin: chart.chartType === 'bar' ? 8 : 6,
            formatter: function(value: string) {
              // Simple date detection and formatting
              if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                try {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  }
                } catch (e) {
                  // Ignore date parsing errors
                }
              }

              // Default text truncation for non-dates
              const maxLength = chart.chartType === 'bar' ? 12 : 15;
              if (value && value.length > maxLength) {
                return value.substring(0, maxLength - 3) + '...';
              }
              return value;
            }
          },
          axisLine: {
            lineStyle: { color: themeColors.border || '#e5e7eb' }
          },
          axisTick: {
            lineStyle: { color: themeColors.border || '#e5e7eb' }
          }
        };
      } else {
        option.xAxis = {
          type: chart.xAxis.type,
          name: chart.xAxis.name,
          nameTextStyle: {
            color: themeColors.mutedForeground || '#666',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12
          },
          axisLabel: {
            color: themeColors.mutedForeground || '#666',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11
          },
          axisLine: {
            lineStyle: { color: themeColors.border || '#e5e7eb' }
          },
          axisTick: {
            lineStyle: { color: themeColors.border || '#e5e7eb' }
          }
        };
      }
    } else {
      // Fallback xAxis for charts without explicit xAxis config
      option.xAxis = {
        type: 'category',
        data: chartData.map((_, index) => `Item ${index + 1}`),
        axisLabel: {
          color: themeColors.mutedForeground || '#666',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11,
          rotate: 0, // Default to no rotation for fallback
          interval: 0,
          margin: chart.chartType === 'bar' ? 15 : 8
        },
        axisLine: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        },
        axisTick: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        }
      };
    }

    // Y-axis configuration
    if (Array.isArray(chart.yAxis)) {
      option.yAxis = chart.yAxis.map(axis => ({
        type: axis.type,
        name: axis.name,
        position: axis.position,
        nameTextStyle: {
          color: themeColors.mutedForeground || '#666',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12
        },
        axisLabel: {
          color: themeColors.mutedForeground || '#666',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11
        },
        axisLine: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        },
        axisTick: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        },
        splitLine: {
          lineStyle: { 
            color: themeColors.border || '#e5e7eb',
            opacity: 0.3
          }
        }
      }));
    } else if (chart.yAxis) {
      option.yAxis = {
        type: chart.yAxis.type,
        name: chart.yAxis.name,
        nameTextStyle: {
          color: themeColors.mutedForeground || '#666',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12
        },
        axisLabel: {
          color: themeColors.mutedForeground || '#666',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11,
          formatter: function(value: any) {
            // Use explicit formatter if provided
            if (!Array.isArray(chart.yAxis) && chart.yAxis?.axisLabel?.formatter) {
              try {
                const formatter = chart.yAxis.axisLabel.formatter;
                if (typeof formatter === 'function') {
                  return formatter(value);
                } else if (typeof formatter === 'string') {
                  return (formatter as string).replace('{value}', value.toString());
                }
              } catch (e) {
                // If formatter fails, continue to automatic detection
              }
            }

            // Determine units based on explicit units field, yLabel, or yField
            const getUnits = () => {
              // First check for explicit units field
              if (chart.units) {
                return chart.units;
              }

              // Then check yLabel for keywords
              if (chart.yLabel) {
                if (chart.yLabel.toLowerCase().includes('emissions') || chart.yLabel.toLowerCase().includes('lbs')) {
                  return 'lbs';
                }
                if (chart.yLabel.toLowerCase().includes('gal') || chart.yLabel.toLowerCase().includes('quantity')) {
                  return 'gal';
                }
                if (chart.yLabel.toLowerCase().includes('grams') || chart.yLabel.toLowerCase().includes('g/l')) {
                  return 'g/L';
                }
              }

              // Finally check yField for keywords and data source
              if (chart.yField && chart.yField.toLowerCase().includes('emissions')) {
                return 'lbs';
              }
              if (chart.yField && (chart.yField.toLowerCase().includes('voc_content') ||
                                   chart.yField.toLowerCase().includes('voc') ||
                                   chart.yField.toLowerCase().includes('grams'))) {
                return 'g/L';
              }

              // Check data source pipeline for unit hints
              if (chart.dataSource?.body?.config?.pipeline) {
                const pipeline = JSON.stringify(chart.dataSource.body.config.pipeline);
                if (pipeline.toLowerCase().includes('voc_content') ||
                    pipeline.toLowerCase().includes('$multiply') && pipeline.toLowerCase().includes('voc')) {
                  return 'g/L';
                }
              }

              return ''; // default fallback
            };

            const units = getUnits();
            return `${value} ${units}`;
          }
        },
        axisLine: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        },
        axisTick: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        },
        splitLine: {
          lineStyle: {
            color: themeColors.border || '#e5e7eb',
            opacity: 0.3
          }
        }
      };
    } else {
      option.yAxis = {
        type: 'value',
        axisLabel: {
          color: themeColors.mutedForeground || '#666',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11,
          formatter: function(value: any) {
            // Determine units based on explicit units field, yLabel, or yField
            const getUnits = () => {
              // First check for explicit units field
              if (chart.units) {
                return chart.units;
              }

              // Then check yLabel for keywords
              if (chart.yLabel) {
                if (chart.yLabel.toLowerCase().includes('emissions') || chart.yLabel.toLowerCase().includes('lbs')) {
                  return 'lbs';
                }
                if (chart.yLabel.toLowerCase().includes('gal') || chart.yLabel.toLowerCase().includes('quantity')) {
                  return 'gal';
                }
                if (chart.yLabel.toLowerCase().includes('grams') || chart.yLabel.toLowerCase().includes('g/l')) {
                  return 'g/L';
                }
              }

              // Finally check yField for keywords and data source
              if (chart.yField && chart.yField.toLowerCase().includes('emissions')) {
                return 'lbs';
              }
              if (chart.yField && (chart.yField.toLowerCase().includes('voc_content') ||
                                   chart.yField.toLowerCase().includes('voc') ||
                                   chart.yField.toLowerCase().includes('grams'))) {
                return 'g/L';
              }

              // Check data source pipeline for unit hints
              if (chart.dataSource?.body?.config?.pipeline) {
                const pipeline = JSON.stringify(chart.dataSource.body.config.pipeline);
                if (pipeline.toLowerCase().includes('voc_content') ||
                    pipeline.toLowerCase().includes('$multiply') && pipeline.toLowerCase().includes('voc')) {
                  return 'g/L';
                }
              }

              return ''; // default fallback
            };

            const units = getUnits();
            return `${value} ${units}`;
          }
        },
        axisLine: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        },
        axisTick: {
          lineStyle: { color: themeColors.border || '#e5e7eb' }
        },
        splitLine: {
          lineStyle: {
            color: themeColors.border || '#e5e7eb',
            opacity: 0.3
          }
        }
      };
    }

    // Series configuration
    option.series = chart.series.map((series, index) => {
      // Use theme colors with fallback to series-specific color
      let assignedColor = chartColorPalette[index % chartColorPalette.length];
      
      // If series has a specific color that's not a CSS variable, use it
      if (series.color && !series.color.includes('var(--')) {
        assignedColor = series.color;
      }
      
      const seriesConfig: any = {
        name: series.name,
        type: series.type,
        data: chartData.map(item => item[series.dataKey]),
        itemStyle: {
          color: assignedColor
        },
        emphasis: {
          itemStyle: {
            color: assignedColor,
            borderColor: themeColors.foreground || '#333',
            borderWidth: ['bar', 'line'].includes(series.type) ? 1 : 0,
            shadowBlur: series.type === 'line' ? 8 : 5,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          lineStyle: series.type === 'line' ? {
            width: 3,
            shadowBlur: 5,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          } : undefined
        }
      };

      // Add yAxisIndex for dual-axis charts
      if (series.yAxisIndex !== undefined) {
        seriesConfig.yAxisIndex = series.yAxisIndex;
      }

      // Add label configuration
      const shouldShowLabels = (() => {
        // If explicit series label config exists, use it
        if (series.label?.show !== undefined) {
          return series.label.show;
        }
        // If showLabels is explicitly set to true, show labels
        if (chart.showLabels === true) {
          return true;
        }
        // If showLabels is explicitly set to false, don't show labels
        if (chart.showLabels === false) {
          return false;
        }
        // Default behavior for bar charts (backward compatibility)
        if (series.type === 'bar') {
          return true;
        }
        // Default to false for other chart types
        return false;
      })();

      if (shouldShowLabels) {
        // If explicit label config exists, use it
        if (series.label) {
          seriesConfig.label = {
            show: series.label.show,
            position: series.label.position || (series.type === 'bar' ? 'insideTop' : 'top'),
            fontSize: series.label.fontSize || (series.type === 'bar' ? 10 : 12),
            color: series.label.color || themeColors.foreground || '#333',
            fontFamily: 'Inter, system-ui, sans-serif',
            formatter: series.label.formatter || (series.type === 'bar' ? '{c}' : '{c}')
          };
        }
        // Apply default configuration
        else {
          seriesConfig.label = {
            show: true,
            position: series.type === 'bar' ? 'insideTop' : 'top',
            fontSize: series.type === 'bar' ? 10 : 12,
            color: themeColors.foreground || '#333',
            fontFamily: 'Inter, system-ui, sans-serif',
            formatter: series.type === 'bar' ? '{c}' : '{c}'
          };
        }
      }

      // Add itemStyle for bar charts
      if (series.type === 'bar' && !series.itemStyle) {
        seriesConfig.itemStyle = {
          borderRadius: [4, 4, 0, 0],
          color: series.color || chartColorPalette[index % chartColorPalette.length]
        };
      }

      return seriesConfig;
    });

    // Special handling for pie charts
    if (chart.chartType === 'pie') {
      // Override animation settings for pie charts to reduce flickering
      option.animation = true;
      option.animationDuration = 200;
      option.animationEasing = 'quadraticOut';
      option.animationThreshold = 2000;
      
      option.tooltip = {
        trigger: 'item',
        formatter: '<strong>{b}</strong><br/>{c} ({d}%)',
        backgroundColor: themeColors.card || themeColors.background || '#fff',
        borderColor: themeColors.border || '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: {
          color: themeColors.foreground || '#333',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12
        },
        padding: [8, 12],
        extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);',
        hideDelay: 100,
        enterable: false
      };
      
      option.series = chart.series.map(series => ({
        name: series.name,
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        hoverAnimation: true,
        hoverOffset: 3,
        itemStyle: {
          borderRadius: 3,
          borderColor: themeColors.background || '#fff',
          borderWidth: 1
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{d}%',
          fontSize: 10,
          color: '#fff',
          fontWeight: 'bold',
          fontFamily: 'Inter, system-ui, sans-serif',
          distance: 5
        },
        emphasis: {
          scale: false,
          focus: 'self',
          itemStyle: {
            shadowBlur: 8,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            borderWidth: 2,
            borderColor: themeColors.background || '#fff'
          },
          label: {
            show: true,
            fontSize: 11,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData.map(item => ({
          name: item[chart.nameField || chart.categoryField || chart.xAxis?.dataKey || '_id'] || 'Unknown',
          value: item[chart.valueField || series.dataKey || 'count'] || 0
        }))
      }));
      delete option.xAxis;
      delete option.yAxis;
    }

    return option;
  };

  // Remove old ECharts instance effects; EChartCanvas handles lifecycle


  // Fetch data on mount
  useEffect(() => {
fetchChartData();
  }, []); // Empty dependency - only run on mount

  // Refetch data when aggregation period changes
  useEffect(() => {
    if (showAggregationToolbar && currentAggregationPeriod && !isLoading) {
      // Prevent duplicate calls for the same period
      if (lastAggregationPeriodRef.current === currentAggregationPeriod) {
return;
      }
lastAggregationPeriodRef.current = currentAggregationPeriod;
      fetchChartData(); // Actually call fetchChartData to refetch with new aggregation
    }
  }, [currentAggregationPeriod, showAggregationToolbar]); // Remove isLoading to prevent unnecessary re-runs

  // Listen to filter changes via refreshTrigger with debouncing
  useEffect(() => {
    if (!filterContext) return;
    
    const currentTrigger = filterContext.refreshTrigger || 0;
    
    // Only log if trigger actually changed
    if (currentTrigger !== lastRefreshTriggerRef.current) {
      console.log('Chart refreshTrigger changed:', {
        chartId: chart.id,
        refreshTrigger: currentTrigger,
        lastTrigger: lastRefreshTriggerRef.current,
        hasFilterContext: !!filterContext,
        filters: filterContext?.filters
      });
    }
    
    if (currentTrigger > 0 && currentTrigger !== lastRefreshTriggerRef.current) {
      console.log('Chart will refresh due to filter change:', {
        chartId: chart.id,
        newTrigger: currentTrigger,
        oldTrigger: lastRefreshTriggerRef.current
      });

      // Update the ref to prevent duplicate calls
      lastRefreshTriggerRef.current = currentTrigger;

      // Reset the aggregation period tracking when filters change to ensure fresh data
      lastAggregationPeriodRef.current = '';

      // Debounce the fetch to avoid rapid re-fetches
      const timeoutId = setTimeout(() => {
        fetchChartData();
      }, 300); // Increased delay for better debouncing

      return () => clearTimeout(timeoutId);
    }
  }, [filterContext?.refreshTrigger, chart.id, fetchChartData]); // Include fetchChartData in deps

  // Removed duplicate filter listener - refreshTrigger handles filter changes

  // Theme change detection
  useEffect(() => {
    const detectThemeChange = () => {
      setThemeVersion(prev => prev + 1);
    };

    // Listen for theme changes via class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          detectThemeChange();
        }
      });
    });

    const htmlElement = document.documentElement;
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Also listen for storage events (if theme is stored in localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' || e.key === 'vite-ui-theme') {
        detectThemeChange();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset tracking refs on unmount
      lastAggregationPeriodRef.current = '';
      lastRefreshTriggerRef.current = 0;
    };
  }, []);

  // Safety mechanism to reset loading state if it gets stuck
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setLoading(false);
        setIsLoading(false);
        setError('Request timed out');
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, chart.id]);

  /*
   * FILTERING FIXES APPLIED:
   *
   * 1. Fixed useEffect dependencies to prevent infinite loops
   *    - Changed from `chart` object to `chart.id` to avoid object reference changes
   *    - Used specific chart properties instead of whole objects
   *
   * 2. Added duplicate call prevention with refs
   *    - `lastRefreshTriggerRef` prevents processing the same trigger multiple times
   *    - Added small delay to ensure filters are fully updated before fetching
   *
   * 3. Improved filter processing logic
   *    - Better handling of different filter value formats (value, values, direct arrays)
   *    - More comprehensive validation of filter values
   *    - Enhanced debugging logs for troubleshooting
   *
   * 4. Added backup filter detection
   *    - Direct filter change listener as backup to refreshTrigger
   *    - Uses JSON.stringify to detect deep object changes
   *    - Removed isLoading condition that was preventing re-triggering
   *
   * 5. Enhanced error handling and debugging
   *    - Better error messages with retry and force refresh buttons
   *    - More detailed console logging for troubleshooting
   *    - Field availability logging in API responses
   *    - Added 30-second timeout to prevent stuck loading states
   */

  // Generate option with data dependency to ensure it changes when data changes
  // Must be before conditional returns to follow React hooks rules
  const option = useMemo(() => {
    const opt = generateEChartsOption(data);
    // Add a timestamp to force option change detection
    return { ...opt, _timestamp: Date.now(), _dataLength: data.length };
  }, [data, chart.id, chart.chartType, chart.xAxis, chart.yAxis, chart.series]);
  
  // Use height prop if provided, otherwise default to 600px for better visibility
  const chartHeight = height ? `${Math.max(300, height)}px` : '600px';
  
  console.log('Chart render state', {
    chartId: chart.id,
    loading,
    error,
    dataLength: data.length,
    refreshTrigger: filterContext?.refreshTrigger,
    filters: filterContext?.filters
  });

  if (loading) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'hsl(var(--muted-foreground))',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        Loading chart data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'hsl(var(--destructive))',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Error loading chart data</div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>
            {error}
          </div>
          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '16px' }}>
            Check browser console for detailed logs
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchChartData}
            style={{
              padding: '6px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'background-color 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
            }}
          >
            Retry
          </button>
          <button
            onClick={() => {
// Reset all refs to ensure fresh data
              lastRefreshTriggerRef.current = 0;
              lastAggregationPeriodRef.current = '';
              setError(null);
              setData([]);
              fetchChartData();
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid hsl(var(--primary))',
              borderRadius: '6px',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'opacity 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Force Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {showAggregationToolbar && (
        <AggregationToolbar
          aggregationPeriod={currentAggregationPeriod}
          onAggregationChange={handleAggregationChange}
        />
      )}
      {React.createElement(EChartCanvas, { chartId: chart.id, option, height: chartHeight })}
    </div>
  );
};

export default class GenericChartGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'generic-chart-gadget',
    name: 'Generic Chart Gadget',
    version: '1.0.0',
    description: 'Comprehensive chart gadget supporting multiple chart types with ECharts',
    author: 'Gadget Library',
    tags: ['chart', 'visualization', 'echarts', 'analytics'],
    category: 'chart',
    gadgetType: GadgetType.CHART,
    widgetTypes: ['line-chart', 'bar-chart', 'area-chart', 'pie-chart', 'radar-chart', 'treemap', 'gauge'],
    dataFlow: {
      inputs: ['chart-data', 'filters'],
      outputs: ['chart-events'],
      transformations: ['data-formatting', 'aggregation']
    },
    layout: {
      type: 'flex',
      responsive: true
    },
    interactions: {
      events: ['chart-click', 'chart-hover', 'chart-brush'],
      handlers: ['onChartClick', 'onChartHover', 'onBrush'],
      workflows: ['chart-interaction', 'data-drill-down']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      charts: {
        type: 'array',
        description: 'Array of chart configurations',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            chartType: { 
              type: 'string',
              enum: ['line', 'bar', 'pie', 'scatter', 'radar', 'treemap', 'gauge', 'funnel', 'mixed']
            },
            dataSource: {
              type: 'object',
              properties: {
                endpoint: { type: 'string' },
                method: { type: 'string', enum: ['GET', 'POST'] },
                body: { type: 'object' },
                dataPath: { type: 'string' }
              },
              required: ['endpoint']
            },
            xAxis: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['category', 'value', 'time', 'log'] },
                dataKey: { type: 'string' },
                name: { type: 'string' }
              }
            },
            yAxis: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['category', 'value', 'time', 'log'] },
                name: { type: 'string' }
              }
            },
            legend: {
              type: 'object',
              properties: {
                show: { type: 'boolean' },
                top: { type: 'number' },
                bottom: { type: 'number' },
                textStyle: {
                  type: 'object',
                  properties: {
                    color: { type: 'string' },
                    fontSize: { type: 'number' },
                    fontFamily: { type: 'string' }
                  }
                },
                itemGap: { type: 'number' }
              }
            },
            series: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['line', 'bar', 'pie', 'scatter', 'radar'] },
                  dataKey: { type: 'string' },
                  color: { type: 'string' },
                  yAxisIndex: { type: 'number' },
                  label: {
                    type: 'object',
                    properties: {
                      show: { type: 'boolean' },
                      position: { type: 'string' },
                      fontSize: { type: 'number' },
                      formatter: { type: 'string' },
                      color: { type: 'string' }
                    }
                  }
                },
                required: ['name', 'type', 'dataKey']
              }
            },
            aggregationConfig: {
              type: 'object',
              properties: {
                dateField: { type: 'string', description: 'Field containing the date to aggregate by' },
                arrayField: { type: 'string', description: 'Array field to unwind (optional)' },
                valueField: { type: 'string', description: 'Field to sum for aggregation' },
                resultField: { type: 'string', description: 'Name for the aggregated result field' }
              },
              required: ['dateField', 'valueField']
            },
            showZoomBar: {
              type: 'boolean',
              description: 'Enable zoom controls with default configuration',
              default: false
            },
            showLabels: {
              type: 'boolean',
              description: 'Enable data labels with default configuration',
              default: false
            },
            showLegend: {
              type: 'boolean',
              description: 'Enable legend with default configuration',
              default: false
            },
            dataZoom: {
              type: 'array',
              description: 'Advanced data zoom configuration for interactive zooming (overrides showZoomBar)',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['slider', 'inside'], default: 'slider' },
                  xAxisIndex: { type: 'number' },
                  yAxisIndex: { type: 'number' },
                  start: { type: 'number', minimum: 0, maximum: 100, description: 'Initial zoom start percentage' },
                  end: { type: 'number', minimum: 0, maximum: 100, description: 'Initial zoom end percentage' },
                  startValue: { type: 'string' },
                  endValue: { type: 'string' },
                  orient: { type: 'string', enum: ['horizontal', 'vertical'] },
                  show: { type: 'boolean', default: true },
                  realtime: { type: 'boolean', default: true },
                  filterMode: { type: 'string', enum: ['filter', 'weakFilter', 'empty', 'none'], default: 'filter' },
                  throttle: { type: 'number', default: 100 },
                  height: { type: 'string' },
                  bottom: { type: 'string' },
                  handleSize: { type: 'string' },
                  backgroundColor: { type: 'string' },
                  borderColor: { type: 'string' },
                  fillerColor: { type: 'string' }
                }
              }
            }
          },
          required: ['id', 'title', 'chartType', 'dataSource', 'series']
        }
      },
      chartLayout: {
        type: 'string',
        enum: ['single', 'grid'],
        default: 'grid'
      },
      columns: {
        type: 'number',
        default: 2,
        minimum: 1,
        maximum: 4
      },
      height: {
        type: 'number',
        default: 350,
        minimum: 200
      }
    },
    required: ['charts'],
    widgetSchemas: {}
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    // Extract config from props - the actual config is nested inside props.config
    const config = props.config || props;
    const {
      charts = [],
      chartLayout = 'grid',
      columns = 2,
      height = 600,
      showAggregationToolbar = false,
      defaultAggregationPeriod = 'month'
    } = config as GenericChartGadgetConfig;

    if (!charts || charts.length === 0) {
      return React.createElement(
        'div',
        { 
          style: { 
            padding: '40px', 
            textAlign: 'center', 
            color: '#999',
            border: '1px dashed #d9d9d9',
            borderRadius: '6px'
          } 
        },
        'No charts configured'
      );
    }

    if (chartLayout === 'single' || charts.length === 1) {
      return React.createElement(GenericChartRenderer, {
        chart: charts[0],
        height: height,
        showAggregationToolbar: showAggregationToolbar,
        aggregationPeriod: defaultAggregationPeriod
      });
    }

    // Grid layout for multiple charts
    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px',
      width: '100%'
    };

    return React.createElement(
      'div',
      { style: gridStyle },
      ...charts.map((chart: ChartConfig) => 
        React.createElement(
          'div',
                     { 
             key: chart.id,
             className: 'chart-card',
             style: { 
               border: '1px solid hsl(var(--border))',
               borderRadius: '8px',
               padding: '12px',
               height: `${height}px`,
               overflow: 'hidden',
               backgroundColor: 'hsl(var(--card))',
               color: 'hsl(var(--card-foreground))',
               boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
               transition: 'box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out',
               cursor: 'default'
             },
             onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
               e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
             },
             onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
               e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
             }
           },
          React.createElement(GenericChartRenderer, {
            chart,
            height: height,
            showAggregationToolbar: showAggregationToolbar,
            aggregationPeriod: defaultAggregationPeriod
          })
        )
      )
    );
  }

  validate(config: GenericChartGadgetConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.charts || !Array.isArray(config.charts)) {
      errors.push('Charts configuration is required and must be an array');
    } else {
      config.charts.forEach((chart, index) => {
        if (!chart.id) errors.push(`Chart ${index}: id is required`);
        if (!chart.title) errors.push(`Chart ${index}: title is required`);
        if (!chart.chartType) errors.push(`Chart ${index}: chartType is required`);
        if (!chart.dataSource?.endpoint) errors.push(`Chart ${index}: dataSource.endpoint is required`);
        if (!chart.series || !Array.isArray(chart.series) || chart.series.length === 0) {
          errors.push(`Chart ${index}: at least one series is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout(): Record<string, any> {
    return {};
  }

  processDataFlow(data: any): any {
    return data;
  }

  onGadgetMount(): void {
}

  onGadgetUnmount(): void {
}
}
