# Widget & Gadget Registry System

This directory contains the core registry system for the widget/gadget architecture, enforcing strict separation between presentational widgets and logic gadgets.

## Architecture Overview

```
Workspace → GadgetRegistry → Gadget Classes → WidgetRegistry → Widget Components
```

### Widget vs Gadget Pattern

- **Widgets**: Stateless, presentational React components (UI only)
- **Gadgets**: Class-based orchestrators that contain logic and render widgets

## Files

### WidgetRegistry.ts
Registry for stateless widget components.

```typescript
// Register a widget
WidgetRegistry.register('stats-grid', StatsGridWidget);

// Get a widget
const Widget = WidgetRegistry.get('stats-grid');

// Check if registered
if (WidgetRegistry.has('stats-grid')) {
  // Widget exists
}
```

### GadgetRegistry.ts
Registry for class-based gadget orchestrators.

```typescript
// Register a gadget
GadgetRegistry.register('stats', StatsGadget);

// Get a gadget class
const GadgetClass = GadgetRegistry.get('stats');

// Instantiate and use
const gadgetInstance = new GadgetClass(config, WidgetRegistry, context);
const renderedContent = gadgetInstance.render();
```

### RegistryInitializer.ts
Initializes all registries with available widgets and gadgets.

```typescript
// Initialize all registries (called on app startup)
initializeRegistries();

// Clear registries (useful for testing)
clearRegistries();

// Get registry status
const status = getRegistryStatus();
```

## Usage Example

### 1. Define a Widget (Stateless UI Component)

```typescript
// src/components/library/widgets/display/MyWidget.tsx
import React from 'react';

interface MyWidgetProps {
  title: string;
  data: any[];
}

const MyWidget: React.FC<MyWidgetProps> = ({ title, data }) => {
  return (
    <div className="my-widget">
      <h3>{title}</h3>
      <div>{/* Render data */}</div>
    </div>
  );
};

export default MyWidget;
```

### 2. Define a Gadget (Class-based Orchestrator)

```typescript
// src/components/library/gadgets/display/MyGadget.ts
import React from 'react';
import { BaseGadget } from '../base';

export class MyGadget extends BaseGadget {
  metadata = {
    id: 'my-gadget',
    name: 'My Gadget',
    version: '1.0.0',
    description: 'A custom gadget',
    gadgetType: 'dashboard',
    widgetTypes: ['my-widget']
  };

  schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      data: { type: 'array' }
    }
  };

  render(props: any, context?: any): React.ReactNode {
    const { title, data } = props;
    const widgetRegistry = context?.widgetRegistry;

    // Get widget from registry
    const Widget = widgetRegistry?.get('my-widget');
    
    if (!Widget) {
      return <div>Widget not found</div>;
    }

    // Render widget with props
    return React.createElement(Widget, { title, data });
  }

  validate(config: any) {
    return { isValid: true, errors: [] };
  }

  getRequiredWidgets() {
    return ['my-widget'];
  }
}
```

### 3. Register in RegistryInitializer

```typescript
// src/components/library/core/RegistryInitializer.ts
import MyWidget from '../widgets/display/MyWidget';
import { MyGadget } from '../gadgets/display/MyGadget';

export function initializeRegistries() {
  // Register widget
  WidgetRegistry.register('my-widget', MyWidget);
  
  // Register gadget
  GadgetRegistry.register('my-gadget', MyGadget);
}
```

### 4. Use in Workspace

```json
// workspace.json
{
  "gadgets": [
    {
      "id": "my-gadget-1",
      "type": "my-gadget",
      "config": {
        "title": "My Custom Gadget",
        "data": [1, 2, 3, 4, 5]
      },
      "position": {
        "row": 0,
        "col": 0,
        "width": 12,
        "height": 4
      }
    }
  ]
}
```

## Extension Points

### Dynamic Loading
```typescript
// Register widget with lazy loading
WidgetRegistry.registerAsync('heavy-widget', () => 
  import('../widgets/HeavyWidget')
);

// Register gadget with lazy loading
GadgetRegistry.registerAsync('complex-gadget', () => 
  import('../gadgets/ComplexGadget')
);
```

### Custom Registry Extensions
```typescript
// Extend for multi-tenant support
class TenantAwareWidgetRegistry extends WidgetRegistry {
  private tenantId: string;

  constructor(tenantId: string) {
    super();
    this.tenantId = tenantId;
  }

  get(type: WidgetType): WidgetComponent | undefined {
    // Add tenant-specific logic
    return super.get(`${this.tenantId}:${type}`);
  }
}
```

## Best Practices

1. **Widgets should be stateless** - No internal state, just props in, JSX out
2. **Gadgets contain all logic** - Data fetching, state management, widget orchestration
3. **Use registries for discovery** - Never import widgets/gadgets directly in workspace renderers
4. **Validate configurations** - Always validate gadget configs before rendering
5. **Handle missing components gracefully** - Show fallback UI when widgets/gadgets aren't found

## Migration from Old System

The old `WorkspaceComponentRegistry` has been replaced with this new system:

- **Before**: Mixed widgets and gadgets in one registry
- **After**: Separate registries with clear separation of concerns

To migrate existing components:
1. Move presentational logic to widgets
2. Move business logic to gadgets
3. Update workspace definitions to use gadget types
4. Register in appropriate registry 