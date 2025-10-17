/**
 * Component Library Usage Examples
 * 
 * This file demonstrates how to use the component library framework
 * to create widgets, gadgets, and workspaces.
 */

import { initializeComponentLibrary } from '../index';

// Example data for demonstrations
const sampleChartData = [
  { x: 1, y: 10, label: 'Jan' },
  { x: 2, y: 20, label: 'Feb' },
  { x: 3, y: 15, label: 'Mar' },
  { x: 4, y: 25, label: 'Apr' },
  { x: 5, y: 30, label: 'May' }
];

/**
 * Initialize the component library
 */
export async function initializeLibrary() {
  try {
    await initializeComponentLibrary({
      autoDiscovery: true,
      lazyLoading: false,
      cacheEnabled: true,
      devMode: true,
      logLevel: 'debug'
    });
// console.log('System Info:', ComponentLibrary.getSystemInfo());
  } catch (error) {
    console.error('Failed to initialize component library:', error);
  }
}

/**
 * Example: Creating a Line Chart Widget
 */
export function createLineChartExample() {
  try {
    // const chartWidget = ComponentLibrary.createWidget('line-chart', {
    //   id: 'sales-chart',
    //   type: 'line-chart',
    //   props: {
    //     data: sampleChartData,
    //     title: 'Monthly Sales',
    //     xAxisLabel: 'Month',
    //     yAxisLabel: 'Sales ($000)',
    //     color: '#1890ff',
    //     showPoints: true,
    //     animated: true
    //   }
    // });

    // console.log('Line chart widget created:', chartWidget);
    // return chartWidget;
    return {
      id: 'sales-chart-example',
      type: 'line-chart',
      props: {
        data: sampleChartData,
        title: 'Monthly Sales',
        xAxisLabel: 'Month',
        yAxisLabel: 'Sales ($000)',
        color: '#1890ff'
      }
    };
  } catch (error) {
    console.error('Failed to create line chart widget:', error);
    return null;
  }
}

/**
 * Example: Validating Widget Configuration
 */
export function validateWidgetConfigExample() {
  const validConfig = {
    id: 'test-chart',
    type: 'line-chart',
    props: {
      data: sampleChartData,
      title: 'Test Chart'
    }
  };

  const invalidConfig = {
    id: 'invalid-chart',
    type: 'line-chart',
    props: {
      data: 'not-an-array', // Invalid: should be array
      color: 123 // Invalid: should be string
    }
  };

  // const validResult = ComponentLibrary.validateWidgetConfig('line-chart', validConfig);
  // const invalidResult = ComponentLibrary.validateWidgetConfig('line-chart', invalidConfig);

  // console.log('Valid config validation:', validResult);
  // console.log('Invalid config validation:', invalidResult);

  // return { validResult, invalidResult };
  return { validExampleConfig: validConfig, invalidExampleConfig: invalidConfig };
}

/**
 * Example: Searching for Components
 */
export function searchComponentsExample() {
  // Search for chart widgets
  // const chartWidgets = ComponentLibrary.searchWidgets('chart');
  // console.log('Found chart widgets:', chartWidgets);

  // Find widgets by category
  // const visualizationWidgets = ComponentLibrary.findWidgetsByCategory('visualization');
  // console.log('Found visualization widgets:', visualizationWidgets);

  // Get all available widgets
  // const allWidgets = ComponentLibrary.getAvailableWidgets();
  // console.log('All available widgets:', allWidgets);

  // return { chartWidgets, visualizationWidgets, allWidgets };
return { chartWidgets: [], visualizationWidgets: [], allWidgets: [] };
}

/**
 * Example: Component Library Statistics
 */
export function getLibraryStatsExample() {
  // const stats = ComponentLibrary.getStats();
  // const systemInfo = ComponentLibrary.getSystemInfo();

  // console.log('Library statistics:', stats);
  // console.log('System information:', systemInfo);

  // return { stats, systemInfo };
return { stats: null, systemInfo: null };
}

/**
 * Example: Development Mode Usage
 */
export function developmentModeExample() {
  // Enable development mode
  // ComponentLibrary.enableDevMode();
  // console.log('Development mode enabled');

  // Validate system
  // const validation = ComponentLibrary.validateSystem();
  // console.log('System validation:', validation);

  // Disable development mode
  // ComponentLibrary.disableDevMode();
  // console.log('Development mode disabled');

  // return validation;
return null;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
// Initialize library
  await initializeLibrary();
  
  // Create widgets
createLineChartExample();
  
  // Validate configurations
validateWidgetConfigExample();
  
  // Search components
searchComponentsExample();
  
  // Get statistics
getLibraryStatsExample();
  
  // Development mode
developmentModeExample();
}

// Export for easy testing
export const examples = {
  initializeLibrary,
  createLineChartExample,
  validateWidgetConfigExample,
  searchComponentsExample,
  getLibraryStatsExample,
  developmentModeExample,
  runAllExamples
}; 
