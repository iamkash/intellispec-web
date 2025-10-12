/**
 * Workspace Library Framework - Base Workspace System
 * 
 * This file defines the base workspace framework for creating hundreds of
 * workspace types that combine multiple gadgets into complete applications.
 * 
 * Workspace Types:
 * - AnalyticsWorkspace: Data analysis and visualization
 * - FormWorkspace: Data entry and form processing
 * - DashboardWorkspace: Business intelligence dashboards
 * - DocumentWorkspace: Document management and editing
 * - ReportWorkspace: Report generation and viewing
 * - CustomWorkspace: User-defined workspace types
 */

import React from 'react';
import { BaseComponent, ComponentMetadata, ComponentSchema, ValidationResult, BaseRegistry } from '../core/base';
import { BaseGadget, GadgetConfig, GadgetContext } from '../gadgets/base';

export enum WorkspaceType {
  ANALYTICS = 'analytics',
  FORM = 'form',
  DASHBOARD = 'dashboard',
  DOCUMENT = 'document',
  REPORT = 'report',
  CUSTOM = 'custom'
}

export interface WorkspaceMetadata extends ComponentMetadata {
  workspaceType: WorkspaceType;
  gadgetTypes: string[];
  layout?: {
    type: 'grid' | 'flex' | 'absolute' | 'tabs' | 'custom';
    responsive: boolean;
    breakpoints?: Record<string, any>;
    scrollable?: boolean;
  };
  features?: {
    search?: boolean;
    filter?: boolean;
    export?: boolean;
    print?: boolean;
    fullscreen?: boolean;
    collaboration?: boolean;
  };
  permissions?: {
    read?: string[];
    write?: string[];
    admin?: string[];
  };
}

export interface WorkspaceSchema extends ComponentSchema {
  gadgetSchemas: Record<string, ComponentSchema>;
  layoutSchema?: ComponentSchema;
  featureSchema?: ComponentSchema;
  permissionSchema?: ComponentSchema;
}

export interface WorkspaceConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  gadgets: GadgetConfig[];
  layout?: {
    type: string;
    props: Record<string, any>;
    areas?: Record<string, any>;
  };
  features?: {
    enabled: string[];
    config: Record<string, any>;
  };
  theme?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    custom?: Record<string, any>;
  };
  permissions?: {
    roles: string[];
    users: string[];
    groups: string[];
  };
  metadata?: Record<string, any>;
}

export interface WorkspaceContext extends GadgetContext {
  workspaceId: string;
  workspaceType: WorkspaceType;
  gadgets: Record<string, BaseGadget>;
  features: Record<string, any>;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canAdmin: boolean;
  };
  theme: Record<string, any>;
}

export abstract class BaseWorkspace extends BaseComponent {
  abstract metadata: WorkspaceMetadata;
  abstract schema: WorkspaceSchema;
  
  abstract render(props: any, context?: WorkspaceContext): React.ReactNode;
  abstract validate(config: WorkspaceConfig): ValidationResult;
  
  // Workspace-specific methods
  abstract getRequiredGadgets(): string[];
  abstract getWorkspaceLayout(): Record<string, any>;
  abstract processWorkspaceData(data: any): any;
  
  // Gadget management
  protected gadgets: Map<string, BaseGadget> = new Map();
  
  // Feature management
  protected features: Map<string, any> = new Map();
  
  // Permission management
  protected permissions: {
    read: Set<string>;
    write: Set<string>;
    admin: Set<string>;
  } = {
    read: new Set(),
    write: new Set(),
    admin: new Set()
  };
  
  // Lifecycle hooks
  onWorkspaceMount?(): void;
  onWorkspaceUnmount?(): void;
  onGadgetAdd?(gadget: BaseGadget): void;
  onGadgetRemove?(gadgetId: string): void;
  onFeatureToggle?(feature: string, enabled: boolean): void;
  onPermissionChange?(permissions: any): void;
  
  // Gadget management methods
  addGadget(gadget: BaseGadget): void {
    this.gadgets.set(gadget.metadata.id, gadget);
    this.onGadgetAdd?.(gadget);
  }
  
  removeGadget(gadgetId: string): void {
    this.gadgets.delete(gadgetId);
    this.onGadgetRemove?.(gadgetId);
  }
  
  getGadget(gadgetId: string): BaseGadget | undefined {
    return this.gadgets.get(gadgetId);
  }
  
  getAllGadgets(): BaseGadget[] {
    return Array.from(this.gadgets.values());
  }
  
