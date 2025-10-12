# Workspace System Architecture

A modular, extensible workspace system built with TypeScript that follows a component-based architecture where widgets combine into gadgets, and gadgets combine into workspaces.

## 🏗️ Architecture Overview

```
Widgets → Gadgets → Workspaces
   ↓        ↓         ↓
 Base    Combined   Complete
Components Logic   Experience
```

## 📁 File Structure

```
src/schemas/workspace/
├── base.ts           # Base interfaces and utilities
├── widget.ts         # Widget system (individual components)
├── gadget.ts         # Gadget system (widget combinations)
├── workspace.ts      # Workspace system (gadget collections)
├── factory.ts        # Factory and utility classes
├── index.ts          # Main export file
└── README.md         # This documentation
```

## 🔧 Core Components

### 1. Base System (`base.ts`)
- **BasePosition**: Grid positioning system
- **BaseAuthorization**: Permission and role management
- **BaseInteraction**: Event handling between components
- **BaseSchema**: Schema definition structure
- **ValidationResult**: Validation response format
- **WorkspaceType**: Enum for workspace types (BI, Document, Report, etc.)

### 2. Widget System (`widget.ts`)
Individual UI components that handle specific functionality:

- **BaseWidget**: Abstract base class for all widgets
- **ChartWidget**: Chart rendering and configuration
- **GridWidget**: Data grid with sorting, filtering, pagination
- **FilterWidget**: Filter controls and form inputs
- **WidgetRegistry**: Central registry for widget management

### 3. Gadget System (`gadget.ts`)
Combinations of widgets that work together:

- **BaseGadget**: Abstract base class for all gadgets
- **ChartGridGadget**: Chart + Grid + Filter combination
- **StatsGadget**: KPI dashboard gadget
- **DocumentViewerGadget**: Document viewing functionality
- **GadgetRegistry**: Central registry for gadget management

### 4. Workspace System (`workspace.ts`)
Complete workspace experiences with specific behaviors:

- **BaseWorkspace**: Abstract base class for all workspaces
- **BIWorkspace**: Scrollable, analytics-focused workspace
- **DocumentWorkspace**: Non-scrollable, document-focused workspace
- **ReportWorkspace**: Report generation and viewing workspace
- **DashboardWorkspace**: General dashboard workspace
- **WorkspaceRegistry**: Central registry for workspace management

### 5. Factory System (`factory.ts`)
Creation and management utilities:

- **WorkspaceFactory**: Create and validate components
- **ComponentBuilder**: Build components with validation
- **SchemaGenerator**: Generate templates and schemas
- **RegistryManager**: Manage component registries
- **DevUtils**: Development and debugging utilities

## 🚀 Usage Examples

### Basic Usage

```typescript
import { WorkspaceSystem } from './workspace';

// Create a workspace
const workspace = WorkspaceSystem.createWorkspace('bi');

// Validate a workspace schema
const validation = WorkspaceSystem.validateWorkspaceSchema(schema);

// Get available gadgets for a workspace type
const gadgets = WorkspaceSystem.getAvailableGadgets('bi');
```

### Advanced Usage

```typescript
import { 
  ComponentBuilder, 
  SchemaGenerator, 
  WorkspaceType,
  ChartGridGadget 
} from './workspace';

// Create a component builder
const builder = new ComponentBuilder({
  enableValidation: true,
  strictMode: true,
  debugMode: true
});

// Generate a workspace template
const template = SchemaGenerator.generateWorkspaceTemplate(
  WorkspaceType.BI,
  'my-analytics-workspace',
  'Analytics Dashboard',
  'Business intelligence workspace with charts and grids'
);

// Build a complete workspace
const { workspace, validation } = builder.buildWorkspace(template);
```

### Custom Component Registration

```typescript
import { RegistryManager, BaseWidget } from './workspace';

// Create a custom widget
class CustomWidget extends BaseWidget {
  readonly type = 'custom-widget';
  readonly schema = {
    id: 'custom-widget',
    type: 'custom-widget',
    properties: { /* ... */ },
    required: ['customProperty']
  };
  
  render(props) { /* ... */ }
  validate(config) { /* ... */ }
}

// Register the custom widget
RegistryManager.registerWidget(new CustomWidget());
```

