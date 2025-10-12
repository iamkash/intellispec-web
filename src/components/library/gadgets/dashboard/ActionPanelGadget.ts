/**
 * Action Panel Gadget
 * 
 * A gadget that displays a grid of action buttons/cards for quick navigation.
 * This gadget wraps an action panel widget and handles data fetching.
 */

import React from 'react';
import { z } from 'zod';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext, GadgetContainerProps } from '../base';
import { ValidationResult } from '../../core/base';
import { WidgetConfig } from '../../widgets/base';

// Simplified Flat Action Schema
const ActionSchema = z.object({
  key: z.string().min(1, 'Action key is required'),
  label: z.string().min(1, 'Action label is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(['primary', 'default', 'dashed', 'text', 'link']).optional().default('default'),
  route: z.string().optional(),
  workspace: z.string().optional(),
  disabled: z.boolean().optional().default(false)
});

const DataSourceSchema = z.object({
  url: z.string().url('Data source URL must be valid'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional().default('GET'),
  headers: z.record(z.string()).optional(),
  valueMapping: z.object({
    dataPath: z.string().optional(),
    filterBy: z.record(z.any()).optional(),
    sortBy: z.object({
      field: z.string(),
      order: z.enum(['asc', 'desc']).optional().default('asc')
    }).optional(),
    fields: z.record(z.string()).optional(),
    maxItems: z.number().positive().optional()
  }).optional()
});

// Simplified Flat ActionPanelGadget configuration schema
const ActionPanelGadgetConfigSchema = z.object({
  // Core gadget properties  
  id: z.string().min(1, 'Gadget ID is required'),
  type: z.literal('action-panel-gadget'),
  title: z.string().optional().default('Quick Actions'),
  position: z.union([z.number(), z.object({
    x: z.number().min(0),
    y: z.number().min(0), 
    w: z.number().min(1),
    h: z.number().min(1)
  })]),
  
  // Simplified flat configuration
  config: z.object({
    dataUrl: z.string().url().optional(),
    dataPath: z.string().optional(),
    layout: z.enum(['horizontal', 'vertical', 'grid']).optional().default('horizontal'),
    maxItems: z.number().positive().optional().default(5),
    showIcons: z.boolean().optional().default(true),
    showLabels: z.boolean().optional().default(true),
    cardSize: z.enum(['small', 'medium', 'large']).optional().default('large'),
    spacing: z.enum(['compact', 'comfortable', 'even']).optional().default('even'),
    actions: z.array(ActionSchema).min(1, 'At least one action is required'),
    
    // Wrapper control options (hideWrapper is default for action panels)
    hideWrapper: z.boolean().optional().default(true),
    noContainer: z.boolean().optional().default(false),
    minimal: z.boolean().optional().default(false)
  })
});

// Export the schema for external validation
export const ActionPanelGadgetSchema = ActionPanelGadgetConfigSchema;

// Utility function to validate workspace definitions
export function validateWorkspaceActionPanels(workspaceDefinition: any): {
  isValid: boolean;
  errors: string[];
  validatedGadgets: any[];
} {
  const errors: string[] = [];
  const validatedGadgets: any[] = [];

  if (!workspaceDefinition.gadgets || !Array.isArray(workspaceDefinition.gadgets)) {
    return {
      isValid: false,
      errors: ['Workspace definition must have a gadgets array'],
      validatedGadgets: []
    };
  }

  for (const gadget of workspaceDefinition.gadgets) {
    if (gadget.type === 'action-panel-gadget') {
      try {
        const validated = ActionPanelGadgetConfigSchema.parse(gadget);
        validatedGadgets.push(validated);
} catch (error) {
        if (error instanceof z.ZodError) {
          const gadgetErrors = error.errors.map(err =>
            `Gadget "${gadget.id}".${err.path.join('.')}: ${err.message}`
          );
          errors.push(...gadgetErrors);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedGadgets
  };
}

// Simple data fetcher component for action panel that doesn't use hooks
class ActionPanelDataFetcher extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      data: null,
      loading: false,
      error: null
    };
  }

  handleActionClick = (action: any) => {
    const { context } = this.props;
    const onAction = context?.onAction;
    
    if (onAction && action.workspace) {
      // Use the onAction mechanism to trigger navigation
      onAction('navigate', {
        workspace: action.workspace,
        route: action.route,
        key: action.key || action.id,
        label: action.label || action.title,
        type: action.type || 'item'
      });
    }
  };

  async componentDidMount() {
    const { dataSource, fetchData } = this.props;
    if (dataSource) {
      this.setState({ loading: true, error: null });
      
      try {
        const fetchedData = await fetchData(dataSource);
        this.setState({ data: fetchedData, loading: false });
      } catch (error: any) {
        this.setState({ error: error.message, loading: false });
      }
    }
  }

  render() {
    const { data, loading, error } = this.state;
    const { actionPanelWidget, widgetRegistry, size, theme, columns, title } = this.props;

    if (loading) {
      return React.createElement(
        'div',
        { 
          style: { 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100px',
            color: '#666'
          } 
        },
        'Loading actions...'
      );
    }

    if (error) {
      return React.createElement(
        'div',
        { 
          style: { 
            color: 'red', 
            padding: '10px',
            textAlign: 'center'
          } 
        },
        `Error: ${error}`
      );
    }

    const ActionPanelWidgetComponent = widgetRegistry.get(actionPanelWidget.type);
    if (!ActionPanelWidgetComponent) {
      return React.createElement(
        'div', 
        { style: { color: 'red', padding: '10px' } }, 
        `Action panel widget "${actionPanelWidget.type}" not found`
      );
    }

    const widgetProps = {
      ...actionPanelWidget.props,
      actions: (data || actionPanelWidget.props.actions || []).map((action: any) => ({
        ...action,
        onClick: () => this.handleActionClick(action)
      })),
      columns,
      size,
      theme
    };

    // Return widget directly without container or title
    return React.createElement(ActionPanelWidgetComponent, widgetProps);
  }
}

export interface ActionPanelGadgetConfig extends Omit<GadgetConfig, 'widgets'> {
  title?: string;
  actionPanelWidget: WidgetConfig;
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  columns?: number;
}

export class ActionPanelGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'action-panel-gadget',
    name: 'Action Panel Gadget',
    version: '1.0.0',
    description: '',
    author: 'Gadget Library',
    tags: ['action', 'panel', 'navigation', 'quicklinks', 'gadget'],
    category: 'dashboard',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['action-panel'],
    dataFlow: {
      inputs: ['actions-data'],
      outputs: ['navigation-events'],
      transformations: ['data-formatting']
    },
    layout: {
      type: 'grid',
      responsive: true
    },
    interactions: {
      events: ['action-click'],
      handlers: ['onActionClick'],
      workflows: ['navigation']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    description: 'Action Panel Gadget configuration schema with Zod validation',
    properties: {
      id: {
        type: 'string',
        description: 'Unique gadget identifier',
        minLength: 1
      },
      type: {
        type: 'string',
        description: 'Gadget type identifier',
        enum: ['action-panel-gadget']
      },
      title: {
        type: 'string',
        description: 'Action panel gadget title',
        default: 'Quick Actions'
      },
      position: {
        type: 'object',
        description: 'Position value - either simple number or grid position object'
      },
      config: {
        type: 'object',
        description: 'Simplified flat action panel configuration',
        properties: {
          dataUrl: { type: 'string', format: 'uri' },
          dataPath: { type: 'string' },
          layout: { type: 'string', enum: ['horizontal', 'vertical', 'grid'], default: 'horizontal' },
          maxItems: { type: 'number', minimum: 1, default: 5 },
          showIcons: { type: 'boolean', default: true },
          showLabels: { type: 'boolean', default: true },
          cardSize: { type: 'string', enum: ['small', 'medium', 'large'], default: 'large' },
          spacing: { type: 'string', enum: ['compact', 'comfortable', 'even'], default: 'even' },
          actions: {
            type: 'array',
            description: 'Array of action button configurations',
            items: {
              type: 'object',
              properties: {
                key: { type: 'string', minLength: 1 },
                label: { type: 'string', minLength: 1 },
                description: { type: 'string' },
                icon: { type: 'string' },
                type: { type: 'string', enum: ['primary', 'default', 'dashed', 'text', 'link'], default: 'default' },
                route: { type: 'string' },
                workspace: { type: 'string' },
                disabled: { type: 'boolean', default: false }
              },
              required: ['key', 'label']
            }
          }
        },
        required: ['actions']
      }
    },
    required: ['id', 'type', 'config'],
    widgetSchemas: {
      'action-panel': {
        type: 'object',
        properties: {
          actions: { type: 'array' },
          columns: { type: 'number' },
          size: { type: 'string' },
          theme: { type: 'string' }
        }
      }
    }
  };

  async fetchData(dataSource: any): Promise<any> {
    if (!dataSource || !dataSource.url) {
      return null;
    }

    try {
      const response = await BaseGadget.makeAuthenticatedFetch(dataSource.url, {
        method: dataSource.method || 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.processDataMapping(data, dataSource.valueMapping);
    } catch (error) {
      return null;
    }
  }

  private processDataMapping(data: any, mapping: any): any {
if (!mapping) return data;

    const { dataPath, filterBy, sortBy, fields, maxItems } = mapping;
    
    // Navigate to the data path
    let targetData = data;
    if (dataPath) {
      targetData = data[dataPath];
}

    // Filter data if needed
    if (filterBy && Array.isArray(targetData)) {
targetData = targetData.filter((item: any) => {
        const matches = Object.keys(filterBy).every(key => {
          const itemValue = item[key];
          const filterValue = filterBy[key];
return itemValue === filterValue;
        });
return matches;
      });
}

    // Sort data if needed
    if (sortBy && Array.isArray(targetData)) {
targetData.sort((a: any, b: any) => {
        const aValue = a[sortBy.field];
        const bValue = b[sortBy.field];
        
        if (sortBy.order === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
}

    // Limit data if maxItems is specified
    if (maxItems && Array.isArray(targetData) && targetData.length > maxItems) {
targetData = targetData.slice(0, maxItems);
}

    // Map fields
    if (fields && Array.isArray(targetData)) {
targetData = targetData.map((item: any) => {
        const mappedItem: any = {};
        Object.keys(fields).forEach(targetField => {
          const sourceField = fields[targetField];
          if (item[sourceField] !== undefined) {
            mappedItem[targetField] = item[sourceField];
          }
        });
        return mappedItem;
      });
}
return targetData;
  }

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    const config = props as any;
    
    // Extract config from nested structure if present
    const actualConfig = config.config || config;
    
    const {
      title = 'Quick Actions',
      dataUrl,
      dataPath,
      filterBy,
      sortBy,
      maxItems,
      layout = 'grid',
      size = 'medium',
      theme = 'light',
      columns = 3,
      actionPanelWidget,  // Check if it's using the legacy nested format
      actions  // Direct actions array in flat format
    } = actualConfig;

    // Get widget registry from context
    const widgetRegistry = (context as any)?.widgetRegistry;
    if (!widgetRegistry) {
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px' } },
        'Error: Widget registry not available'
      );
    }

    // Handle both new flat config and legacy nested actionPanelWidget config
    let dataSource;
    let widgetType = 'action-panel'; // Default widget type
    let widgetProps;

    if (actionPanelWidget) {
      // Legacy nested format
      dataSource = actionPanelWidget.props?.dataSource;
      widgetType = actionPanelWidget.type;
      widgetProps = {
        ...actionPanelWidget.props,
        columns,
        size,
        theme
      };
    } else {
      // New flat format
      if (dataUrl) {
        dataSource = {
          url: dataUrl,
          method: 'GET',
          valueMapping: {
            dataPath,
            filterBy,
            sortBy,
            maxItems
          }
        };
      }
      widgetProps = {
        columns,
        size,
        theme,
        layout,
        maxItems,
        actions: actions || []  // Include actions from flat format
      };
    }
    if (dataSource) {
      // Create synthetic actionPanelWidget for the data fetcher
      const syntheticActionPanelWidget = {
        type: widgetType,
        props: widgetProps
      };
      
      // Use the data fetcher component
      return React.createElement(ActionPanelDataFetcher, {
        dataSource,
        actionPanelWidget: syntheticActionPanelWidget,
        widgetRegistry,
        size,
        theme,
        columns,
        title,
        context,
        fetchData: this.fetchData.bind(this)
      });
    }

    // If no data source, render directly
// Safely get available widgets based on widgetRegistry type
    let availableWidgets = [];
    try {
      if (widgetRegistry && typeof widgetRegistry === 'object') {
        if (widgetRegistry.keys && typeof widgetRegistry.keys === 'function') {
          // It's a Map
          availableWidgets = Array.from(widgetRegistry.keys());
        } else if (widgetRegistry.getRegisteredTypes && typeof widgetRegistry.getRegisteredTypes === 'function') {
          // It's a custom registry with getRegisteredTypes method
          availableWidgets = widgetRegistry.getRegisteredTypes();
        } else {
          // It's a plain object
          availableWidgets = Object.keys(widgetRegistry);
        }
      }
    } catch (error) {
      availableWidgets = ['Unable to enumerate'];
    }
const ActionPanelWidgetComponent = widgetRegistry.get ?
      widgetRegistry.get(widgetType) :
      widgetRegistry[widgetType];

    if (!ActionPanelWidgetComponent) {
      return React.createElement(
        'div', 
        { style: { color: 'red', padding: '10px' } }, 
        `Action panel widget "${widgetType}" not found. Available: ${availableWidgets.join(', ')}`
      );
    }

    // Map actions to the format expected by ActionPanelWidget
    const mappedActions = (actions || []).map((action: any) => ({
      title: action.label || action.title,  // Map label to title
      description: action.description,
      icon: action.icon,
      color: action.type === 'primary' ? 'primary' : 'success',  // Map type to color
      onClick: async () => {
if (action.workspace) {
// Determine the target module from workspace path
          const workspacePath = action.workspace;
          const moduleId = workspacePath.split('/')[0]; // e.g., 'asset-manager' from 'asset-manager/paint-specs-dashboard'
// Check if we need to switch modules by comparing workspace paths
          const currentWorkspace = window.location.search.includes('workspace=') 
            ? new URLSearchParams(window.location.search).get('workspace') 
            : '';
          const currentModuleId = currentWorkspace ? currentWorkspace.split('/')[0] : '';
          if (currentModuleId !== moduleId) {
            const url = new URL(window.location.href);
            url.searchParams.set('workspace', action.workspace);
            
            window.location.href = url.toString();
            return;
          }
          
          // Handle workspace navigation using the correct action type
          if (context && (context as any).onAction) {
            (context as any).onAction('navigate', {
              workspace: action.workspace,
              route: action.route,
              key: action.key,
              label: action.label || action.title,
              type: action.type || 'item'
            });
          }
        } else if (action.route) {
          
          // Handle route navigation
          if (context && (context as any).onAction) {
            (context as any).onAction('navigate', {
              route: action.route,
              key: action.key,
              label: action.label || action.title,
              type: action.type || 'item'
            });
          }
        }
      }
    }));
    
    
    
    const finalProps = {
      title,
      actions: mappedActions
    };
    
    
    
    // Return widget directly without container or title
    return React.createElement(ActionPanelWidgetComponent, finalProps);
  }


  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    // Validate base gadget config
    const baseValidation = this.validateGadgetConfig(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    // Validate with Zod schema
    try {
      ActionPanelGadgetConfigSchema.parse(config);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        errors.push(...zodErrors);
      } else {
        errors.push(`Validation error: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to get validated config with defaults applied
  getValidatedConfig(config: any): z.infer<typeof ActionPanelGadgetConfigSchema> | null {
    try {
      return ActionPanelGadgetConfigSchema.parse(config);
    } catch (error) {
      return null;
    }
  }

  // Override renderStructured to properly handle hideWrapper
  renderStructured(props: any, context?: GadgetContext): {
    body: React.ReactNode;
    containerProps: GadgetContainerProps;
  } {
    const body = this.renderBody(props, context);
    const containerProps = this.getContainerProps(props, context);
    
    return {
      body,
      containerProps
    };
  }

  // Override container props to support hiding wrapper
  getContainerProps(props: any, context?: GadgetContext): GadgetContainerProps {
    // Check if wrapper should be hidden via config
    const config = props.config || {};
    const hideWrapper = config.hideWrapper || config.noContainer || config.minimal;
    
    
    
    return {
      header: hideWrapper ? undefined : (this.renderHeader ? this.renderHeader(props, context) : undefined),
      footer: hideWrapper ? undefined : (this.renderFooter ? this.renderFooter(props, context) : undefined),
      refreshable: hideWrapper ? false : false,
      configurable: hideWrapper ? false : true,
      expandable: hideWrapper ? false : true,
      loading: false,
      error: undefined,
      size: 'medium',
      noPadding: hideWrapper ? true : false // Remove padding when wrapper is hidden
    };
  }

  getRequiredWidgets(): string[] {
    return ['action-panel'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    // Process and transform data for action panel display
    return this.sanitizeData(data);
  }

  onGadgetMount(): void {
    
  }

  onGadgetUnmount(): void {
    
  }

  onWidgetAdd(widget: any): void {
    
  }

  onWidgetRemove(widgetId: string): void {
    
  }

  onDataFlowChange(connections: Map<string, string[]>): void {
    
  }


} 
