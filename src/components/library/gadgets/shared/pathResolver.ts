/**
 * Resolves a value from an object using a path string
 * Supports literal keys containing dots as well as nested traversal.
 * @param data - The data object to resolve against
 * @param path - Dot-notation path (e.g., "summary.project_name")
 * @returns The resolved value or undefined when not found
 */
export const resolvePath = (data: any, path: string): any => {
  if (!path || !data) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(data, path)) {
    return data[path];
  }

  const segments = path.split(".");
  let current: any = data;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
};
