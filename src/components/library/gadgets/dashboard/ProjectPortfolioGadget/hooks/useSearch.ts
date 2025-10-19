/**
 * Search Hook
 * Handles search logic for portfolio items with optimized filtering
 */

import { useEffect, useMemo, useState } from "react";
import { DEBOUNCE_DELAY } from "../constants";
import { MenuItem } from "../types";
import { resolvePath } from "../utils/pathResolver";

export const useSearch = (items: MenuItem[], searchFields?: string[]) => {
  const [searchText, setSearchText] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchText);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Filter items based on search text - memoized for performance
  const filteredItems = useMemo(() => {
    if (!searchDebounce || !searchFields || searchFields.length === 0) {
      return items;
    }

    const searchLower = searchDebounce.toLowerCase();

    return items.filter((item) =>
      searchFields.some((field) => {
        // Search in raw data using path resolver
        const value = resolvePath(item.raw, field);
        if (value === null || value === undefined) {
          return false;
        }
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [items, searchDebounce, searchFields]);

  return {
    searchText,
    setSearchText,
    searchDebounce,
    filteredItems,
    isSearching: searchText !== searchDebounce,
  };
};