  // Feature management methods
  enableFeature(feature: string, config?: any): void {
    this.features.set(feature, config || true);
    this.onFeatureToggle?.(feature, true);
  }
  
  disableFeature(feature: string): void {
    this.features.delete(feature);
    this.onFeatureToggle?.(feature, false);
  }
  
  isFeatureEnabled(feature: string): boolean {
    return this.features.has(feature);
  }
  
  getFeatureConfig(feature: string): any {
    return this.features.get(feature);
  }
  
  // Permission management methods
  addPermission(type: 'read' | 'write' | 'admin', subject: string): void {
    this.permissions[type].add(subject);
    this.onPermissionChange?.(this.permissions);
  }
  
  removePermission(type: 'read' | 'write' | 'admin', subject: string): void {
    this.permissions[type].delete(subject);
    this.onPermissionChange?.(this.permissions);
  }
  
  hasPermission(type: 'read' | 'write' | 'admin', subject: string): boolean {
    return this.permissions[type].has(subject);
  }
  
  checkUserPermissions(user: { id: string; roles: string[]; groups: string[] }): {
    canRead: boolean;
    canWrite: boolean;
    canAdmin: boolean;
  } {
    const canRead = this.hasPermission('read', user.id) || 
                   user.roles.some(role => this.hasPermission('read', role)) ||
                   user.groups.some(group => this.hasPermission('read', group));
    
    const canWrite = this.hasPermission('write', user.id) || 
                    user.roles.some(role => this.hasPermission('write', role)) ||
                    user.groups.some(group => this.hasPermission('write', group));
    
    const canAdmin = this.hasPermission('admin', user.id) || 
                    user.roles.some(role => this.hasPermission('admin', role)) ||
                    user.groups.some(group => this.hasPermission('admin', group));
    
    return { canRead, canWrite, canAdmin };
  }
  
  // Validation methods
  protected validateWorkspaceConfig(config: WorkspaceConfig): ValidationResult {
    const errors: string[] = [];
    
    // Validate base config
    if (!config.id) errors.push('Workspace ID is required');
    if (!config.type) errors.push('Workspace type is required');
    if (!config.title) errors.push('Workspace title is required');
    
    // Validate required gadgets
    const requiredGadgets = this.getRequiredGadgets();
    const providedGadgets = config.gadgets.map(g => g.type);
    
    requiredGadgets.forEach(required => {
      if (!providedGadgets.includes(required)) {
        errors.push(`Required gadget type '${required}' is missing`);
      }
    });
    
    // Validate gadget configurations
    config.gadgets.forEach(gadgetConfig => {
      if (!gadgetConfig.id) {
        errors.push('Gadget ID is required');
      }
      if (!gadgetConfig.type) {
        errors.push('Gadget type is required');
      }
    });
    
    // Validate layout
    if (config.layout && !config.layout.type) {
      errors.push('Layout type is required when layout is specified');
    }
    
    // Validate theme
    if (config.theme) {
      if (!config.theme.primary) errors.push('Primary theme color is required');
      if (!config.theme.background) errors.push('Background theme color is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  protected renderGadgets(config: WorkspaceConfig, context?: WorkspaceContext): React.ReactNode[] {
    return config.gadgets.map(gadgetConfig => {
      const gadget = this.getGadget(gadgetConfig.id);
      if (!gadget) {
        return React.createElement('div', { key: gadgetConfig.id }, `Gadget not found: ${gadgetConfig.id}`);
      }
      
      return React.createElement(
        'div',
        { 
          key: gadgetConfig.id, 
          className: `workspace-gadget gadget-${gadgetConfig.type}` 
        },
        gadget.render(gadgetConfig)
      );
    });
  }
  
  protected applyWorkspaceLayout(gadgets: React.ReactNode[], layout: any): React.ReactNode {
    const layoutType = layout?.type || 'flex';
    const layoutProps = layout?.props || {};
    
    switch (layoutType) {
      case 'grid':
        return React.createElement('div', { className: 'workspace-grid-layout', style: layoutProps }, ...gadgets);
      case 'flex':
        return React.createElement('div', { className: 'workspace-flex-layout', style: layoutProps }, ...gadgets);
      case 'absolute':
        return React.createElement('div', { className: 'workspace-absolute-layout', style: layoutProps }, ...gadgets);
      case 'tabs':
        return this.renderTabLayout(gadgets, layoutProps);
      default:
        return React.createElement('div', { className: 'workspace-custom-layout', style: layoutProps }, ...gadgets);
    }
  }
  
  protected renderTabLayout(gadgets: React.ReactNode[], props: any): React.ReactNode {
    // Tab layout implementation would go here
    return React.createElement('div', { className: 'workspace-tab-layout', style: props }, ...gadgets);
  }
  
  protected applyTheme(theme: any): Record<string, any> {
    return {
      '--primary-color': theme.primary || '#007bff',
      '--secondary-color': theme.secondary || '#6c757d',
      '--background-color': theme.background || '#ffffff',
      '--text-color': theme.text || '#333333',
      ...theme.custom
    };
  }
}

// Workspace Registry
export class WorkspaceRegistry extends BaseRegistry<BaseWorkspace> {
  private typeIndex = new Map<WorkspaceType, Set<string>>();
  private gadgetTypeIndex = new Map<string, Set<string>>();
  
  register(workspace: BaseWorkspace): void {
    super.register(workspace);
    
    // Update type index
    const workspaceType = workspace.metadata.workspaceType;
    if (!this.typeIndex.has(workspaceType)) {
      this.typeIndex.set(workspaceType, new Set());
    }
    this.typeIndex.get(workspaceType)!.add(workspace.metadata.id);
    
    // Update gadget type index
    workspace.metadata.gadgetTypes.forEach(gadgetType => {
      if (!this.gadgetTypeIndex.has(gadgetType)) {
        this.gadgetTypeIndex.set(gadgetType, new Set());
      }
      this.gadgetTypeIndex.get(gadgetType)!.add(workspace.metadata.id);
    });
  }
  
  unregister(id: string): void {
    const workspace = this.get(id);
    if (workspace) {
      // Update type index
      const workspaceType = workspace.metadata.workspaceType;
      const typeSet = this.typeIndex.get(workspaceType);
      if (typeSet) {
        typeSet.delete(id);
        if (typeSet.size === 0) {
          this.typeIndex.delete(workspaceType);
        }
      }
      
      // Update gadget type index
      workspace.metadata.gadgetTypes.forEach(gadgetType => {
        const gadgetTypeSet = this.gadgetTypeIndex.get(gadgetType);
        if (gadgetTypeSet) {
          gadgetTypeSet.delete(id);
          if (gadgetTypeSet.size === 0) {
            this.gadgetTypeIndex.delete(gadgetType);
          }
        }
      });
    }
    
    super.unregister(id);
  }
  
  getByType(type: WorkspaceType): BaseWorkspace[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.get(id))
      .filter((workspace): workspace is BaseWorkspace => workspace !== undefined);
  }
  
  getByGadgetType(gadgetType: string): BaseWorkspace[] {
    const ids = this.gadgetTypeIndex.get(gadgetType);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.get(id))
      .filter((workspace): workspace is BaseWorkspace => workspace !== undefined);
  }
  
