# Component Library Framework

A scalable, metadata-driven component library system for building thousands of widgets, gadgets, and workspaces with React and TypeScript.

## Overview

The Component Library Framework provides a hierarchical architecture where:
- **Widgets** are the smallest reusable components (charts, inputs, displays, etc.)
- **Gadgets** combine multiple widgets into cohesive units (dashboards, forms, etc.)
- **Workspaces** combine multiple gadgets into complete applications (analytics, reports, etc.)

## Architecture

```
Workspaces (100s)
    ↓
Gadgets (1000s)
    ↓
Widgets (1000s)
    ↓
Base Components
```

### Key Features

- **Scalable**: Designed to handle thousands of components
- **Type-Safe**: Full TypeScript support with strict typing
- **Metadata-Driven**: JSON configuration for all components
- **Auto-Discovery**: Automatic component registration
- **Extensible**: Plugin architecture for custom components
- **Validated**: Runtime and compile-time validation
- **Themeable**: Built-in theming and styling support
- **Secure**: XSS protection and permission management

## Quick Start

### Installation

```bash
npm install # Install dependencies
```

### Basic Usage

```typescript
import { ComponentLibrary, initializeComponentLibrary } from './components/library';

// Initialize the library
await initializeComponentLibrary({
  autoDiscovery: true,
  devMode: true
});

// Create a widget
const chartWidget = ComponentLibrary.createWidget('chart', {
  id: 'sales-chart',
  type: 'chart',
  props: {
    data: salesData,
    chartType: 'line'
  }
});

// Create a gadget
const dashboardGadget = ComponentLibrary.createGadget('dashboard', {
  id: 'sales-dashboard',
  type: 'dashboard',
  widgets: [
    { id: 'chart-1', type: 'chart', props: { ... } },
    { id: 'table-1', type: 'table', props: { ... } }
  ]
});

// Create a workspace
const analyticsWorkspace = ComponentLibrary.createWorkspace('analytics', {
  id: 'sales-analytics',
  type: 'analytics',
  title: 'Sales Analytics',
  gadgets: [
    { id: 'dashboard-1', type: 'dashboard', ... }
  ]
});
```

## Component Structure

### Widgets

Widgets are the building blocks of the system. They extend `BaseWidget` and implement specific functionality:

```typescript
import { BaseWidget, WidgetType, WidgetMetadata, WidgetSchema } from '../base';

export class ChartWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'chart',
    name: 'Chart Widget',
    version: '1.0.0',
    description: 'Displays data in various chart formats',
    widgetType: WidgetType.DATA,
    category: 'visualization',
    tags: ['chart', 'data', 'visualization']
  };

  schema: WidgetSchema = {
    type: 'chart',
    properties: {
      data: { type: 'array', required: true },
      chartType: { type: 'string', enum: ['line', 'bar', 'pie'] }
    },
    required: ['data']
  };

  getDataRequirements(): string[] {
    return ['data'];
  }

  getOutputSchema(): ComponentSchema {
    return {
      type: 'object',
      properties: {
        selectedData: { type: 'array' }
      }
    };
  }

  render(props: any, context?: WidgetContext): React.ReactNode {
    return (
      <div className="chart-widget">
        {/* Chart implementation */}
      </div>
    );
  }

  validate(config: WidgetConfig): ValidationResult {
    return this.validateWidgetConfig(config);
  }
}
```

### Gadgets

Gadgets combine multiple widgets with data flow and layout management:

```typescript
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema } from '../base';

export class DashboardGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'dashboard',
    name: 'Dashboard Gadget',
    version: '1.0.0',
    description: 'Combines multiple widgets into a dashboard',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['chart', 'table', 'filter'],
    category: 'dashboard'
  };

  schema: GadgetSchema = {
    type: 'dashboard',
    properties: {
      widgets: { type: 'array', required: true },
      layout: { type: 'object' }
    },
    widgetSchemas: {
      chart: { /* chart schema */ },
      table: { /* table schema */ },
      filter: { /* filter schema */ }
    }
  };

  getRequiredWidgets(): string[] {
    return ['chart'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      columns: 12,
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    // Process data between widgets
    return data;
  }

  render(props: any, context?: GadgetContext): React.ReactNode {
    const widgets = this.renderWidgets(props, context);
    return this.applyLayout(widgets, props.layout);
  }

  validate(config: GadgetConfig): ValidationResult {
    return this.validateGadgetConfig(config);
  }
}
```

### Workspaces

Workspaces combine multiple gadgets into complete applications:

