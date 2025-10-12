/**
 * Inline Editable Grid Gadget
 * 
 * A gadget wrapper around the InlineEditableGrid component for use in workspaces.
 * Provides metadata-driven configuration for bulk editing tabular data.
 */

import React from 'react';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import InlineEditableGrid, { type ColumnDefinition, type CrudEndpoints, type GridConfig } from './InlineEditableGrid';

interface InlineEditableGridGadgetConfig extends GadgetConfig {
  entityId?: string;
  baseUrl: string;
  endpoints: CrudEndpoints;
  columns: ColumnDefinition[];
  config?: GridConfig;
}

interface InlineEditableGridGadgetViewProps {
  entityId?: string;
  baseUrl?: string;
  endpoints?: CrudEndpoints;
  columns?: ColumnDefinition[];
  config?: GridConfig;
  [key: string]: any; // Allow additional props from workspace config
}

const InlineEditableGridGadgetView: React.FC<InlineEditableGridGadgetViewProps> = (props) => {
  
  
  const {
    entityId,
    baseUrl,
    endpoints,
    columns,
    config: gridConfig = {},
    ...otherProps
  } = props;

  const handleDataChange = (data: any[]) => {
    
  };

  const handleError = (error: string) => {
    console.error('Grid error:', error);
  };

  const handleSuccess = (message: string) => {
    
  };

  // Validate required props
  if (!baseUrl) {
    return <div>Error: baseUrl is required</div>;
  }

  if (!endpoints) {
    return <div>Error: endpoints configuration is required</div>;
  }

  if (!columns || !Array.isArray(columns)) {
    return <div>Error: columns array is required</div>;
  }

  return (
    <InlineEditableGrid
      entityId={entityId}
      baseUrl={baseUrl}
      endpoints={endpoints}
      columns={columns}
      config={gridConfig}
      onDataChange={handleDataChange}
      onError={handleError}
      onSuccess={handleSuccess}
    />
  );
};

export default class InlineEditableGridGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'inline-editable-grid-gadget',
    name: 'Inline Editable Grid',
    description: 'Generic inline editable grid for bulk editing tabular data',
    version: '1.0.0',
    gadgetType: GadgetType.DATA,
    widgetTypes: ['inline-editable-grid'],
    tags: ['grid', 'table', 'editable', 'crud', 'data'],
    author: 'System',
    category: 'Data Management'
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      entityId: {
        type: 'string',
        description: 'Optional entity ID for read operations'
      },
      baseUrl: {
        type: 'string',
        description: 'Base URL for API endpoints'
      },
      endpoints: {
        type: 'object',
        description: 'Endpoint configuration for CRUD operations',
        properties: {
          read: { type: 'string' },
          create: { type: 'string' },
          update: { type: 'string' },
          delete: { type: 'string' }
        }
      },
      columns: {
        type: 'array',
        description: 'Array of column configurations',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            title: { type: 'string' },
            dataIndex: { type: 'string' },
            width: { type: 'number' },
            editable: { type: 'boolean' },
            required: { type: 'boolean' },
            type: { type: 'string' },
            placeholder: { type: 'string' },
            optionsUrl: { type: 'string' }
          }
        }
      },
      config: {
        type: 'object',
        description: 'Optional grid configuration settings',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          showInstructions: { type: 'boolean' },
          instructionsText: { type: 'string' },
          enableAdd: { type: 'boolean' },
          enableDelete: { type: 'boolean' },
          enableBulkActions: { type: 'boolean' },
          addButtonText: { type: 'string' },
          saveAllButtonText: { type: 'string' },
          resetChangesButtonText: { type: 'string' },
          newRecordDefaults: { type: 'object' },
          pagination: { type: 'object' },
          styling: { type: 'object' }
        },
        additionalProperties: true // Allow additional properties not defined in schema
      }
    },
    required: ['baseUrl', 'endpoints', 'columns'],
    widgetSchemas: {
      'inline-editable-grid': {
        type: 'object',
        properties: {
          data: { type: 'array' },
          columns: { type: 'array' },
          config: { type: 'object' }
        }
      }
    }
  };

  getMetadata(): GadgetMetadata {
    return this.metadata;
  }

  getSchema(): GadgetSchema {
    return this.schema;
  }

  renderBody(props: any): React.ReactNode {
    
    
    // Extract config from the new props structure
    const { config, context, ...otherProps } = props;
    
    // Spread config properties to maintain compatibility with the view component
    return <InlineEditableGridGadgetView {...config} context={context} {...otherProps} />;
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    const gridConfig = config as InlineEditableGridGadgetConfig;

    // Validate base gadget config
    const baseValidation = this.validateGadgetConfig(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    if (!gridConfig.baseUrl) {
      errors.push('InlineEditableGridGadget: baseUrl is required');
    }

    if (!gridConfig.endpoints) {
      errors.push('InlineEditableGridGadget: endpoints configuration is required');
    }

    if (!gridConfig.columns || !Array.isArray(gridConfig.columns) || gridConfig.columns.length === 0) {
      errors.push('InlineEditableGridGadget: columns array is required and must not be empty');
    }

    // Validate endpoints
    if (gridConfig.endpoints) {
      const requiredEndpoints = ['read', 'create', 'update', 'delete'];
      for (const endpoint of requiredEndpoints) {
        if (!gridConfig.endpoints[endpoint as keyof CrudEndpoints]) {
          errors.push(`InlineEditableGridGadget: ${endpoint} endpoint is required`);
        }
      }
    }

    // Validate columns
    if (gridConfig.columns) {
      for (const column of gridConfig.columns) {
        if (!column.key || !column.title || !column.dataIndex || !column.type) {
          errors.push('InlineEditableGridGadget: each column must have key, title, dataIndex, and type');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['inline-editable-grid'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    return this.sanitizeData(data);
  }

  getPermissions(): string[] {
    return [];
  }

  onConfigChange(config: InlineEditableGridGadgetConfig): void {
    // Handle configuration changes if needed
  }
}
