/**
 * Type definitions for Project Portfolio Gadget
 * All interfaces are metadata-driven - no hardcoded business logic
 */

import { GadgetConfig } from "../../base";

export interface HeaderConfig {
  title?: string;
  subtitle?: string;
  icon?: string;
  showCount?: boolean;
}

export type ViewMode = "grid" | "list" | "table" | "kanban";

export interface ViewModesConfig {
  enabled?: ViewMode[];
  default?: ViewMode;
  enableToggle?: boolean;
  kanbanConfig?: {
    statusField?: string; // Field to use for swim lanes (e.g., "summary.project_status")
    columnOrder?: string[]; // Optional: order of columns (status values)
  };
}

export interface FeaturesConfig {
  enableFavorites?: boolean;
  enableRecents?: boolean;
  maxRecents?: number;
  favoriteIcon?: string;
  persistKey?: string;
}

export interface NavigationParamConfig {
  name: string;
  path: string;
}

export interface NavigationConfig {
  workspace?: string;
  workspaceField?: string;
  paramName?: string;
  idPath?: string;
  additionalParams?: NavigationParamConfig[];
  openInNewTab?: boolean;
}

export interface ToolbarConfig {
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableGroupBy?: boolean;
  groupByPlaceholder?: string;
  enableSort?: boolean;
  sortPlaceholder?: string;
  enableFavoritesFilter?: boolean;
}

export interface ListItemConfig {
  label: string;
  path: string;
  icon?: string;
}

export interface CardDisplayConfig {
  title?: string;
  titleIcon?: string;
  subtitle?: string;
  tags?: string[];
  list?: ListItemConfig[];
  [key: string]: any;
}

export interface LabelsConfig {
  portfolio?: string;
  searchPlaceholder?: string;
  sortPlaceholder?: string;
  groupPlaceholder?: string;
  favoritesLabel?: string;
  nonFavoritesLabel?: string;
  recentlyViewedLabel?: string;
  notRecentlyViewedLabel?: string;
  favoritesFilterLabel?: string;
  errorMessage?: string;
  allItems?: string;
  unspecified?: string;
  missingValue?: string;
  titleLabel?: string;
  codeLabel?: string;
  noItemsFound?: string;
}

export interface ProjectPortfolioGadgetConfig extends GadgetConfig {
  workspaceId?: string;
  header?: HeaderConfig;
  toolbar?: ToolbarConfig;
  cardDisplay?: CardDisplayConfig;
  viewModes?: ViewModesConfig;
  features?: FeaturesConfig;
  labels?: LabelsConfig;
  navigation?: NavigationConfig;
  dataUrl?: string;
  dataPath?: string;
  virtualizeThreshold?: number; // Enable virtualization when item count exceeds this
}

export interface MenuItem {
  key: string;
  label?: string;
  icon?: string;
  workspace?: string;
  params?: Record<string, any>;
  fields: Record<string, any>;
  raw: any;
}
