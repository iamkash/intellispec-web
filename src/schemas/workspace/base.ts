/**
 * =============================================================================
 * BASE WORKSPACE SCHEMA
 * =============================================================================
 * 
 * Simple base types for workspace system.
 * These are minimal foundational types that don't require complex abstractions.
 */

/**
 * Basic validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Simple workspace layout enumeration
 */
export enum WorkspaceLayout {
  DASHBOARD = 'dashboard',
  GRID = 'grid',
  CUSTOM = 'custom'
}

/**
 * Basic workspace configuration
 */
export interface BaseWorkspaceConfig {
  autoRefresh?: boolean;
  refreshInterval?: number;
  theme?: string;
  showHeader?: boolean;
  showFooter?: boolean;
} 