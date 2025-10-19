/**
 * Hooks Integration Tests
 * Tests for custom hooks (useSearch, useSort, useGroupBy)
 */

import { act, renderHook } from "@testing-library/react";
import { useGroupBy } from "../hooks/useGroupBy";
import { useSearch } from "../hooks/useSearch";
import { useSort } from "../hooks/useSort";
import { MenuItem } from "../types";

describe("Hooks", () => {
  const mockItems: MenuItem[] = [
    {
      key: "1",
      label: "Item 1",
      fields: {},
      params: {},
      raw: {
        id: "1",
        "summary.project_name": "Alpha Project",
        "summary.client_name": "Acme Corp",
        "summary.priority": "high",
      },
    },
    {
      key: "2",
      label: "Item 2",
      fields: {},
      params: {},
      raw: {
        id: "2",
        "summary.project_name": "Beta Project",
        "summary.client_name": "Beta Inc",
        "summary.priority": "low",
      },
    },
    {
      key: "3",
      label: "Item 3",
      fields: {},
      params: {},
      raw: {
        id: "3",
        "summary.project_name": "Gamma Project",
        "summary.client_name": "Acme Corp",
        "summary.priority": "medium",
      },
    },
  ];

  describe("useSearch", () => {
    it("should filter items based on search text", async () => {
      const { result } = renderHook(() =>
        useSearch(mockItems, ["summary.project_name"])
      );

      // Initially, all items should be returned
      expect(result.current.filteredItems).toHaveLength(3);

      // Set search text
      act(() => {
        result.current.setSearchText("Alpha");
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Should filter to 1 item
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].key).toBe("1");
    });

    it("should return all items when search is empty", () => {
      const { result } = renderHook(() =>
        useSearch(mockItems, ["summary.project_name"])
      );

      expect(result.current.filteredItems).toHaveLength(3);
    });
  });

  describe("useSort", () => {
    it("should sort items ascending", () => {
      const { result } = renderHook(() => useSort(mockItems));

      act(() => {
        result.current.setSortByField("summary.project_name");
        result.current.setSortOrder("asc");
      });

      const sorted = result.current.sortedItems;
      expect(sorted[0].raw["summary.project_name"]).toBe("Alpha Project");
      expect(sorted[2].raw["summary.project_name"]).toBe("Gamma Project");
    });

    it("should sort items descending", () => {
      const { result } = renderHook(() => useSort(mockItems));

      act(() => {
        result.current.setSortByField("summary.project_name");
        result.current.setSortOrder("desc");
      });

      const sorted = result.current.sortedItems;
      expect(sorted[0].raw["summary.project_name"]).toBe("Gamma Project");
      expect(sorted[2].raw["summary.project_name"]).toBe("Alpha Project");
    });

    it("should return unsorted items when sortByField is undefined", () => {
      const { result } = renderHook(() => useSort(mockItems));

      expect(result.current.sortedItems).toHaveLength(3);
      expect(result.current.sortedItems).toEqual(mockItems);
    });
  });

  describe("useGroupBy", () => {
    it("should group items by field", () => {
      const { result } = renderHook(() => useGroupBy(mockItems));

      act(() => {
        result.current.setGroupByField("summary.client_name");
      });

      const grouped = result.current.groupedItems;
      expect(grouped).toHaveLength(2); // Acme Corp, Beta Inc
      expect(grouped[0].groupName).toBe("Acme Corp");
      expect(grouped[0].items).toHaveLength(2);
      expect(grouped[1].groupName).toBe("Beta Inc");
      expect(grouped[1].items).toHaveLength(1);
    });

    it("should handle missing values as 'Unspecified'", () => {
      const itemsWithMissing: MenuItem[] = [
        ...mockItems,
        {
          key: "4",
          label: "Item 4",
          fields: {},
          params: {},
          raw: { id: "4" }, // No client_name
        },
      ];

      const { result } = renderHook(() => useGroupBy(itemsWithMissing));

      act(() => {
        result.current.setGroupByField("summary.client_name");
      });

      const grouped = result.current.groupedItems;
      const unspecifiedGroup = grouped.find(
        (g) => g.groupName === "Unspecified"
      );
      expect(unspecifiedGroup).toBeDefined();
      expect(unspecifiedGroup?.items).toHaveLength(1);
    });

    it("should toggle group collapse state", () => {
      const { result } = renderHook(() => useGroupBy(mockItems));

      act(() => {
        result.current.setGroupByField("summary.client_name");
      });

      // Initially not collapsed
      expect(result.current.isGroupCollapsed("Acme Corp")).toBe(false);

      // Toggle collapse
      act(() => {
        result.current.toggleGroupCollapse("Acme Corp");
      });

      expect(result.current.isGroupCollapsed("Acme Corp")).toBe(true);

      // Toggle again
      act(() => {
        result.current.toggleGroupCollapse("Acme Corp");
      });

      expect(result.current.isGroupCollapsed("Acme Corp")).toBe(false);
    });
  });
});
