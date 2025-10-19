/**
 * Recent Items Hook
 * Tracks recently viewed items with localStorage persistence
 */

import { useCallback, useEffect, useState } from "react";

export const useRecents = (
  storageKey: string = "portfolio-recents",
  maxRecents: number = 10
) => {
  const [recents, setRecents] = useState<string[]>([]);

  // Load recents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setRecents(JSON.parse(stored));
      }
    } catch (error) {
      // Silently fail - start with empty recents
      setRecents([]);
    }
  }, [storageKey]);

  // Add item to recents
  const addRecent = useCallback(
    (itemKey: string) => {
      setRecents((prev) => {
        // Remove if already exists, add to front, limit to maxRecents
        const updated = [
          itemKey,
          ...prev.filter((key) => key !== itemKey),
        ].slice(0, maxRecents);

        // Persist to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // Silently fail if localStorage unavailable
        }

        return updated;
      });
    },
    [storageKey, maxRecents]
  );

  // Check if item is recent
  const isRecent = useCallback(
    (itemKey: string) => recents.includes(itemKey),
    [recents]
  );

  // Clear all recents
  const clearRecents = useCallback(() => {
    setRecents([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Silently fail
    }
  }, [storageKey]);

  return {
    recents,
    addRecent,
    isRecent,
    clearRecents,
    recentCount: recents.length,
  };
};

