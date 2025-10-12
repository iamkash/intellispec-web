/**
 * GadgetRegistry
 *
 * A registry for class-based gadget orchestrators.
 * Allows dynamic registration and retrieval of gadgets by type string.
 *
 * Usage:
 *   GadgetRegistry.register('stats', StatsGadget);
 *   const GadgetClass = GadgetRegistry.get('stats');
 *
 * Extension:
 *   - Supports dynamic/lazy loading of gadgets (see registerAsync).
 *   - Can be extended for i18n, theming, or custom gadget resolution.
 */
import React from 'react';

export type GadgetType = string;
export interface GadgetClass {
  new (config: any, widgetRegistry: any, context?: any): any;
}

interface GadgetRegistryEntry {
  classRef: GadgetClass;
  asyncLoader?: () => Promise<{ default: GadgetClass }>;
}

export class GadgetRegistry {
  private static registry: Map<GadgetType, GadgetRegistryEntry> = new Map();

  /**
   * Register a gadget class synchronously.
   */
  static register(type: GadgetType, classRef: GadgetClass) {
    GadgetRegistry.registry.set(type, { classRef });
  }

  /**
   * Register a gadget class asynchronously (for code splitting/lazy loading).
   */
  static registerAsync(type: GadgetType, loader: () => Promise<{ default: GadgetClass }>) {
    GadgetRegistry.registry.set(type, { classRef: React.lazy(loader) as any, asyncLoader: loader });
  }

  /**
   * Retrieve a gadget class by type. Returns undefined if not found.
   */
  static get(type: GadgetType): GadgetClass | undefined {
    const entry = GadgetRegistry.registry.get(type);
    return entry?.classRef;
  }

  /**
   * Check if a gadget type is registered.
   */
  static has(type: GadgetType): boolean {
    return GadgetRegistry.registry.has(type);
  }

  /**
   * List all registered gadget types.
   */
  static list(): GadgetType[] {
    return Array.from(GadgetRegistry.registry.keys());
  }

  /**
   * Clear all registered gadgets (for testing or hot reload).
   */
  static clear() {
    GadgetRegistry.registry.clear();
  }
}

/**
 * Guidance: To extend, subclass GadgetRegistry or wrap it in a context/provider for multi-tenant or scoped registries.
 * For i18n, theme, or config-aware gadgets, use a higher-order class or context in your gadget implementation.
 */ 