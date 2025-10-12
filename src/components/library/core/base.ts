/**
 * Component Library Framework - Core Base Types
 * 
 * This file defines the foundational interfaces and types for a scalable
 * component library system that can handle thousands of widgets, gadgets,
 * and hundreds of workspace types.
 * 
 * Architecture:
 * - Each component type (Widget, Gadget, Workspace) has its own folder
 * - Components are auto-discovered and registered
 * - Schema-driven composition with type safety
 * - Plugin-based extensibility
 */

export interface ComponentMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
  category?: string;
  dependencies?: string[];
  deprecated?: boolean;
  experimental?: boolean;
}

export interface ComponentSchema {
  type: string;
  properties?: Record<string, ComponentSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: ComponentSchema; // For array types
  enum?: any[]; // For enum types
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  default?: any;
  description?: string; // Schema description
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ComponentConfig {
  id: string;
  type: string;
  props: Record<string, any>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: Record<string, any>;
  className?: string;
  authorization?: {
    roles?: string[];
    permissions?: string[];
  };
}

export interface ComponentInstance {
  id: string;
  metadata: ComponentMetadata;
  schema: ComponentSchema;
  config: ComponentConfig;
  render: (props: any) => React.ReactNode;
  validate: (config: any) => ValidationResult;
  onMount?: () => void;
  onUnmount?: () => void;
}

export abstract class BaseComponent {
  abstract metadata: ComponentMetadata;
  abstract schema: ComponentSchema;
  
  abstract render(props: any): React.ReactNode;
  abstract validate(config: any): ValidationResult;
  
  // Lifecycle hooks
  onMount?(): void;
  onUnmount?(): void;
  
  // Schema utilities
  protected validateRequired(config: any, required: string[]): string[] {
    const errors: string[] = [];
    required.forEach(field => {
      if (!(field in config) || config[field] === undefined || config[field] === null) {
        errors.push(`Required field '${field}' is missing`);
      }
    });
    return errors;
  }
  
  protected validateType(value: any, expectedType: string, fieldName: string): string[] {
    const errors: string[] = [];
    const actualType = typeof value;
    
    if (actualType !== expectedType) {
      errors.push(`Field '${fieldName}' expected ${expectedType}, got ${actualType}`);
    }
    
    return errors;
  }
}

export interface ComponentRegistry<T extends BaseComponent> {
  register(component: T): void;
  unregister(id: string): void;
  get(id: string): T | undefined;
  getAll(): T[];
  getByCategory(category: string): T[];
  getByTag(tag: string): T[];
  search(query: string): T[];
  validate(id: string, config: any): ValidationResult;
}

export class BaseRegistry<T extends BaseComponent> implements ComponentRegistry<T> {
  private components = new Map<string, T>();
  private categoryIndex = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  
  register(component: T): void {
    const id = component.metadata.id;
    
    if (this.components.has(id)) {
      throw new Error(`Component with id '${id}' is already registered`);
    }
    
    this.components.set(id, component);
    
    // Update category index
    if (component.metadata.category) {
      if (!this.categoryIndex.has(component.metadata.category)) {
        this.categoryIndex.set(component.metadata.category, new Set());
      }
      this.categoryIndex.get(component.metadata.category)!.add(id);
    }
    
    // Update tag index
    if (component.metadata.tags) {
      component.metadata.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(id);
      });
    }
  }
  
  unregister(id: string): void {
    const component = this.components.get(id);
    if (!component) return;
    
    this.components.delete(id);
    
    // Update category index
    if (component.metadata.category) {
      const categorySet = this.categoryIndex.get(component.metadata.category);
      if (categorySet) {
        categorySet.delete(id);
        if (categorySet.size === 0) {
          this.categoryIndex.delete(component.metadata.category);
        }
      }
    }
    
    // Update tag index
    if (component.metadata.tags) {
      component.metadata.tags.forEach(tag => {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(id);
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }
  }
  
  get(id: string): T | undefined {
    return this.components.get(id);
  }
  
  getAll(): T[] {
    return Array.from(this.components.values());
  }
  
  getByCategory(category: string): T[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.components.get(id))
      .filter((component): component is T => component !== undefined);
  }
  
  getByTag(tag: string): T[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.components.get(id))
      .filter((component): component is T => component !== undefined);
  }
  
  search(query: string): T[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(component => 
      component.metadata.name.toLowerCase().includes(lowerQuery) ||
      component.metadata.description.toLowerCase().includes(lowerQuery) ||
      component.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  validate(id: string, config: any): ValidationResult {
    const component = this.components.get(id);
    if (!component) {
      return {
        isValid: false,
        errors: [`Component with id '${id}' not found`]
      };
    }
    
    return component.validate(config);
  }
  
  // Registry statistics
  getStats() {
    return {
      totalComponents: this.components.size,
      categories: Array.from(this.categoryIndex.keys()),
      tags: Array.from(this.tagIndex.keys()),
      componentsByCategory: Object.fromEntries(
        Array.from(this.categoryIndex.entries()).map(([cat, ids]) => [cat, ids.size])
      )
    };
  }
}

export interface ComponentLibraryConfig {
  autoDiscovery?: boolean;
  lazyLoading?: boolean;
  cacheEnabled?: boolean;
  devMode?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export class ComponentLibraryLogger {
  constructor(private level: string = 'info') {}
  
  error(message: string, ...args: any[]) {
    console.error(`[ComponentLibrary] ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[ComponentLibrary] ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(`[ComponentLibrary] ${message}`, ...args);
    }
  }
  
  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
}
  }
  
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }
}

// Utility functions for component development
export class ComponentUtils {
  static generateId(prefix: string = 'comp'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static sanitizeProps(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string') {
        // Basic XSS prevention
        sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  static validateSchema(data: any, schema: ComponentSchema): ValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (!(field in data)) {
          errors.push(`Required field '${field}' is missing`);
        }
      });
    }
    
    // Validate property types
    if (schema.properties) {
      for (const [key, value] of Object.entries(data)) {
        if (schema.properties[key]) {
          const expectedType = schema.properties[key].type;
          const actualType = typeof value;
          
          if (expectedType && actualType !== expectedType) {
            errors.push(`Field '${key}' expected ${expectedType}, got ${actualType}`);
          }
        } else if (!schema.additionalProperties) {
          errors.push(`Unknown property '${key}'`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 