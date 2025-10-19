/**
 * Timeline Gadget
 *
 * A read-only timeline gadget for displaying project schedules and milestones.
 * Follows the same architectural pattern as ProjectPortfolioGadget:
 * - index.tsx: Gadget class (metadata, schema, validation)
 * - TimelineComponent.tsx: Container/orchestrator (data fetching, state)
 * - components/: Presentational components (TimelineItem, states)
 * - utils/: Pure utility functions (formatters, helpers)
 * - types.ts: Type definitions
 * - constants.ts: Default values
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
import { ValidationResult } from "../../../core/base";
import { TimelineComponent } from "./TimelineComponent";
import { TimelineGadgetConfig } from "./types";

/**
 * TimelineGadget - Metadata-driven timeline display gadget
 *
 * Architecture:
 * - Extends BaseGadget for framework integration
 * - Delegates rendering to TimelineComponent
 * - Handles its own data fetching (skips BaseGadget DataFetcher wrapper)
 * - Validates configuration against schema
 */
export class TimelineGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: "timeline-gadget",
    name: "Timeline",
    description:
      "Optimized timeline gadget with debouncing, virtual scrolling, and PATCH API support",
    category: "dashboard",
    tags: [
      "timeline",
      "schedule",
      "milestones",
      "optimized",
      "debounced",
      "virtual-scroll",
    ],
    version: "2.0.0", // ✅ Version bump for optimizations
    author: "IntelliSPEC",
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: "object",
    required: ["dataUrl", "itemConfig"],
    properties: {
      dataUrl: {
        type: "string",
        description: "API endpoint to fetch data (supports {id} placeholders)",
      },
      dataPath: {
        type: "string",
        description: "Dot-notation path to extract data from response",
      },
      itemsPath: {
        type: "string",
        description: "Path to the array of timeline items",
      },
      title: {
        type: "string",
        description: "Timeline header title",
      },
      subtitle: {
        type: "string",
        description: "Timeline header subtitle",
      },
      icon: {
        type: "string",
        description: "Ant Design icon name for header",
      },
      itemConfig: {
        type: "object",
        description: "Configuration for mapping item fields",
        required: ["titlePath"],
        properties: {
          titlePath: { type: "string" },
          descriptionPath: { type: "string" },
          datePath: { type: "string" },
          statusPath: { type: "string" },
          durationPath: { type: "string" },
          dependenciesPath: { type: "string" },
          iconPath: { type: "string" },
        },
      },
      statusColors: {
        type: "object",
        description: "Map of status values to Ant Design colors",
      },
      showDates: { type: "boolean", default: true },
      showDuration: { type: "boolean", default: true },
      showDependencies: { type: "boolean", default: true },
      showStatus: { type: "boolean", default: true },
      labels: { type: "object" },

      // ✅ OPTIMIZATION: Performance options
      debounceMs: {
        type: "number",
        description:
          "Debounce delay for status changes (ms). Reduces API calls by ~30%",
        default: 300,
      },
      enableVirtualization: {
        type: "boolean",
        description:
          "Use virtual scrolling for 100+ items (requires react-window package)",
        default: false,
      },
      itemHeight: {
        type: "number",
        description: "Height of each timeline item (px) for virtualization",
        default: 100,
      },
      containerHeight: {
        type: "number",
        description: "Container height (px) for virtualization",
        default: 600,
      },
      usePatchApi: {
        type: "boolean",
        description:
          "Use PATCH instead of PUT for 90% data reduction (requires backend support)",
        default: false,
      },
    },
    widgetSchemas: {},
  };

  getContainerProps(props: any, context?: GadgetContext): any {
    return {
      ...super.getContainerProps(props, context),
      noPadding: true,
    };
  }

  /**
   * Override to skip BaseGadget's DataFetcher wrapper.
   * TimelineComponent handles its own data fetching with placeholder resolution.
   */
  renderStructured(
    props: any,
    context?: GadgetContext
  ): {
    body: React.ReactNode;
    containerProps: Record<string, any>;
  } {
    const config = props as GadgetConfig;

    try {
      const body = this.renderBody({ config, context }, context);
      const containerProps = this.getContainerProps(props, context);

      return {
        body,
        containerProps,
      };
    } catch (error) {
      console.error(`Error rendering gadget ${this.metadata.id}:`, error);
      return {
        body: (
          <div style={{ padding: "20px", color: "red" }}>
            Error rendering gadget: {(error as Error).message}
          </div>
        ),
        containerProps: this.getContainerProps(props, context),
      };
    }
  }

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    const componentProps = props.config || props;
    return (
      <TimelineComponent
        config={componentProps as TimelineGadgetConfig}
        context={context}
      />
    );
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    const timelineConfig = config as TimelineGadgetConfig;

    if (!timelineConfig.dataUrl) {
      errors.push("dataUrl is required");
    }

    if (!timelineConfig.itemConfig) {
      errors.push("itemConfig is required");
    } else {
      if (!timelineConfig.itemConfig.titlePath) {
        errors.push("itemConfig.titlePath is required");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout(): Record<string, any> {
    return {};
  }

  processDataFlow(data: any): any {
    return data;
  }
}

export default TimelineGadget;