  findCompatibleWorkspaces(gadgetTypes: string[]): BaseWorkspace[] {
    return this.getAll().filter(workspace => 
      gadgetTypes.some(gadgetType => 
        workspace.metadata.gadgetTypes.includes(gadgetType)
      )
    );
  }
}

// Global workspace registry instance
export const workspaceRegistry = new WorkspaceRegistry();

// Workspace factory for creating workspace instances
export class WorkspaceFactory {
  static createWorkspace(type: string, config: WorkspaceConfig, context?: WorkspaceContext): React.ReactNode {
    const workspace = workspaceRegistry.get(type);
    if (!workspace) {
      throw new Error(`Workspace type '${type}' not found`);
    }
    
    const validation = workspace.validate(config);
    if (!validation.isValid) {
      throw new Error(`Invalid workspace configuration: ${validation.errors.join(', ')}`);
    }
    
    return workspace.render(config, context);
  }
  
  static validateWorkspaceConfig(type: string, config: WorkspaceConfig): ValidationResult {
    const workspace = workspaceRegistry.get(type);
    if (!workspace) {
      return {
        isValid: false,
        errors: [`Workspace type '${type}' not found`]
      };
    }
    
    return workspace.validate(config);
  }
  
  static getWorkspaceSchema(type: string): WorkspaceSchema | undefined {
    const workspace = workspaceRegistry.get(type);
    return workspace?.schema;
  }
  
  static getAvailableWorkspaces(): WorkspaceMetadata[] {
    return workspaceRegistry.getAll().map(workspace => workspace.metadata);
  }
  
  static getWorkspacesForGadgets(gadgetTypes: string[]): WorkspaceMetadata[] {
    return workspaceRegistry.findCompatibleWorkspaces(gadgetTypes)
      .map(workspace => workspace.metadata);
  }
} 