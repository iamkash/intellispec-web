/**
 * Constants for Timeline Gadget
 * Centralized default values and labels
 */

export const DEFAULT_LABELS = {
  emptyState: "No timeline items available",
  loadingMessage: "Loading timeline...",
  errorMessage: "Unable to load timeline",
  noDateLabel: "Date not set",
  noDurationLabel: "—",
  daysLabel: "days",
  dependsOnLabel: "Depends on",
};

export const DEFAULT_STATUS_COLORS = {
  "Not Started": "gray",
  "In Progress": "blue",
  Complete: "green",
  Delayed: "red",
  Cancelled: "gray",
};

export const DEFAULT_CONFIG = {
  showDates: true,
  showDuration: true,
  showDependencies: true,
  showStatus: true,
};

