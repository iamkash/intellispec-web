import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflicting classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format HSL color string from individual values
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 * @returns Formatted HSL string
 */
export function formatHSL(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`
}

/**
 * Generate CSS custom properties for theme variables
 * @param theme Theme configuration object
 * @returns CSS custom properties object
 */
export function generateThemeVariables(theme: Record<string, any>): Record<string, string> {
  const variables: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(theme)) {
    if (typeof value === 'string') {
      variables[`--${key}`] = value
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects (like color palettes)
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (typeof nestedValue === 'string') {
          variables[`--${key}-${nestedKey}`] = nestedValue
        }
      }
    }
  }
  
  return variables
}
