/**
 * Constants
 * Centralized configuration values
 */

import { LabelsConfig } from "./types";

export const DEBOUNCE_DELAY = 300; // milliseconds

export const GRID_MIN_COLUMN_WIDTH = 200; // pixels

export const GRID_GAP = 10; // pixels

export const DEFAULT_LABELS = {
  PORTFOLIO: "Portfolio",
  SEARCH_PLACEHOLDER: "Search...",
  SORT_PLACEHOLDER: "Sort by...",
  GROUP_PLACEHOLDER: "Group by...",
  FAVORITES: "Favorites",
  NON_FAVORITES: "Not Favorited",
  RECENTLY_VIEWED: "Recently Viewed",
  NOT_RECENTLY_VIEWED: "Not Recently Viewed",
  FAVORITES_FILTER: "Favorites",
  ERROR_MESSAGE: "Error",
  ALL_ITEMS: "All Items",
  UNSPECIFIED: "Unspecified",
  MISSING_VALUE: "-",
  TITLE_LABEL: "Title",
  CODE_LABEL: "Code",
  NO_ITEMS_FOUND: "No items match your search or filters",
} as const;

export const TOOLBAR_WIDTHS = {
  SEARCH_INPUT_MAX: 300,
  SELECT_MIN: 140,
  SELECT_GROUP_MIN: 140,
} as const;

/**
 * Merges custom labels with defaults for i18n support
 * @param customLabels - Custom labels from metadata
 * @returns Merged labels object
 */
export const getLabels = (customLabels?: LabelsConfig) => ({
  portfolio: customLabels?.portfolio || DEFAULT_LABELS.PORTFOLIO,
  searchPlaceholder:
    customLabels?.searchPlaceholder || DEFAULT_LABELS.SEARCH_PLACEHOLDER,
  sortPlaceholder:
    customLabels?.sortPlaceholder || DEFAULT_LABELS.SORT_PLACEHOLDER,
  groupPlaceholder:
    customLabels?.groupPlaceholder || DEFAULT_LABELS.GROUP_PLACEHOLDER,
  favoritesLabel: customLabels?.favoritesLabel || DEFAULT_LABELS.FAVORITES,
  nonFavoritesLabel:
    customLabels?.nonFavoritesLabel || DEFAULT_LABELS.NON_FAVORITES,
  recentlyViewedLabel:
    customLabels?.recentlyViewedLabel || DEFAULT_LABELS.RECENTLY_VIEWED,
  notRecentlyViewedLabel:
    customLabels?.notRecentlyViewedLabel || DEFAULT_LABELS.NOT_RECENTLY_VIEWED,
  favoritesFilterLabel:
    customLabels?.favoritesFilterLabel || DEFAULT_LABELS.FAVORITES_FILTER,
  errorMessage: customLabels?.errorMessage || DEFAULT_LABELS.ERROR_MESSAGE,
  allItems: customLabels?.allItems || DEFAULT_LABELS.ALL_ITEMS,
  unspecified: customLabels?.unspecified || DEFAULT_LABELS.UNSPECIFIED,
  missingValue: customLabels?.missingValue || DEFAULT_LABELS.MISSING_VALUE,
  titleLabel: customLabels?.titleLabel || DEFAULT_LABELS.TITLE_LABEL,
  codeLabel: customLabels?.codeLabel || DEFAULT_LABELS.CODE_LABEL,
  noItemsFound: customLabels?.noItemsFound || DEFAULT_LABELS.NO_ITEMS_FOUND,
});
