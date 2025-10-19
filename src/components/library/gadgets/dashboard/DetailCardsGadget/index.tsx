/**
 * Detail Cards Gadget
 * 
 * A simple, read-only card gadget for displaying structured information.
 * Follows the same architectural pattern as ProjectPortfolioGadget:
 * - index.tsx: Gadget class (metadata, schema, validation)
 * - DetailCardsComponent.tsx: Container/orchestrator (data fetching, state)
 * - components/: Presentational components (DetailCard, states)
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
import { DetailCardsComponent } from "./DetailCardsComponent";
import { DetailCardsGadgetConfig } from "./types";

/**
 * DetailCardsGadget - Metadata-driven card display gadget
 * 
 * Architecture:
 * - Extends BaseGadget for framework integration
 * - Delegates rendering to DetailCardsComponent
 * - Handles its own data fetching (skips BaseGadget DataFetcher wrapper)
 * - Validates configuration against schema
 */
export class DetailCardsGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: "detail-cards-gadget",
    name: "Detail Cards",
    description:
      "Simple read-only card gadget for displaying structured information",
    category: "dashboard",
    tags: ["cards", "detail", "readonly", "display"],
    version: "1.0.0",
    author: "IntelliSPEC",
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: "object",
    required: ["dataUrl", "cards"],
    properties: {
      dataUrl: {
        type: "string",
        description: "API endpoint to fetch data (supports {id} placeholders)",
      },
      dataPath: {
        type: "string",
        description: "Dot-notation path to extract data from response",
      },
      cards: {
        type: "array",
        description: "Array of card configurations",
        items: {
          type: "object",
          required: ["id", "title", "fields"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            icon: { type: "string" },
            iconColor: { type: "string" },
            fields: {
              type: "array",
              items: {
                type: "object",
                required: ["label", "path"],
                properties: {
                  label: { type: "string" },
                  path: { type: "string" },
                  icon: { type: "string" },
                  format: {
                    type: "string",
                    enum: ["text", "date", "number", "tag"],
                  },
                  fallback: { type: "string" },
                },
              },
            },
          },
        },
      },
      cardsPerRow: {
        type: "number",
        description: "Number of cards per row",
        default: 4,
      },
      cardMinWidth: {
        type: "string",
        description: "Minimum width for each card",
        default: "240px",
      },
      spacing: {
        type: "number",
        description: "Gap between cards in pixels",
        default: 12,
      },
      labels: { type: "object" },
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
   * DetailCardsComponent handles its own data fetching with placeholder resolution.
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
      <DetailCardsComponent
        config={componentProps as DetailCardsGadgetConfig}
        context={context}
      />
    );
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    const detailConfig = config as DetailCardsGadgetConfig;

    if (!detailConfig.dataUrl) {
      errors.push("dataUrl is required");
    }

    if (
      !detailConfig.cards ||
      !Array.isArray(detailConfig.cards) ||
      detailConfig.cards.length === 0
    ) {
      errors.push("At least one card is required");
    } else {
      detailConfig.cards.forEach((card, index) => {
        if (!card.id) {
          errors.push(`Card at index ${index} missing required id`);
        }
        if (!card.title) {
          errors.push(`Card at index ${index} missing required title`);
        }
        if (
          !card.fields ||
          !Array.isArray(card.fields) ||
          card.fields.length === 0
        ) {
          errors.push(
            `Card "${card.id || index}" must have at least one field`
          );
        }
      });
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

export default DetailCardsGadget;

