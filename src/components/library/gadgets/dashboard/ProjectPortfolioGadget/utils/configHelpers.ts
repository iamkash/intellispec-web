/**
 * Configuration Helper Utilities
 * Smart utilities that derive configuration from metadata
 */

import { DEFAULT_LABELS } from "../constants";
import { CardDisplayConfig, ListItemConfig } from "../types";

/**
 * Auto-generates searchable fields from cardDisplay configuration
 * Includes: title, subtitle, tags, and all list item paths
 * @param cardDisplay - Card display configuration from metadata
 * @returns Array of field paths to search
 */
export const getSearchableFields = (
  cardDisplay?: CardDisplayConfig
): string[] => {
  if (!cardDisplay) return [];

  const fields: string[] = [];

  // Add title field
  if (cardDisplay.title) {
    fields.push(cardDisplay.title);
  }

  // Add subtitle field
  if (cardDisplay.subtitle) {
    fields.push(cardDisplay.subtitle);
  }

  // Add all tag fields
  if (cardDisplay.tags) {
    fields.push(...cardDisplay.tags);
  }

  // Add all list item fields
  if (cardDisplay.list) {
    cardDisplay.list.forEach((listItem) => {
      fields.push(listItem.path);
    });
  }

  return fields;
};

/**
 * Auto-generates sortable options from cardDisplay configuration
 * Includes: title, subtitle, and all list items
 * @param cardDisplay - Card display configuration from metadata
 * @returns Array of { label, path } objects for sort options
 */
export const getSortableOptions = (
  cardDisplay?: CardDisplayConfig
): Array<{ label: string; path: string }> => {
  if (!cardDisplay) return [];

  const options: Array<{ label: string; path: string }> = [];

  // Add title
  if (cardDisplay.title) {
    options.push({ label: DEFAULT_LABELS.TITLE_LABEL, path: cardDisplay.title });
  }

  // Add subtitle
  if (cardDisplay.subtitle) {
    options.push({ label: DEFAULT_LABELS.CODE_LABEL, path: cardDisplay.subtitle });
  }

  // Add all list items (they already have labels)
  if (cardDisplay.list) {
    cardDisplay.list.forEach((listItem: ListItemConfig) => {
      options.push({ label: listItem.label, path: listItem.path });
    });
  }

  return options;
};

