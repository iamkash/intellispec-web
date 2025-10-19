/**
 * Sort Hook
 * Sorts portfolio items by a selected field
 */

import { useMemo, useState } from "react";
import { MenuItem } from "../types";
import { resolvePath } from "../utils/pathResolver";

export type SortOrder = "asc" | "desc";

export const useSort = (
  items: MenuItem[],
  favorites?: string[],
  recents?: string[]
) => {
  const [sortByField, setSortByField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Sort items by selected field - memoized for performance
  const sortedItems = useMemo(() => {
    if (!sortByField) {
      return items;
    }

    // Handle special sorting by Favorites
    if (sortByField === "__favorites" && favorites) {
      return [...items].sort((a, b) => {
        const aFav = favorites.includes(a.key);
        const bFav = favorites.includes(b.key);
        if (aFav === bFav) return 0;
        const result = aFav ? -1 : 1;
        return sortOrder === "desc" ? -result : result;
      });
    }

    // Handle special sorting by Recents (order in recents array)
    if (sortByField === "__recents" && recents) {
      return [...items].sort((a, b) => {
        const aIdx = recents.indexOf(a.key);
        const bIdx = recents.indexOf(b.key);
        const aRecent = aIdx !== -1;
        const bRecent = bIdx !== -1;
        
        if (!aRecent && !bRecent) return 0;
        if (!aRecent) return 1;
        if (!bRecent) return -1;
        
        // Sort by recency (lower index = more recent)
        const result = aIdx - bIdx;
        return sortOrder === "desc" ? -result : result;
      });
    }

    return [...items].sort((a, b) => {
      const valueA = resolvePath(a.raw, sortByField);
      const valueB = resolvePath(b.raw, sortByField);

      // Handle null/undefined values (push to end)
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;

      // Convert to strings for comparison
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();

      const comparison = strA.localeCompare(strB, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [items, sortByField, sortOrder, favorites, recents]);

  return {
    sortByField,
    setSortByField,
    sortOrder,
    setSortOrder,
    sortedItems,
    isSorted: !!sortByField,
  };
};

