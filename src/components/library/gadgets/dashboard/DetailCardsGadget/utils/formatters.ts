/**
 * Value formatting utilities for Detail Cards
 * Pure functions - no side effects
 */

import { DEFAULT_LABELS } from "../constants";

/**
 * Format field values based on format type
 */
export const formatValue = (
  value: any,
  format?: string,
  fallback?: string
): string => {
  if (value === null || value === undefined || value === "") {
    return fallback || DEFAULT_LABELS.missingValue;
  }

  switch (format) {
    case "date":
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString();
      } catch {
        return String(value);
      }
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);
    case "tag":
      return String(value);
    case "text":
    default:
      return String(value);
  }
};

/**
 * Check if a field path suggests it's a date field
 */
export const isDateField = (path: string): boolean => {
  const lowerPath = path.toLowerCase();
  return (
    lowerPath.includes("date") ||
    lowerPath.includes("time") ||
    lowerPath.includes("created") ||
    lowerPath.includes("updated")
  );
};