## 🔍 Schema Flow

1. **Widgets** expose their property schemas
2. **Gadgets** combine widget schemas and expose only needed properties
3. **Workspace JSON** provides values for the gadget schemas

```typescript
// Widget schema
ChartWidget.schema = {
  properties: { chartType, dataSource, xAxis, yAxis, ... }
  required: ['chartType', 'dataSource', 'xAxis', 'yAxis']
}

// Gadget combines and exposes
ChartGridGadget.schema = {
  properties: { chartType, dataSource, xAxis, yAxis, columns, filters, ... }
  required: ['chartType', 'dataSource', 'xAxis', 'yAxis', 'columns']
}

// Workspace JSON provides values
{
  "gadgets": [{
    "type": "chart-grid-gadget",
    "config": {
      "chartType": "line",
      "dataSource": "/api/data",
      "xAxis": "date",
      "yAxis": "value",
      "columns": [...]
    }
  }]
}
```

## 🎯 Key Benefits

### ✅ **Modularity**
- Each component is in its own file
- Clear separation of concerns
- Easy to maintain and extend

### ✅ **Type Safety**
- Full TypeScript support throughout
- Compile-time validation
- IntelliSense support

### ✅ **Extensibility**
- Easy to add new widgets, gadgets, and workspaces
- Plugin-based architecture
- Registry system for dynamic loading

### ✅ **Validation**
- Schema validation at all levels
- Runtime validation with detailed error messages
- Development utilities for debugging

### ✅ **Reusability**
- Widgets can be combined into different gadgets
- Gadgets can be used in different workspaces
- Templates and schema generation

## 🛠️ Development Utilities

### Validation
```typescript
import { DevUtils } from './workspace';

// Validate all registered components
const validation = DevUtils.validateAllComponents();
console.log(validation);
```

### Documentation Generation
```typescript
// Generate component documentation
const docs = DevUtils.generateComponentDocs();
console.log(docs);
```

### Registry Statistics
```typescript
import { RegistryManager } from './workspace';

const stats = RegistryManager.getRegistryStats();
console.log(`Widgets: ${stats.widgets}, Gadgets: ${stats.gadgets}, Workspaces: ${stats.workspaces}`);
```

## 🔧 Extending the System

### Adding a New Widget
1. Create a new class extending `BaseWidget`
2. Define the schema with properties and required fields
3. Implement `render()` and `validate()` methods
4. Register with `WidgetRegistry.registerWidget()`

### Adding a New Gadget
1. Create a new class extending `BaseGadget`
2. Define which widgets it combines
3. Implement schema composition logic
4. Register with `GadgetRegistry.registerGadget()`

### Adding a New Workspace Type
1. Create a new class extending `BaseWorkspace`
2. Define configuration and available gadgets
3. Implement validation and rendering logic
4. Register with `WorkspaceRegistry.registerWorkspace()`

## 📊 Workspace Types

| Type | Scrollable | Layout | Use Case |
|------|------------|--------|----------|
| BI | ✅ | Grid | Analytics dashboards |
| Document | ❌ | Flex | Document viewing |
| Report | ✅ | Absolute | Report generation |
| Dashboard | ✅ | Grid | General dashboards |

## 🎨 Example JSON Structure

```json
{
  "id": "sales-analytics",
  "type": "bi",
  "title": "Sales Analytics Dashboard",
  "description": "Comprehensive sales analytics workspace",
  "config": {
    "scrollable": true,
    "padding": 16,
    "background": "#f5f5f5",
    "layout": "grid",
    "responsive": true
  },
  "gadgets": [
    {
      "id": "sales-chart-grid",
      "type": "chart-grid-gadget",
      "position": { "row": 0, "col": 0, "width": 24, "height": 12 },
      "config": {
        "chartType": "line",
        "dataSource": "/api/sales-data",
        "xAxis": "date",
        "yAxis": "revenue",
        "columns": [...],
        "filters": [...],
        "syncData": true
      }
    }
  ],
  "interactions": [
    {
      "source": "sales-chart-grid",
      "target": "kpi-stats",
      "event": "filter-change",
      "action": "refresh-data"
    }
  ]
}
```

This modular architecture ensures maintainability, extensibility, and type safety while providing a powerful framework for building dynamic workspace experiences. 