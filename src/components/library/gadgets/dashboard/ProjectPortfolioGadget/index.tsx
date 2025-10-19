/**
 * Project Portfolio Gadget
 *
 * A 100% metadata-driven gadget for displaying portfolios.
 * All configuration comes from workspace metadata - zero hardcoded business logic.
 */

import React from "react";
import {
  BaseGadget,
  GadgetConfig,
  GadgetContext,
  GadgetMetadata,
  GadgetSchema,
  GadgetType,
} from "../../base";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PortfolioComponent } from "./PortfolioComponent";
import { ProjectPortfolioGadgetConfig } from "./types";
import { isValidIcon } from "./utils/iconHelpers";

export class ProjectPortfolioGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: "project-portfolio-gadget",
    name: "Project Portfolio Gadget",
    description: "Metadata-driven portfolio gadget",
    category: "dashboard",
    tags: ["portfolio", "metadata-driven"],
    version: "2.0.0",
    author: "System",
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
    dataFlow: {
      inputs: ["portfolio-data"],
      outputs: ["workspace-navigation"],
      transformations: ["metadata-mapping"],
    },
  };

  schema: GadgetSchema = {
    type: "object",
    properties: {
      dataUrl: {
        type: "string",
        format: "uri",
        description: "API endpoint URL to fetch portfolio data",
      },
      dataPath: {
        type: "string",
        description: "Path to extract data from response (e.g., 'data.items')",
      },
      header: {
        type: "object",
        properties: {
          title: { type: "string", description: "Header title" },
          subtitle: { type: "string", description: "Header subtitle" },
          icon: {
            type: "string",
            description: "Ant Design icon name",
          },
          showCount: {
            type: "boolean",
            default: true,
            description: "Show item count in subtitle",
          },
        },
      },
      toolbar: {
        type: "object",
        properties: {
          enableSearch: {
            type: "boolean",
            default: true,
            description:
              "Show/hide search input (searches all cardDisplay fields automatically)",
          },
          searchPlaceholder: {
            type: "string",
            default: "Search...",
            description: "Search input placeholder text",
          },
          enableGroupBy: {
            type: "boolean",
            default: true,
            description:
              "Show/hide group by dropdown (groups by list item fields)",
          },
          groupByPlaceholder: {
            type: "string",
            default: "Group by...",
            description: "Group by dropdown placeholder text",
          },
          enableSort: {
            type: "boolean",
            default: true,
            description: "Show/hide sort dropdown (sorts by all card fields)",
          },
          sortPlaceholder: {
            type: "string",
            default: "Sort by...",
            description: "Sort dropdown placeholder text",
          },
        },
      },
      cardDisplay: {
        type: "object",
        description: "Card field display configuration",
        properties: {
          title: {
            type: "string",
            description: "Path to title field (e.g., 'summary.project_name')",
          },
          titleIcon: {
            type: "string",
            description: "Path to icon field or static icon name",
          },
          subtitle: {
            type: "string",
            description:
              "Path to subtitle field (e.g., 'summary.project_code')",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description:
              "Array of paths to display as tags (e.g., ['summary.project_type', 'summary.status'])",
          },
          list: {
            type: "array",
            description: "Array of fields to display as list items with icons",
          },
        },
      },
      labels: {
        type: "object",
        description: "Custom labels for i18n support (overrides defaults)",
        properties: {
          portfolio: { type: "string" },
          searchPlaceholder: { type: "string" },
          sortPlaceholder: { type: "string" },
          groupPlaceholder: { type: "string" },
          favoritesLabel: { type: "string" },
          nonFavoritesLabel: { type: "string" },
          recentlyViewedLabel: { type: "string" },
          notRecentlyViewedLabel: { type: "string" },
          favoritesFilterLabel: { type: "string" },
          errorMessage: { type: "string" },
          allItems: { type: "string" },
          unspecified: { type: "string" },
          missingValue: { type: "string" },
          titleLabel: { type: "string" },
          codeLabel: { type: "string" },
          noItemsFound: { type: "string" },
        },
      },
      navigation: {
        type: "object",
        description: "Navigation configuration for handling card clicks",
        properties: {
          workspace: {
            type: "string",
            description: "Target workspace to open on card click",
          },
          workspaceField: {
            type: "string",
            description:
              "Path to resolve workspace id from record (overrides static workspace)",
          },
          paramName: {
            type: "string",
            description: "Parameter name used when passing record id",
            default: "id",
          },
          idPath: {
            type: "string",
            description:
              "Path to resolve record id value (defaults to item key if not provided)",
          },
          additionalParams: {
            type: "array",
            description: "Additional parameters to send during navigation",
            items: {
              type: "object",
              required: ["name", "path"],
              properties: {
                name: { type: "string" },
                path: { type: "string" },
              },
            },
          },
          openInNewTab: {
            type: "boolean",
            description:
              "Open the target workspace in a new browser tab/window when true",
            default: false,
          },
        },
      },
      features: {
        type: "object",
        description: "Optional features configuration",
        properties: {
          enableFavorites: {
            type: "boolean",
            default: true,
            description: "Enable favorite/star functionality",
          },
          enableRecents: {
            type: "boolean",
            default: true,
            description: "Track recently viewed items",
          },
          maxRecents: {
            type: "number",
            default: 10,
            description: "Maximum number of recent items to track",
          },
          favoriteIcon: {
            type: "string",
            default: "HeartOutlined",
            description: "Icon for favorite action",
          },
          persistKey: {
            type: "string",
            description: "localStorage key prefix for persistence",
          },
        },
      },
      viewModes: {
        type: "object",
        description: "View mode configuration",
        properties: {
          enabled: {
            type: "array",
            items: {
              type: "string",
              enum: ["grid", "list", "table", "kanban"],
            },
            default: ["grid", "list", "table", "kanban"],
            description: "Available view modes",
          },
          default: {
            type: "string",
            enum: ["grid", "list", "table", "kanban"],
            default: "grid",
            description: "Default view mode",
          },
          enableToggle: {
            type: "boolean",
            default: true,
            description: "Show view mode toggle buttons",
          },
          kanbanConfig: {
            type: "object",
            description: "Kanban view configuration",
            properties: {
              statusField: {
                type: "string",
                default: "summary.project_status",
                description:
                  "Field to use for swim lanes (e.g., 'summary.project_status')",
              },
              columnOrder: {
                type: "array",
                items: { type: "string" },
                description:
                  "Optional: Custom order for columns (status values)",
              },
            },
          },
        },
      },
      virtualizeThreshold: {
        type: "number",
        default: 100,
        description:
          "Number of items before virtualization kicks in (default: 100)",
      },
    },
    required: ["dataUrl"],
    widgetSchemas: {},
  };

  getContainerProps(props: any, context?: GadgetContext): any {
    return {
      ...super.getContainerProps(props, context),
      noPadding: true,
    };
  }

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(PortfolioComponent, {
        config: props.config || props,
        context,
      })
    );
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  validate(config: GadgetConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const portfolioConfig = config as ProjectPortfolioGadgetConfig;

    // Validate required fields
    if (!portfolioConfig.dataUrl) {
      errors.push("dataUrl is required");
    }

    // Validate dataUrl format
    if (portfolioConfig.dataUrl) {
      try {
        const origin =
          typeof window !== "undefined" && window.location
            ? window.location.origin
            : "http://localhost";
        new URL(portfolioConfig.dataUrl, origin);
      } catch {
        errors.push("dataUrl must be a valid URL");
      }
    }

    // Validate header icon if provided
    if (
      portfolioConfig.header?.icon &&
      !isValidIcon(portfolioConfig.header.icon)
    ) {
      errors.push(`Invalid icon name: ${portfolioConfig.header.icon}`);
    }

    // Validate cardDisplay structure
    if (portfolioConfig.cardDisplay) {
      const { cardDisplay } = portfolioConfig;

      // Validate titleIcon if provided
      if (cardDisplay.titleIcon) {
        const iconName =
          typeof cardDisplay.titleIcon === "string"
            ? cardDisplay.titleIcon
            : String(cardDisplay.titleIcon);
        // Check if it's a path or icon name - skip validation for paths
        if (!iconName.includes(".") && !isValidIcon(iconName)) {
          errors.push(`Invalid titleIcon: ${iconName}`);
        }
      }

      // Validate list items
      if (cardDisplay.list) {
        cardDisplay.list.forEach((listItem, index) => {
          if (!listItem.label) {
            errors.push(`list[${index}] missing required 'label' property`);
          }
          if (!listItem.path) {
            errors.push(`list[${index}] missing required 'path' property`);
          }
          if (listItem.icon && !isValidIcon(listItem.icon)) {
            errors.push(`list[${index}] has invalid icon: ${listItem.icon}`);
          }
        });
      }

      // Validate tags array
      if (cardDisplay.tags && !Array.isArray(cardDisplay.tags)) {
        errors.push("cardDisplay.tags must be an array");
      }
    }

    if (portfolioConfig.navigation) {
      const { navigation } = portfolioConfig;
      if (!navigation.workspace && !navigation.workspaceField) {
        errors.push(
          "navigation.workspace or navigation.workspaceField must be provided"
        );
      }
      navigation.additionalParams?.forEach((param, index) => {
        if (!param?.name) {
          errors.push(
            `navigation.additionalParams[${index}] missing required 'name' property`
          );
        }
        if (!param?.path) {
          errors.push(
            `navigation.additionalParams[${index}] missing required 'path' property`
          );
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: "grid",
      responsive: true,
    };
  }

  processDataFlow(data: any): any {
    return data;
  }
}

export default ProjectPortfolioGadget;
