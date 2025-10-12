/**
 * =============================================================================
 * WORKSPACE DEFINITION SCHEMA
 * =============================================================================
 * 
 * Core workspace structure for the dashboard system.
 * Defines the layout and configuration of gadgets within a workspace.
 */

import { GridPosition } from '../../components/ui/GridLayoutRenderer';

/**
 * Main workspace definition structure
 */
export interface WorkspaceDefinition {
  id: string;
  title: string;
  description: string;
  layout: WorkspaceLayout | WorkspaceLayoutConfig;
  gadgets?: WorkspaceGadget[];
  settings?: WorkspaceSettings;
  metadata?: WorkspaceMetadata;
}

/**
 * Individual gadget within a workspace
 */
export interface WorkspaceGadget {
  id: string;
  type: string;
  title: string;
  position: GridPosition; // Simple number (1-12) for grid width
  config: Record<string, any>;
  
  // Optional properties
  description?: string;
  tags?: string[];
}

/**
 * Workspace layout types
 */
export type WorkspaceLayout = 'dashboard' | 'grid' | 'custom';

/**
 * Workspace layout configuration
 */
export interface WorkspaceLayoutConfig {
  type: 'grid' | 'dashboard' | 'custom';
  columns?: number;
  rows?: number;
  gadgets?: WorkspaceGadget[];
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  autoRefresh?: boolean;
  refreshInterval?: number;
  theme?: string;
  density?: string;
  showLastUpdated?: boolean;
  enableExport?: boolean;
  enablePrint?: boolean;
}

/**
 * Workspace metadata
 */
export interface WorkspaceMetadata {
  created?: string;
  version?: string;
  tags?: string[];
  description?: string;
}

/**
 * Workspace validation result
 */
export interface WorkspaceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a workspace definition
 */
export const validateWorkspace = (workspace: WorkspaceDefinition): WorkspaceValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (!workspace.id) errors.push('Workspace ID is required');
  if (!workspace.title) errors.push('Workspace title is required');
  if (!workspace.layout) errors.push('Workspace layout is required');
  if (!workspace.gadgets || workspace.gadgets.length === 0) {
    warnings.push('Workspace has no gadgets');
  }
  
  // Validate gadgets
  workspace.gadgets?.forEach((gadget, index) => {
    if (!gadget.id) errors.push(`Gadget at index ${index} missing ID`);
    if (!gadget.type) errors.push(`Gadget at index ${index} missing type`);
    if (!gadget.title) errors.push(`Gadget at index ${index} missing title`);
    
    // Validate position
    if (typeof gadget.position !== 'number') {
      errors.push(`Gadget ${gadget.id} position must be a number`);
    } else if (gadget.position < 1 || gadget.position > 12) {
      errors.push(`Gadget ${gadget.id} position must be between 1 and 12`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// Export type alias for backward compatibility
export type { GridPosition as GadgetPosition }; 