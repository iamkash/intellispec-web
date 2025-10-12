/**
 * Widget Library Framework - Base Widget System
 * 
 * This file defines the base widget framework for creating thousands of
 * reusable, composable widgets that can be combined into gadgets.
 * 
 * Widget Types:
 * - DataWidget: Handles data visualization (charts, tables, etc.)
 * - InputWidget: Handles user input (forms, controls, etc.)
 * - DisplayWidget: Handles content display (text, images, etc.)
 * - InteractionWidget: Handles user interactions (buttons, menus, etc.)
 * - LayoutWidget: Handles layout and positioning
 */

import React from 'react';
import { BaseComponent, ComponentMetadata, ComponentSchema, ValidationResult, BaseRegistry } from '../core/base';

export enum WidgetType {
  DATA = 'data',
  INPUT = 'input',
  DISPLAY = 'display',
  INTERACTION = 'interaction',
  LAYOUT = 'layout',
  CUSTOM = 'custom'
}

export interface WidgetMetadata extends ComponentMetadata {
  widgetType: WidgetType;
  dataBinding?: {
    accepts: string[];
    provides: string[];
  };
  styling?: {
    themeable: boolean;
    customizable: boolean;
    responsive: boolean;
  };
  interactions?: {
    events: string[];
    handlers: string[];
  };
}

export interface WidgetSchema extends ComponentSchema {
  dataSchema?: {
    input?: ComponentSchema;
    output?: ComponentSchema;
  };
  styleSchema?: ComponentSchema;
  eventSchema?: ComponentSchema;
}

export interface WidgetConfig {
  id: string;
  type: string;
  props: Record<string, any>;
  data?: any;
  style?: Record<string, any>;
  events?: Record<string, Function>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  authorization?: {
    roles?: string[];
    permissions?: string[];
  };
}

export interface WidgetContext {
  theme?: {
    isDarkMode?: boolean;
    fontFamily?: string;
    [key: string]: any;
  };
  locale?: string;
  user?: {
    id: string;
    roles: string[];
    permissions: string[];
  };
  data?: any;
  events?: Record<string, Function>;
}

export abstract class BaseWidget extends BaseComponent {
  abstract metadata: WidgetMetadata;
  abstract schema: WidgetSchema;
  
  abstract render(props: any, context?: WidgetContext): React.ReactNode;
  abstract validate(config: WidgetConfig): ValidationResult;
  
  // Widget-specific methods
  abstract getDataRequirements(): string[];
  abstract getOutputSchema(): ComponentSchema;
  
  // Data processing
  processData?(data: any): any;
  
  // Event handling
  onEvent?(event: string, data: any): void;
  
  // Lifecycle hooks specific to widgets
  onDataChange?(data: any): void;
  onConfigChange?(config: WidgetConfig): void;
  onResize?(dimensions: { width: number; height: number }): void;
  
  // Utility methods
  protected validateWidgetConfig(config: WidgetConfig): ValidationResult {
    const errors: string[] = [];
    
    // Validate base config
    if (!config.id) errors.push('Widget ID is required');
    if (!config.type) errors.push('Widget type is required');
    
    // Validate data requirements
    const dataRequirements = this.getDataRequirements();
    if (dataRequirements.length > 0 && !config.data) {
      errors.push(`Widget requires data: ${dataRequirements.join(', ')}`);
    }
    
    // Validate authorization
    if (config.authorization && config.authorization.roles) {
      if (!Array.isArray(config.authorization.roles)) {
        errors.push('Authorization roles must be an array');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  protected sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Basic XSS prevention
      return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }
    
    return data;
  }
}

// Widget Registry
export class WidgetRegistry extends BaseRegistry<BaseWidget> {
  private typeIndex = new Map<WidgetType, Set<string>>();
  
  register(widget: BaseWidget): void {
    super.register(widget);
    
    // Update type index
    const widgetType = widget.metadata.widgetType;
    if (!this.typeIndex.has(widgetType)) {
      this.typeIndex.set(widgetType, new Set());
    }
    this.typeIndex.get(widgetType)!.add(widget.metadata.id);
  }
  
  unregister(id: string): void {
    const widget = this.get(id);
    if (widget) {
      const widgetType = widget.metadata.widgetType;
      const typeSet = this.typeIndex.get(widgetType);
      if (typeSet) {
        typeSet.delete(id);
        if (typeSet.size === 0) {
          this.typeIndex.delete(widgetType);
        }
      }
    }
    
    super.unregister(id);
  }
  
  getByType(type: WidgetType): BaseWidget[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.get(id))
      .filter((widget): widget is BaseWidget => widget !== undefined);
  }
  
  // Find widgets that can process specific data types
  findDataProcessors(dataType: string): BaseWidget[] {
    return this.getAll().filter(widget => 
      widget.metadata.dataBinding?.accepts.includes(dataType)
    );
  }
  
  // Find widgets that provide specific data outputs
  findDataProviders(outputType: string): BaseWidget[] {
    return this.getAll().filter(widget => 
      widget.metadata.dataBinding?.provides.includes(outputType)
    );
  }
}

// Global widget registry instance
export const widgetRegistry = new WidgetRegistry();

// Widget factory for creating widget instances
export class WidgetFactory {
  static createWidget(type: string, config: WidgetConfig, context?: WidgetContext): React.ReactNode {
    const widget = widgetRegistry.get(type);
    if (!widget) {
      throw new Error(`Widget type '${type}' not found`);
    }
    
    const validation = widget.validate(config);
    if (!validation.isValid) {
      throw new Error(`Invalid widget configuration: ${validation.errors.join(', ')}`);
    }
    
    return widget.render(config.props, context);
  }
  
  static validateWidgetConfig(type: string, config: WidgetConfig): ValidationResult {
    const widget = widgetRegistry.get(type);
    if (!widget) {
      return {
        isValid: false,
        errors: [`Widget type '${type}' not found`]
      };
    }
    
    return widget.validate(config);
  }
  
  static getWidgetSchema(type: string): WidgetSchema | undefined {
    const widget = widgetRegistry.get(type);
    return widget?.schema;
  }
  
  static getAvailableWidgets(): WidgetMetadata[] {
    return widgetRegistry.getAll().map(widget => widget.metadata);
  }
} 