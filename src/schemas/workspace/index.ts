/**
 * =============================================================================
 * WORKSPACE SYSTEM EXPORTS
 * =============================================================================
 * 
 * Central export point for all workspace-related schemas and types.
 * Provides a clean API for workspace definitions and gadget configurations.
 */

// Core workspace types
export type {
  WorkspaceDefinition,
  WorkspaceGadget,
  WorkspaceLayout,
  WorkspaceSettings,
  WorkspaceMetadata,
  WorkspaceValidationResult
} from './workspace';

export { validateWorkspace } from './workspace';

// Gadget types
export type {
  GadgetDefinition,
  BaseGadgetConfig,
  GadgetValidationResult,
  GadgetPosition
} from './gadget';

export { validateGadgetDefinition, validateGadgetPosition } from './gadget';

// Simple position system
export type { GridPosition } from '../../components/ui/GridLayoutRenderer';

// Legacy exports for backward compatibility
export type { GridPosition as Position } from '../../components/ui/GridLayoutRenderer';
export type { GridPosition as FlexiblePosition } from '../../components/ui/GridLayoutRenderer';
export type { GridPosition as WidthOnlyPosition } from '../../components/ui/GridLayoutRenderer';
export type { GridPosition as BasePosition } from '../../components/ui/GridLayoutRenderer';
export type { GridPosition as ComponentPosition } from '../../components/ui/GridLayoutRenderer';
export type { GridPosition as WidgetPosition } from '../../components/ui/GridLayoutRenderer'; 