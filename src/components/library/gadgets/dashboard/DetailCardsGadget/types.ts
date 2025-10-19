/**
 * Type definitions for Detail Cards Gadget
 * All interfaces are metadata-driven - no hardcoded business logic
 */

import { GadgetConfig } from "../../base";

export interface CardFieldConfig {
  label: string;
  path: string;
  icon?: string;
  format?: "text" | "date" | "number" | "tag";
  fallback?: string;
}

export interface CardConfig {
  id: string;
  title: string;
  icon?: string;
  iconColor?: string;
  fields: CardFieldConfig[];
}

export interface LabelsConfig {
  emptyState?: string;
  loadingMessage?: string;
  errorMessage?: string;
  missingValue?: string;
}

export interface DetailCardsGadgetConfig extends GadgetConfig {
  dataUrl: string;
  dataPath?: string;
  cards: CardConfig[];
  cardsPerRow?: number;
  cardMinWidth?: string;
  spacing?: number;
  labels?: LabelsConfig;
}

