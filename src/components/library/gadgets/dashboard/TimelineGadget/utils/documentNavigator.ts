/**
 * Document Navigation Utilities
 * Centralized logic for navigating complex document structures
 */

/**
 * Navigate to a specific path within a document
 * Handles wizard document wrappers and nested structures
 */
export const navigateToPath = (
  document: any,
  pathString: string,
  options?: {
    dataPath?: string;
    skipDataWrapper?: boolean;
  }
): any => {
  if (!document || !pathString) {
    return null;
  }

  const { dataPath, skipDataWrapper = false } = options || {};

  // Start at the data root for wizard documents
  let current: any = skipDataWrapper ? document : (document.data || document);

  // Apply additional dataPath if provided
  if (dataPath && dataPath !== "data") {
    const dataSegments = dataPath.split(".");
    for (const segment of dataSegments) {
      if (segment !== "data") {
        current = current?.[segment];
        if (!current) return null;
      }
    }
  }

  // Navigate the main path
  const segments = pathString.split(".");
  for (const segment of segments) {
    current = current?.[segment];
    if (current === undefined || current === null) {
      return null;
    }
  }

  return current;
};

/**
 * Navigate to parent and get the final key
 * Useful for updating nested values
 */
export const navigateToParent = (
  document: any,
  pathString: string,
  options?: {
    dataPath?: string;
    skipDataWrapper?: boolean;
  }
): { parent: any; key: string } | null => {
  if (!document || !pathString) {
    return null;
  }

  const segments = pathString.split(".");
  if (segments.length === 0) {
    return null;
  }

  const parentPath = segments.slice(0, -1).join(".");
  const key = segments[segments.length - 1];

  const parent = parentPath
    ? navigateToPath(document, parentPath, options)
    : options?.skipDataWrapper
    ? document
    : (document.data || document);

  return parent ? { parent, key } : null;
};

/**
 * Extract data using dataPath configuration
 * Mirrors the component's data extraction logic
 */
export const extractDataWithPath = (
  payload: any,
  dataPath?: string
): any => {
  if (!dataPath) {
    return payload;
  }

  const segments = dataPath.split(".");
  return segments.reduce(
    (acc: any, segment: string) => acc?.[segment],
    payload
  );
};

