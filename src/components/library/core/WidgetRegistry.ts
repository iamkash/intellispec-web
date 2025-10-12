/**
 * WidgetRegistry
 *
 * A registry for stateless, presentational widget components.
 * Allows dynamic registration and retrieval of widgets by type string.
 *
 * Usage:
 *   WidgetRegistry.register('stats-grid', StatsGridWidget);
 *   const Widget = WidgetRegistry.get('stats-grid');
 *
 * Extension:
 *   - Supports dynamic/lazy loading of widgets (see registerAsync).
 *   - Can be extended for i18n, theming, or custom widget resolution.
 */
import React, { ComponentType } from 'react';

export type WidgetType = string;
export type WidgetComponent<P = any> = ComponentType<P>;

interface WidgetRegistryEntry {
  component: WidgetComponent;
  asyncLoader?: () => Promise<{ default: WidgetComponent }>;
}

export class WidgetRegistry {
  private static registry: Map<WidgetType, WidgetRegistryEntry> = new Map();

  /**
   * Register a widget component synchronously.
   */
  static register(type: WidgetType, component: WidgetComponent) {
    WidgetRegistry.registry.set(type, { component });
  }

  /**
   * Register a widget component asynchronously (for code splitting/lazy loading).
   */
  static registerAsync(type: WidgetType, loader: () => Promise<{ default: WidgetComponent }>) {
    WidgetRegistry.registry.set(type, { component: React.lazy(loader), asyncLoader: loader });
  }

  /**
   * Retrieve a widget component by type. Returns undefined if not found.
   */
  static get(type: WidgetType): WidgetComponent | undefined {
    const entry = WidgetRegistry.registry.get(type);
    return entry?.component;
  }

  /**
   * Check if a widget type is registered.
   */
  static has(type: WidgetType): boolean {
    return WidgetRegistry.registry.has(type);
  }

  /**
   * List all registered widget types.
   */
  static list(): WidgetType[] {
    return Array.from(WidgetRegistry.registry.keys());
  }

  /**
   * Clear all registered widgets (for testing or hot reload).
   */
  static clear() {
    WidgetRegistry.registry.clear();
  }
}

/**
 * Guidance: To extend, subclass WidgetRegistry or wrap it in a context/provider for multi-tenant or scoped registries.
 * For i18n, theme, or config-aware widgets, use a higher-order component or context in your widget implementation.
 */ 