```typescript
import { BaseWorkspace, WorkspaceType, WorkspaceMetadata, WorkspaceSchema } from '../base';

export class AnalyticsWorkspace extends BaseWorkspace {
  metadata: WorkspaceMetadata = {
    id: 'analytics',
    name: 'Analytics Workspace',
    version: '1.0.0',
    description: 'Complete analytics application',
    workspaceType: WorkspaceType.ANALYTICS,
    gadgetTypes: ['dashboard', 'reports'],
    category: 'analytics'
  };

  schema: WorkspaceSchema = {
    type: 'analytics',
    properties: {
      title: { type: 'string', required: true },
      gadgets: { type: 'array', required: true }
    },
    gadgetSchemas: {
      dashboard: { /* dashboard schema */ },
      reports: { /* reports schema */ }
    }
  };

  getRequiredGadgets(): string[] {
    return ['dashboard'];
  }

  getWorkspaceLayout(): Record<string, any> {
    return {
      type: 'flex',
      direction: 'column',
      responsive: true
    };
  }

  processWorkspaceData(data: any): any {
    // Process data between gadgets
    return data;
  }

  render(props: any, context?: WorkspaceContext): React.ReactNode {
    const gadgets = this.renderGadgets(props, context);
    return this.applyWorkspaceLayout(gadgets, props.layout);
  }

  validate(config: WorkspaceConfig): ValidationResult {
    return this.validateWorkspaceConfig(config);
  }
}
```

## Directory Structure

```
src/components/library/
├── core/
│   └── base.ts                 # Core interfaces and base classes
├── widgets/
│   ├── base.ts                 # Widget base classes and registry
│   ├── chart/
│   │   ├── index.ts           # Chart widget implementations
│   │   ├── LineChart.ts       # Line chart widget
│   │   ├── BarChart.ts        # Bar chart widget
│   │   └── PieChart.ts        # Pie chart widget
│   ├── input/
│   │   ├── index.ts           # Input widget implementations
│   │   ├── TextInput.ts       # Text input widget
│   │   ├── SelectInput.ts     # Select input widget
│   │   └── DateInput.ts       # Date input widget
│   └── display/
│       ├── index.ts           # Display widget implementations
│       ├── Text.ts            # Text display widget
│       ├── Image.ts           # Image display widget
│       └── Video.ts           # Video display widget
├── gadgets/
│   ├── base.ts                 # Gadget base classes and registry
│   ├── dashboard/
│   │   ├── index.ts           # Dashboard gadget implementations
│   │   ├── ChartGrid.ts       # Chart grid gadget
│   │   └── StatsPanel.ts      # Statistics panel gadget
│   ├── form/
│   │   ├── index.ts           # Form gadget implementations
│   │   ├── DataEntry.ts       # Data entry form gadget
│   │   └── Survey.ts          # Survey form gadget
│   └── report/
│       ├── index.ts           # Report gadget implementations
│       ├── TableReport.ts     # Table report gadget
│       └── ChartReport.ts     # Chart report gadget
├── workspaces/
│   ├── base.ts                 # Workspace base classes and registry
│   ├── analytics/
│   │   ├── index.ts           # Analytics workspace implementations
│   │   ├── SalesAnalytics.ts  # Sales analytics workspace
│   │   └── WebAnalytics.ts    # Web analytics workspace
│   ├── document/
│   │   ├── index.ts           # Document workspace implementations
│   │   ├── Editor.ts          # Document editor workspace
│   │   └── Viewer.ts          # Document viewer workspace
│   └── report/
│       ├── index.ts           # Report workspace implementations
│       ├── Builder.ts         # Report builder workspace
│       └── Viewer.ts          # Report viewer workspace
├── index.ts                    # Main export file
└── README.md                   # This file
```

## Configuration

### Component Library Configuration

```typescript
interface ComponentLibraryConfig {
  autoDiscovery?: boolean;      // Auto-discover components
  lazyLoading?: boolean;        // Enable lazy loading
  cacheEnabled?: boolean;       // Enable caching
  devMode?: boolean;           // Development mode
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

// Configure the library
ComponentLibrary.configure({
  autoDiscovery: true,
  lazyLoading: false,
  cacheEnabled: true,
  devMode: true,
  logLevel: 'debug'
});
```

### Component Registration

Components can be registered manually or automatically discovered:

```typescript
// Manual registration
ComponentLibrary.registerWidget(new ChartWidget());
ComponentLibrary.registerGadget(new DashboardGadget());
ComponentLibrary.registerWorkspace(new AnalyticsWorkspace());

// Auto-discovery (scans filesystem)
await discoverComponents('./components/library');
```

## Development

### Creating a New Widget

1. Create a new folder in `src/components/library/widgets/`
2. Implement the widget class extending `BaseWidget`
3. Export the widget in the folder's `index.ts`
4. Register the widget (auto-discovery will handle this)

### Creating a New Gadget

1. Create a new folder in `src/components/library/gadgets/`
2. Implement the gadget class extending `BaseGadget`
3. Define required widgets and their relationships
4. Export the gadget in the folder's `index.ts`

### Creating a New Workspace

