/**
 * Group By Hook
 * Groups portfolio items by a selected field with collapsible groups
 */

import { useCallback, useMemo, useState } from "react";
import { DEFAULT_LABELS } from "../constants";
import { MenuItem } from "../types";
import { resolvePath } from "../utils/pathResolver";

export interface GroupedItems {
  groupName: string;
  items: MenuItem[];
}

interface GroupLabels {
  favoritesLabel: string;
  nonFavoritesLabel: string;
  recentlyViewedLabel: string;
  notRecentlyViewedLabel: string;
}

export const useGroupBy = (
  items: MenuItem[],
  favorites?: string[],
  recents?: string[],
  labels?: GroupLabels
) => {
  const [groupByField, setGroupByField] = useState<string | undefined>(
    undefined
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const favoritesLabel =
    labels?.favoritesLabel || DEFAULT_LABELS.FAVORITES;
  const nonFavoritesLabel =
    labels?.nonFavoritesLabel || DEFAULT_LABELS.NON_FAVORITES;
  const recentlyViewedLabel =
    labels?.recentlyViewedLabel || DEFAULT_LABELS.RECENTLY_VIEWED;
  const notRecentlyViewedLabel =
    labels?.notRecentlyViewedLabel || DEFAULT_LABELS.NOT_RECENTLY_VIEWED;

  // Group items by selected field - memoized for performance
  const groupedItems = useMemo(() => {
    if (!groupByField) {
      return [{ groupName: DEFAULT_LABELS.ALL_ITEMS, items }];
    }

    // Handle special grouping by Favorites
    if (groupByField === "__favorites" && favorites) {
      return [
        {
          groupName: favoritesLabel,
          items: items.filter((item) => favorites.includes(item.key)),
        },
        {
          groupName: nonFavoritesLabel,
          items: items.filter((item) => !favorites.includes(item.key)),
        },
      ].filter((group) => group.items.length > 0);
    }

    // Handle special grouping by Recents
    if (groupByField === "__recents" && recents) {
      return [
        {
          groupName: recentlyViewedLabel,
          items: items.filter((item) => recents.includes(item.key)),
        },
        {
          groupName: notRecentlyViewedLabel,
          items: items.filter((item) => !recents.includes(item.key)),
        },
      ].filter((group) => group.items.length > 0);
    }

    const groups = new Map<string, MenuItem[]>();

    items.forEach((item) => {
      const value = resolvePath(item.raw, groupByField);
      const groupName = value ? String(value) : DEFAULT_LABELS.UNSPECIFIED;

      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(item);
    });

    // Convert to array and sort by group name
    return Array.from(groups.entries())
      .map(([groupName, items]) => ({ groupName, items }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [
    items,
    groupByField,
    favorites,
    recents,
    favoritesLabel,
    nonFavoritesLabel,
    recentlyViewedLabel,
    notRecentlyViewedLabel,
  ]);

  // Toggle group collapse state
  const toggleGroupCollapse = useCallback((groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);

  // Check if a group is collapsed
  const isGroupCollapsed = useCallback(
    (groupName: string) => collapsedGroups.has(groupName),
    [collapsedGroups]
  );

  return {
    groupByField,
    setGroupByField,
    groupedItems,
    isGrouped: !!groupByField,
    toggleGroupCollapse,
    isGroupCollapsed,
  };
};
