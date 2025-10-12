/**
 * Module System Types
 * 
 * This file defines the TypeScript interfaces for the module system that drives
 * the application's licensable components and navigation structure.
 */

import type { MenuProps } from 'antd';

export interface Module {
  id: string;
  label: string;
  icon: string;
  license_id: string;
  auth_id: string;
  default_workspace: string;
  menu_url: string;
  description?: string;
  version?: string;
  enabled: boolean;
  order: number;
  color?: string;
  category?: string;
}

export interface MenuItem {
  key: string;
  icon: string;
  label: string;
  license_id: string;
  auth_id: string;
  enabled: boolean;
  order: number;
  route?: string;
  parent_key?: string;
  children?: MenuItem[];
  permissions?: string[];
  description?: string;
  type?: 'item' | 'group' | 'divider';
  workspace?: string;
  is_default?: boolean;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  menu_items: MenuItem[];
  default_route: string;
  permissions: string[];
  workspace_config: {
    default_view: string;
    available_views: string[];
    settings: Record<string, any>;
  };
  features: {
    id: string;
    name: string;
    enabled: boolean;
    config?: Record<string, any>;
  }[];
  integrations?: {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
  }[];
}

export interface ModuleContext {
  currentModule: Module | null;
  moduleDefinition: ModuleDefinition | null;
  availableModules: Module[];
  isLoading: boolean;
  error?: string;
}

export interface ModuleBarProps {
  modules: Module[];
  currentModule?: Module | null;
  onModuleSelect: (module: Module) => void;
  className?: string;
}

export interface ModuleContainerProps {
  children: React.ReactNode;
  onModuleChange?: (module: Module | null) => void;
}

// Module categories for organization
export enum ModuleCategory {
  INSPECTION = 'inspection',
  COMPLIANCE = 'compliance',
  WORKFORCE = 'workforce',
  ASSET = 'asset',
  SYSTEM = 'system',
  GENERAL = 'general'
}

// Module license types
export enum LicenseType {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  TRIAL = 'trial'
}

// Module authentication levels
export enum AuthLevel {
  PUBLIC = 'public',
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
} 