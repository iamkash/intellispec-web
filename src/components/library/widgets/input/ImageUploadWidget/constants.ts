/**
 * Constants for ImageUploadWidget
 */

export const DEFAULT_MAX_COUNT = 10;
export const DEFAULT_MAX_SIZE = 10; // MB
export const DEFAULT_ACCEPT = 'image/*';
export const DEFAULT_THUMBNAIL_SIZE = 150; // px (legacy - now uses CSS aspect-ratio)

export const DEFAULT_DRAWING_TOOLS = ['pen', 'line', 'circle', 'rectangle', 'text', 'arrow'] as const;

export const DEFAULT_DRAWING_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
];

export const DEFAULT_STROKE_WIDTHS = [2, 4, 6, 8, 10];

