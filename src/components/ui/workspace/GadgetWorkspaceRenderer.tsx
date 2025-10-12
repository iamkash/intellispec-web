/**
 * GadgetWorkspaceRenderer
 *
 * Renders workspace content using only the GadgetRegistry.
 */

import React from 'react';
import { useDevWorkspaceValidation } from '../../../hooks/useWorkspaceValidation';
import { WorkspaceDefinition } from '../../../schemas/workspace';
import { GadgetRegistry } from '../../library/core/GadgetRegistry';
import { WidgetRegistry } from '../../library/core/WidgetRegistry';
import { ValidationAlert } from '../validation/ValidationBadge';
import './GadgetWorkspaceGrid.css';
// Note: Using default theme values instead of useTheme to avoid context dependency
import { useAuth } from '../../../contexts/AuthContext';
import { WorkspaceFilterProvider } from '../../../contexts/WorkspaceFilterContext';
import { GridLayoutRenderer, createGridItemsFromGadgets } from '../GridLayoutRenderer';
import BaseGadgetContainer from './BaseGadgetContainer';
import './GadgetWorkspaceGrid.css';
interface GadgetWorkspaceRendererProps {
  workspace: WorkspaceDefinition;
  onAction?: (action: string, payload?: any) => void;
  className?: string;
}

