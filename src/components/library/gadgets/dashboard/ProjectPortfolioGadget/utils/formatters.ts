/**
 * Value Formatters
 * Generic formatting utilities for different data types
 */

/**
 * Formats a date value based on user's locale
 * @param value - Date string, Date object, or timestamp
 * @param locale - Optional locale (defaults to browser locale)
 * @returns Formatted date string or original value if not a date
 */
export const formatDate = (
  value: any,
  locale?: string
): string => {
  if (!value) return value;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(locale || navigator.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return String(value);
  }
};

/**
 * Checks if a field name suggests it's a date field
 * @param fieldName - The field name or path
 * @returns true if the field appears to be a date
 */
export const isDateField = (fieldName: string): boolean => {
  const datePat = /(date|time|timestamp|created|updated|requested|required)/i;
  return datePat.test(fieldName);
};

