/**
 * Data Source Hook
 * Fetches portfolio data from API using BaseGadget authentication
 */

import { useCallback, useEffect, useState } from "react";
import { BaseGadget } from "../../../base";
import { MenuItem } from "../types";

export const useDataSource = (dataUrl?: string, dataPath?: string) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const reload = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!dataUrl) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use BaseGadget authenticated fetch
        const response = await BaseGadget.makeAuthenticatedFetch(dataUrl);

        if (!response.ok) {
          if (response.status === 401) {
            BaseGadget.forceLogout();
            return;
          }
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const payload = await response.json();

        // Extract data using dataPath if provided
        let data = payload;
        if (dataPath) {
          const paths = dataPath.split(".");
          for (const path of paths) {
            data = data?.[path];
          }
        }

        // Ensure we have an array
        const rawItems = Array.isArray(data) ? data : [];

        // Transform raw data to MenuItem[] - minimal transformation
        const menuItems: MenuItem[] = rawItems.map((item: any, index: number) => ({
          key: item.id || item._id || `item-${index}`,
          icon: undefined,
          workspace: item.workspaceId || item.workspace || undefined,
          params: {},
          fields: {},
          raw: item, // Preserve raw data - all field resolution happens via metadata
        }));

        setItems(menuItems);
      } catch (err: any) {
        setError(err?.message || "Unable to load data");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataUrl, dataPath, refreshTrigger]);

  return {
    items,
    loading,
    error,
    reload,
  };
};