1. Create a new folder in `src/components/library/workspaces/`
2. Implement the workspace class extending `BaseWorkspace`
3. Define required gadgets and their layout
4. Export the workspace in the folder's `index.ts`

## API Reference

### ComponentLibrary

Main API for interacting with the component library:

```typescript
// Widget methods
ComponentLibrary.createWidget(type: string, config: WidgetConfig, context?: WidgetContext)
ComponentLibrary.registerWidget(widget: BaseWidget)
ComponentLibrary.getWidget(id: string)
ComponentLibrary.getAvailableWidgets()
ComponentLibrary.validateWidgetConfig(type: string, config: WidgetConfig)

// Gadget methods
ComponentLibrary.createGadget(type: string, config: GadgetConfig, context?: GadgetContext)
ComponentLibrary.registerGadget(gadget: BaseGadget)
ComponentLibrary.getGadget(id: string)
ComponentLibrary.getAvailableGadgets()
ComponentLibrary.validateGadgetConfig(type: string, config: GadgetConfig)

// Workspace methods
ComponentLibrary.createWorkspace(type: string, config: WorkspaceConfig, context?: WorkspaceContext)
ComponentLibrary.registerWorkspace(workspace: BaseWorkspace)
ComponentLibrary.getWorkspace(id: string)
ComponentLibrary.getAvailableWorkspaces()
ComponentLibrary.validateWorkspaceConfig(type: string, config: WorkspaceConfig)

// Search and discovery
ComponentLibrary.searchWidgets(query: string)
ComponentLibrary.searchGadgets(query: string)
ComponentLibrary.searchWorkspaces(query: string)
ComponentLibrary.findWidgetsByCategory(category: string)
ComponentLibrary.findGadgetsByCategory(category: string)
ComponentLibrary.findWorkspacesByCategory(category: string)

// System management
ComponentLibrary.getStats()
ComponentLibrary.getSystemInfo()
ComponentLibrary.validateSystem()
ComponentLibrary.enableDevMode()
ComponentLibrary.disableDevMode()
```

### Registries

Direct access to component registries:

```typescript
import { widgetRegistry, gadgetRegistry, workspaceRegistry } from './components/library';

// Widget registry
widgetRegistry.register(widget)
widgetRegistry.get(id)
widgetRegistry.getAll()
widgetRegistry.getByType(type)
widgetRegistry.getByCategory(category)
widgetRegistry.search(query)

// Gadget registry
gadgetRegistry.register(gadget)
gadgetRegistry.get(id)
gadgetRegistry.getAll()
gadgetRegistry.getByType(type)
gadgetRegistry.getByWidgetType(widgetType)
gadgetRegistry.findCompatibleGadgets(widgetTypes)

// Workspace registry
workspaceRegistry.register(workspace)
workspaceRegistry.get(id)
workspaceRegistry.getAll()
workspaceRegistry.getByType(type)
workspaceRegistry.getByGadgetType(gadgetType)
workspaceRegistry.findCompatibleWorkspaces(gadgetTypes)
```

## Testing

### Unit Testing

```typescript
import { ComponentLibrary, WidgetFactory } from './components/library';
import { ChartWidget } from './widgets/chart';

describe('ChartWidget', () => {
  it('should create a chart widget', () => {
    const widget = new ChartWidget();
    expect(widget.metadata.id).toBe('chart');
  });

  it('should validate config', () => {
    const config = {
      id: 'test-chart',
      type: 'chart',
      props: { data: [1, 2, 3] }
    };
    const result = WidgetFactory.validateWidgetConfig('chart', config);
    expect(result.isValid).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe('Component Library Integration', () => {
  beforeEach(async () => {
    await initializeComponentLibrary({
      autoDiscovery: false,
      devMode: true
    });
  });

  it('should create complete workspace', () => {
    const workspace = ComponentLibrary.createWorkspace('analytics', {
      id: 'test-analytics',
      type: 'analytics',
      title: 'Test Analytics',
      gadgets: [
        {
          id: 'dashboard-1',
          type: 'dashboard',
          widgets: [
            { id: 'chart-1', type: 'chart', props: { data: [] } }
          ]
        }
      ]
    });
    
    expect(workspace).toBeDefined();
  });
});
```

## Performance Considerations

- **Lazy Loading**: Components are loaded only when needed
- **Caching**: Validated configurations are cached
- **Memoization**: React.memo is used for rendering optimization
- **Virtual Scrolling**: Large lists use virtual scrolling
- **Code Splitting**: Dynamic imports for component bundles

## Security

- **XSS Protection**: All user input is sanitized
- **Permission Checking**: Role-based access control
- **Validation**: Strict schema validation
- **Safe Rendering**: No unsafe code execution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your component following the patterns
4. Add tests for your component
5. Submit a pull request

## License

MIT License - see LICENSE file for details 