/**
 * Favorites Hook
 * Manages favorite items with localStorage persistence
 */

import { useCallback, useEffect, useState } from "react";

export const useFavorites = (storageKey: string = "portfolio-favorites") => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      // Silently fail - start with empty favorites
      setFavorites([]);
    }
  }, [storageKey]);

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (itemKey: string) => {
      setFavorites((prev) => {
        const updated = prev.includes(itemKey)
          ? prev.filter((key) => key !== itemKey)
          : [...prev, itemKey];

        // Persist to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // Silently fail if localStorage unavailable
        }

        return updated;
      });
    },
    [storageKey]
  );

  // Check if item is favorited
  const isFavorite = useCallback(
    (itemKey: string) => favorites.includes(itemKey),
    [favorites]
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Silently fail
    }
  }, [storageKey]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoriteCount: favorites.length,
  };
};

