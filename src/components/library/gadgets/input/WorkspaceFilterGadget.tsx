/**
 * Workspace Filter Gadget
 * 
 * Generic gadget for rendering workspace-level filters.
 * Completely metadata-driven with configurable filter definitions.
 */

import React from 'react';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import { ValidationResult } from '../../core/base';
import WorkspaceFilterWidget from '../../widgets/input/WorkspaceFilterWidget';
import { FilterDefinition } from '../../../../contexts/WorkspaceFilterContext';

export interface WorkspaceFilterGadgetConfig extends GadgetConfig {
  filterDefinitions: FilterDefinition[];
  filterLayout?: 'horizontal' | 'vertical' | 'compact';
  showClearAll?: boolean;
  showFilterCount?: boolean;
  title?: string;
}

export class WorkspaceFilterGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'workspace-filter-gadget',
    name: 'Workspace Filter Gadget',
    version: '1.0.0',
    description: 'Generic workspace-level filter gadget with metadata-driven filter definitions',
    author: 'Gadget Library',
    tags: ['filter', 'workspace', 'input'],
    category: 'input',
    gadgetType: GadgetType.FORM,
    widgetTypes: ['workspace-filter'],
    dataFlow: {
      inputs: [],
      outputs: ['filter-events'],
      transformations: ['filter-processing']
    },
    layout: {
      type: 'flex',
      responsive: true
    },
    interactions: {
      events: ['filter-change', 'filter-clear'],
      handlers: ['onFilterChange', 'onFilterClear'],
      workflows: ['filter-interaction']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      filterDefinitions: {
        type: 'array',
        description: 'Array of filter definitions',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { 
              type: 'string', 
              enum: ['select', 'multiselect', 'daterange', 'text', 'number'] 
            },
            label: { type: 'string' },
            placeholder: { type: 'string' },
            required: { type: 'boolean' },
            defaultValue: { type: 'any' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: { type: 'any' }
                }
              }
            },
            optionsUrl: { type: 'string' },
            validation: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                pattern: { type: 'string' }
              }
            },
            dependencies: {
              type: 'array',
              items: { type: 'string' }
            },
            refreshTrigger: { type: 'boolean' }
          },
          required: ['id', 'type', 'label']
        }
      },
      filterLayout: {
        type: 'string',
        enum: ['horizontal', 'vertical', 'compact'],
        default: 'horizontal'
      },
      showClearAll: {
        type: 'boolean',
        default: true
      },
      showFilterCount: {
        type: 'boolean',
        default: true
      },
      title: {
        type: 'string',
        description: 'Optional title for the filter section'
      }
    },
    required: ['filterDefinitions'],
    widgetSchemas: {
      'workspace-filter': {
        type: 'object',
        properties: {
          filterDefinitions: { type: 'array' },
          layout: { type: 'string' },
          showClearAll: { type: 'boolean' },
          showFilterCount: { type: 'boolean' }
        }
      }
    }
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    // Handle both direct config and wrapped config structure
    const config = props.config || props;
    const {
      filterDefinitions = [],
      filterLayout = 'horizontal',
      showClearAll = true,
      showFilterCount = true
    } = config;



    if (!filterDefinitions || filterDefinitions.length === 0) {
      return React.createElement(
        'div',
        { 
          style: { 
            padding: '20px', 
            textAlign: 'center',
            color: 'hsl(var(--muted-foreground))'
          } 
        },
        'No filter definitions provided'
      );
    }

    return React.createElement(WorkspaceFilterWidget, {
      filterDefinitions,
      layout: filterLayout,
      showClearAll,
      showFilterCount
    });
  }

  validate(config: GadgetConfig): ValidationResult {
    const filterConfig = config as WorkspaceFilterGadgetConfig;
    const errors: string[] = [];

    if (!filterConfig.filterDefinitions) {
      errors.push('filterDefinitions is required');
    } else if (!Array.isArray(filterConfig.filterDefinitions)) {
      errors.push('filterDefinitions must be an array');
    } else {
      filterConfig.filterDefinitions.forEach((filterDef, index) => {
        if (!filterDef.id) {
          errors.push(`filterDefinitions[${index}].id is required`);
        }
        if (!filterDef.type) {
          errors.push(`filterDefinitions[${index}].type is required`);
        }
        if (!filterDef.label) {
          errors.push(`filterDefinitions[${index}].label is required`);
        }
      });
    }

    if (filterConfig.filterLayout && !['horizontal', 'vertical', 'compact'].includes(filterConfig.filterLayout)) {
      errors.push('filterLayout must be one of: horizontal, vertical, compact');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['workspace-filter'];
  }

  getWidgetLayout(): Record<string, any> {
    return {};
  }

  processDataFlow(data: any): any {
    return data;
  }

  // Override container props to hide header if no title is provided
  getContainerProps(props: WorkspaceFilterGadgetConfig, context?: GadgetContext) {
    const containerProps = super.getContainerProps(props, context);
    
    // Hide header if no title is provided
    if (!props.title) {
      return {
        ...containerProps,
        header: undefined
      };
    }

    return {
      ...containerProps,
      header: {
        title: props.title,
        subtitle: 'Workspace Filters'
      }
    };
  }
}

export default WorkspaceFilterGadget;
