/**
 * View Mode Hook
 * Manages view mode state with localStorage persistence
 */

import { useCallback, useEffect, useState } from "react";

export type ViewMode = "grid" | "list" | "table" | "kanban";

export const useViewMode = (
  storageKey: string = "portfolio-view-mode",
  defaultView: ViewMode = "grid"
) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultView);

  // Load view mode from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (
        stored &&
        (stored === "grid" ||
          stored === "list" ||
          stored === "table" ||
          stored === "kanban")
      ) {
        setViewModeState(stored as ViewMode);
      }
    } catch {
      // Silently fail - use default
      setViewModeState(defaultView);
    }
  }, [storageKey, defaultView]);

  // Set view mode and persist
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      try {
        localStorage.setItem(storageKey, mode);
      } catch {
        // Silently fail if localStorage unavailable
      }
    },
    [storageKey]
  );

  return {
    viewMode,
    setViewMode,
    isGridView: viewMode === "grid",
    isListView: viewMode === "list",
    isTableView: viewMode === "table",
    isKanbanView: viewMode === "kanban",
  };
};

