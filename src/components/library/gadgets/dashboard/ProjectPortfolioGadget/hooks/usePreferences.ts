/**
 * Preferences Hook
 * Manages user preferences for the portfolio gadget
 * Scoped to: User + Workspace + Gadget
 */

import { useCallback, useEffect, useState } from "react";
import { SortOrder } from "./useSort";
import { ViewMode } from "../types";

export interface PortfolioPreferences {
  searchText?: string;
  sortByField?: string;
  sortOrder?: SortOrder;
  groupByField?: string;
  showFavoritesOnly?: boolean;
  viewMode?: ViewMode;
  timestamp?: number;
}

interface UsePreferencesOptions {
  workspaceId: string;
  gadgetId: string;
  userId?: string;
  autoLoad?: boolean;
}

export const usePreferences = ({
  workspaceId,
  gadgetId,
  userId = "default",
  autoLoad = true,
}: UsePreferencesOptions) => {
  const [savedPreferences, setSavedPreferences] =
    useState<PortfolioPreferences | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Generate unique storage key: user-workspace-gadget
  const storageKey = `portfolio-prefs-${userId}-${workspaceId}-${gadgetId}`;

  // Load preferences from localStorage
  const loadPreferences = useCallback((): PortfolioPreferences | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const prefs = JSON.parse(stored) as PortfolioPreferences;
      setSavedPreferences(prefs);
      if (prefs.timestamp) {
        setLastSaved(new Date(prefs.timestamp));
      }
      return prefs;
    } catch (error) {
      console.error("Failed to load preferences:", error);
      return null;
    }
  }, [storageKey]);

  // Save preferences to localStorage
  const savePreferences = useCallback(
    (preferences: PortfolioPreferences): boolean => {
      try {
        const prefsWithTimestamp: PortfolioPreferences = {
          ...preferences,
          timestamp: Date.now(),
        };

        localStorage.setItem(storageKey, JSON.stringify(prefsWithTimestamp));
        setSavedPreferences(prefsWithTimestamp);
        setLastSaved(new Date());
        return true;
      } catch (error) {
        console.error("Failed to save preferences:", error);
        return false;
      }
    },
    [storageKey]
  );

  // Clear preferences
  const clearPreferences = useCallback((): boolean => {
    try {
      localStorage.removeItem(storageKey);
      setSavedPreferences(null);
      setLastSaved(null);
      return true;
    } catch (error) {
      console.error("Failed to clear preferences:", error);
      return false;
    }
  }, [storageKey]);

  // Check if preferences exist
  const hasPreferences = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadPreferences();
    }
  }, [autoLoad, loadPreferences]);

  return {
    savedPreferences,
    lastSaved,
    savePreferences,
    loadPreferences,
    clearPreferences,
    hasPreferences: hasPreferences(),
    storageKey, // For debugging
  };
};

