/**
 * =============================================================================
 * GADGET SCHEMA DEFINITIONS
 * =============================================================================
 * 
 * Defines the structure and validation for gadgets in the workspace system.
 * Gadgets are the main building blocks of dashboards and workspaces.
 */

import { GridPosition } from '../../components/ui/GridLayoutRenderer';

/**
 * Base gadget configuration interface
 */
export interface BaseGadgetConfig {
  // Widget configuration
  widgets?: string[];
  
  // Display settings
  title?: string;
  description?: string;
  
  // Behavior settings
  autoRefresh?: boolean;
  refreshInterval?: number;
  
  // Additional config properties can be added by specific gadget types
  [key: string]: any;
}

/**
 * Gadget definition interface
 */
export interface GadgetDefinition {
  id: string;
  type: string;
  title: string;
  position: GridPosition; // Simple number (1-12) for grid width
  config: BaseGadgetConfig;
  
  // Optional properties
  description?: string;
  tags?: string[];
  
  // Validation and metadata
  createdAt?: string;
  updatedAt?: string;
  version?: string;
}

/**
 * Gadget validation result
 */
export interface GadgetValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Simple gadget position validation
 */
export const validateGadgetPosition = (position: GridPosition): GadgetValidationResult => {
  const errors: string[] = [];
  
  if (typeof position !== 'number') {
    errors.push('Position must be a number');
  } else if (position < 1 || position > 12) {
    errors.push('Position must be between 1 and 12');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
};

/**
 * Gadget definition validation
 */
export const validateGadgetDefinition = (gadget: GadgetDefinition): GadgetValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (!gadget.id) errors.push('Gadget ID is required');
  if (!gadget.type) errors.push('Gadget type is required');
  if (!gadget.title) errors.push('Gadget title is required');
  
  // Position validation
  const positionValidation = validateGadgetPosition(gadget.position);
  errors.push(...positionValidation.errors);
  
  // Config validation
  if (!gadget.config) {
    errors.push('Gadget config is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export type { GridPosition as GadgetPosition }; 