export const GadgetWorkspaceRenderer: React.FC<GadgetWorkspaceRendererProps> = ({
  workspace,
  onAction,
  className = '',
}) => {
// Get authentication context for tenant information
  const { user } = useAuth();
  
  // Use default theme - gadgets will use CSS variables for styling
  const resolvedTheme = 'light'; // Default fallback, CSS variables handle actual theming
  // Handle both workspace.gadgets and workspace.layout.gadgets structures
  const gadgets = workspace.gadgets || ((workspace.layout as any)?.gadgets) || [];
// Extract filter context configuration
  const filterContext = (workspace as any).filterContext;
  const hasFilters = filterContext?.enabled && filterContext?.filterDefinitions?.length > 0;

  // Schema validation for development
  const validation = useDevWorkspaceValidation(workspace);

  /**
   * Render a single gadget - the ONLY place where gadget rendering logic exists
   */
  const renderGadget = (gadget: any) => {
const GadgetClass = GadgetRegistry.get(gadget.type);
// Error case: gadget type not found
    if (!GadgetClass) {
      console.error(`❌ [GadgetWorkspaceRenderer] Gadget type "${gadget.type}" not found in registry`);
      return (
        <BaseGadgetContainer
          title="Gadget Not Found"
          subtitle={`Type: ${gadget.type}`}
          status="error"
          error={`Gadget type "${gadget.type}" not found in registry`}
        >
          <></>
        </BaseGadgetContainer>
      );
    }

    // Merge smartDefaults with gadget config
    const smartDefaults = (workspace as any).smartDefaults?.[gadget.id];
    const mergedConfig = smartDefaults ? { ...gadget.config, ...smartDefaults } : gadget.config;

    // Create gadget instance
let gadgetInstance;
    let gadgetResult;

    try {
      gadgetInstance = new GadgetClass(mergedConfig, WidgetRegistry, {
        theme: resolvedTheme,
        onAction,
      workspace,
      widgetRegistry: WidgetRegistry,
    });
// Create gadget context with user information
      const gadgetContext = {
        theme: resolvedTheme,
        onAction,
        workspace,
        widgetRegistry: WidgetRegistry,
        gadgetId: gadget.id,
        widgets: {},
        // Add user information from auth context
        user: user
      };

      // Render gadget using the container-enforced pattern
gadgetResult = gadgetInstance.renderStructured(
        {
          ...mergedConfig,
          // Inject navigation callback so gadgets can ask the app to change workspace
          onNavigate: (action: string, payload?: any) => onAction?.(action, payload)
        },
        gadgetContext
      );
} catch (error) {
      console.error('❌ [GadgetWorkspaceRenderer] Error creating/rendering gadget', gadget.type + ':', error);
      return (
        <BaseGadgetContainer
          title="Gadget Error"
          subtitle={`Type: ${gadget.type}`}
          status="error"
          error={`Failed to create gadget: ${error instanceof Error ? error.message : 'Unknown error'}`}
        >
          <></>
        </BaseGadgetContainer>
      );
    }

    if (!gadgetInstance || !gadgetResult) {
      console.error('❌ [GadgetWorkspaceRenderer] Gadget instance or result is null after creation');
      return (
        <BaseGadgetContainer
          title="Gadget Error"
          subtitle={`Type: ${gadget.type}`}
          status="error"
          error="Failed to create gadget instance or render result"
        >
          <></>
        </BaseGadgetContainer>
      );
    }

    const { body, containerProps } = gadgetResult;

    // Extract container props and merge with defaults
    const defaultTitle = gadget.title || gadgetInstance.metadata?.name || 'Gadget';
    const defaultSubtitle = gadgetInstance.metadata?.description;

    // Respect gadget's preference to hide wrapper elements
    const shouldHideHeader = !containerProps.header;
    const shouldHideFooter = !containerProps.footer;

    const finalContainerProps = {
      title: shouldHideHeader ? undefined : (containerProps.header?.title || defaultTitle),
      subtitle: shouldHideHeader ? undefined : (containerProps.header?.subtitle || defaultSubtitle),
      headerActions: shouldHideHeader ? undefined : containerProps.header?.actions,
      footer: shouldHideFooter ? undefined : containerProps.footer?.content,
      lastUpdated: shouldHideFooter ? undefined : containerProps.footer?.timestamp,
      refreshable: containerProps.refreshable || false,
      configurable: containerProps.configurable !== false,
      expandable: containerProps.expandable !== false,
      loading: containerProps.loading || false,
      error: containerProps.error,
      status: containerProps.header?.status || 'normal',
      size: containerProps.size || 'medium',
      noPadding: containerProps.noPadding || false
    };

    // Action handlers
    const handleRefresh = () => {
onAction?.('refresh', { gadgetId: gadget.id });
    };

    const handleConfigure = () => {
onAction?.('configure', { gadgetId: gadget.id });
    };

    const handleExpand = () => {
onAction?.('expand', { gadgetId: gadget.id });
    };

    return (
      <BaseGadgetContainer
        title={finalContainerProps.title}
        subtitle={finalContainerProps.subtitle}
        headerActions={finalContainerProps.headerActions}
        footer={finalContainerProps.footer}
        lastUpdated={finalContainerProps.lastUpdated}
        refreshable={finalContainerProps.refreshable}
        configurable={finalContainerProps.configurable}
        expandable={finalContainerProps.expandable}
        loading={finalContainerProps.loading}
        error={finalContainerProps.error}
        status={finalContainerProps.status}
        size={finalContainerProps.size}
        noPadding={finalContainerProps.noPadding}
        onRefresh={finalContainerProps.refreshable ? handleRefresh : undefined}
        onConfigure={finalContainerProps.configurable ? handleConfigure : undefined}
        onExpand={finalContainerProps.expandable ? handleExpand : undefined}
      >
        {body}
      </BaseGadgetContainer>
    );
  };

  // Convert gadgets to grid items and render using the unified grid system
  const gridItems = createGridItemsFromGadgets(gadgets, renderGadget);

  const renderWorkspaceContent = () => (
    <div style={{ 
      padding: '8px 6px 6px',
      background: 'hsl(var(--background))',
      borderRadius: '0'
    }}>
      {/* Schema Validation (Development Only) */}
      <ValidationAlert validation={validation} />
      
      <GridLayoutRenderer
        items={gridItems}
        className={`gadget-workspace-grid ${className}`}
        gap="16px"
        minRowHeight={140}
      />
    </div>
  );

  // Wrap with filter provider if workspace has filter context
  if (hasFilters) {
    return React.createElement(
      WorkspaceFilterProvider,
      {
        filterDefinitions: filterContext.filterDefinitions,
        onFiltersChange: (filters) => {
// Optionally notify parent component
          onAction?.('filtersChanged', { filters });
        },
        children: renderWorkspaceContent()
      }
    );
  }

  return renderWorkspaceContent();
}; 