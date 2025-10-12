/**
 * =============================================================================
 * WORKSPACE SCHEMA DEFINITIONS
 * =============================================================================
 * 
 * This file contains the schema definitions for workspaces and their components.
 * A workspace is a collection of gadgets arranged in a grid layout.
 */

import { GridPosition } from '../components/ui/GridLayoutRenderer';

/**
 * Widget definition for workspace
 */
export interface WorkspaceWidget {
  id: string;
  type: string;
  title: string;
  position: GridPosition;
  config: Record<string, any>;
  
  // Optional properties
  description?: string;
  tags?: string[];
}

/**
 * Gadget definition for workspace
 */
export interface WorkspaceGadget {
  id: string;
  type: string;
  title: string;
  position: GridPosition;
  config: Record<string, any>;
  
  // Optional properties
  description?: string;
  tags?: string[];
}

/**
 * Workspace metadata
 */
export interface WorkspaceMetadata {
  created: string;
  version: string;
  tags: string[];
  description: string;
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  theme: string;
  density: string;
  showLastUpdated: boolean;
  enableExport: boolean;
  enablePrint: boolean;
}

/**
 * Complete workspace definition
 */
export interface WorkspaceDefinition {
  id: string;
  title: string;
  description: string;
  layout: string;
  gadgets: WorkspaceGadget[];
  settings: WorkspaceSettings;
  metadata: WorkspaceMetadata;
  
  // Optional properties
  widgets?: WorkspaceWidget[];
  tags?: string[];
}

/**
 * Workspace context interface for React context
 */
export interface WorkspaceContext {
  currentWorkspace: WorkspaceDefinition | null;
  isLoading: boolean;
  error: string | null;
  loadWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  executeAction: (action: string, payload?: any) => Promise<void>;
}

// Export the simple position type for backward compatibility
export type { GridPosition };
export type { GridPosition as GadgetPosition };
export type { GridPosition as ComponentPosition }; 