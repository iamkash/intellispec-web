/**
 * Formatting utilities for Timeline Gadget
 * Pure functions - no side effects
 */

/**
 * Format date for timeline display
 */
export const formatDate = (dateValue: any): string | null => {
  if (!dateValue) return null;

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
};

/**
 * Format duration with label
 */
export const formatDuration = (
  duration: any,
  label: string = "days"
): string | null => {
  if (duration === null || duration === undefined) return null;

  const num = typeof duration === "number" ? duration : parseInt(String(duration));
  if (isNaN(num)) return null;

  return `${num} ${label}`;
};

/**
 * Get status color from status value
 */
export const getStatusColor = (
  status: string,
  colorMap: Record<string, string>
): string => {
  return colorMap[status] || "gray";
};

