/**
 * Portfolio Component
 * Renders the portfolio gadget UI based on metadata configuration
 */

import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { Button, Tooltip, Typography } from "antd";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { GadgetContext } from "../../base";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { GroupHeader } from "./components/GroupHeader";
import { KanbanView } from "./components/KanbanView";
import { ListView } from "./components/ListView";
import { LoadingState } from "./components/LoadingState";
import { PortfolioCard } from "./components/PortfolioCard";
import { PortfolioToolbar } from "./components/PortfolioToolbar";
import { TableView } from "./components/TableView";
import { getLabels } from "./constants";
import { useDataSource } from "./hooks/useDataSource";
import { useFavorites } from "./hooks/useFavorites";
import { useGroupBy } from "./hooks/useGroupBy";
import { usePreferences, PortfolioPreferences } from "./hooks/usePreferences";
import { useRecents } from "./hooks/useRecents";
import { useSearch } from "./hooks/useSearch";
import { useSort } from "./hooks/useSort";
import { useTour } from "./hooks/useTour";
import { useViewMode } from "./hooks/useViewMode";
import styles from "./PortfolioGadget.module.css";
import { MenuItem, ProjectPortfolioGadgetConfig } from "./types";
import { getSearchableFields, getSortableOptions } from "./utils/configHelpers";
import { renderIcon } from "./utils/iconHelpers";
import { resolvePath } from "./utils/pathResolver";

const { Title, Text } = Typography;

interface PortfolioComponentProps {
  config: ProjectPortfolioGadgetConfig;
  context?: GadgetContext;
}

export const PortfolioComponent: React.FC<PortfolioComponentProps> = ({
  config,
  context,
}) => {
  // Merge custom labels with defaults (i18n support)
  const labels = useMemo(() => getLabels(config.labels), [config.labels]);

  // Fullscreen state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        // Safari
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        // Firefox
        (containerRef.current as any).mozRequestFullScreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        // IE/Edge
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        // Safari
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        // Firefox
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        // IE/Edge
        (document as any).msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === containerRef.current ||
          (document as any).webkitFullscreenElement === containerRef.current ||
          (document as any).mozFullScreenElement === containerRef.current ||
          (document as any).msFullscreenElement === containerRef.current
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  // Get workspace ID and user ID from context
  const workspaceId = useMemo(() => {
    const contextWorkspace =
      (context as any)?.workspaceId ||
      (context as any)?.workspace?.id ||
      (context as any)?.workspaceSlug;
    if (contextWorkspace) {
      return String(contextWorkspace);
    }
    if (config.workspaceId) {
      return config.workspaceId;
    }
    return config.id || "default";
  }, [context, config.workspaceId, config.id]);

  const userId = useMemo(() => {
    // Get user ID from context if available
    return (context as any)?.userId || (context as any)?.user?.id || "default";
  }, [context]);

  const gadgetLogger = useMemo(() => {
    const logger = (context as any)?.logger;
    if (logger && typeof logger.info === "function") {
      return logger;
    }
    return null;
  }, [context]);

  // Preferences hook - scoped to user + workspace + gadget
  const { savedPreferences, lastSaved, savePreferences, loadPreferences } =
    usePreferences({
      workspaceId,
      gadgetId: config.id || "portfolio-gadget",
      userId,
      autoLoad: false, // We'll load manually after initializing states
    });

  // Data source hook (fetches data using BaseGadget)
  const { items, loading, error, reload } = useDataSource(
    config.dataUrl,
    config.dataPath
  );

  // Auto-generate searchable fields from cardDisplay config
  const searchFields = useMemo(
    () => getSearchableFields(config.cardDisplay),
    [config.cardDisplay]
  );

  // Search hook (implements search logic)
  const { searchText, setSearchText, filteredItems } = useSearch(
    items,
    searchFields
  );

  // Favorites hook
  const { favorites, toggleFavorite, isFavorite } = useFavorites(
    config.features?.persistKey || "portfolio-favorites"
  );

  // Recents hook
  const { recents, addRecent, isRecent } = useRecents(
    `${config.features?.persistKey || "portfolio"}-recents`,
    config.features?.maxRecents || 10
  );

  // View mode hook
  const { viewMode, setViewMode } = useViewMode(
    `${config.features?.persistKey || "portfolio"}-view-mode`,
    config.viewModes?.default || "grid"
  );

  const handleTourComplete = useCallback(() => {
    gadgetLogger?.info?.("portfolio_gadget.tour_completed", {
      gadgetId: config.id,
      userId,
      workspaceId,
    });
  }, [gadgetLogger, config.id, userId, workspaceId]);

  // Tour/Help hook
  const { startTour } = useTour({
    storageKey: `${config.features?.persistKey || "portfolio"}-tour-completed`,
    onComplete: handleTourComplete,
  });

  // Sort hook (sorts items by selected field)
  const { sortByField, setSortByField, sortOrder, setSortOrder, sortedItems } =
    useSort(filteredItems, favorites, recents);

  // Sort options from config - add Favorites/Recents if enabled
  const sortOptions = useMemo(() => {
    const baseOptions = getSortableOptions(config.cardDisplay);
    const extraOptions = [];

    if (config.features?.enableFavorites) {
      extraOptions.push({ label: labels.favoritesLabel, path: "__favorites" });
    }
    if (config.features?.enableRecents) {
      extraOptions.push({
        label: labels.recentlyViewedLabel,
        path: "__recents",
      });
    }

    return [...extraOptions, ...baseOptions];
  }, [
    config.cardDisplay,
    config.features?.enableFavorites,
    config.features?.enableRecents,
    labels.favoritesLabel,
    labels.recentlyViewedLabel,
  ]);

  // Group by hook (groups items by selected field)
  const {
    groupByField,
    setGroupByField,
    groupedItems,
    toggleGroupCollapse,
    isGroupCollapsed,
  } = useGroupBy(sortedItems, favorites, recents, {
    favoritesLabel: labels.favoritesLabel,
    nonFavoritesLabel: labels.nonFavoritesLabel,
    recentlyViewedLabel: labels.recentlyViewedLabel,
    notRecentlyViewedLabel: labels.notRecentlyViewedLabel,
  });

  // Favorites filter state
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  // Track if current state differs from saved preferences
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Load preferences on mount
  React.useEffect(() => {
    const prefs = loadPreferences();
    if (prefs) {
      // Apply saved preferences
      if (prefs.searchText !== undefined) setSearchText(prefs.searchText);
      if (prefs.sortByField !== undefined) setSortByField(prefs.sortByField);
      if (prefs.sortOrder !== undefined) setSortOrder(prefs.sortOrder);
      if (prefs.groupByField !== undefined) setGroupByField(prefs.groupByField);
      if (prefs.showFavoritesOnly !== undefined)
        setShowFavoritesOnly(prefs.showFavoritesOnly);
      if (prefs.viewMode !== undefined) setViewMode(prefs.viewMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount - intentionally empty deps

  // Detect changes to current state vs saved preferences
  React.useEffect(() => {
    if (!savedPreferences) {
      setHasUnsavedChanges(true); // Always show save if no preferences exist
      return;
    }

    const currentState: PortfolioPreferences = {
      searchText,
      sortByField,
      sortOrder,
      groupByField,
      showFavoritesOnly,
      viewMode,
    };

    const hasChanges =
      currentState.searchText !== savedPreferences.searchText ||
      currentState.sortByField !== savedPreferences.sortByField ||
      currentState.sortOrder !== savedPreferences.sortOrder ||
      currentState.groupByField !== savedPreferences.groupByField ||
      currentState.showFavoritesOnly !== savedPreferences.showFavoritesOnly ||
      currentState.viewMode !== savedPreferences.viewMode;

    setHasUnsavedChanges(hasChanges);
  }, [
    searchText,
    sortByField,
    sortOrder,
    groupByField,
    showFavoritesOnly,
    viewMode,
    savedPreferences,
  ]);

  // Filter by favorites if enabled (for grouped views)
  const displayItems = useMemo(() => {
    if (showFavoritesOnly && config.features?.enableFavorites) {
      return groupedItems
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => favorites.includes(item.key)),
        }))
        .filter((group) => group.items.length > 0);
    }
    return groupedItems;
  }, [
    groupedItems,
    showFavoritesOnly,
    favorites,
    config.features?.enableFavorites,
  ]);

  // Items for Kanban view (sorted and filtered by favorites)
  const kanbanItems = useMemo(() => {
    if (showFavoritesOnly && config.features?.enableFavorites) {
      return sortedItems.filter((item) => favorites.includes(item.key));
    }
    return sortedItems;
  }, [
    sortedItems,
    showFavoritesOnly,
    favorites,
    config.features?.enableFavorites,
  ]);

  // Handle card click - memoized for performance
  const handleCardClick = useCallback(
    (item: MenuItem) => {
      // Add to recents when clicked
      if (config.features?.enableRecents) {
        addRecent(item.key);
      }

      const navigation = config.navigation;
      const mergedParams: Record<string, any> = {
        ...(item.params || {}),
      };

      let targetWorkspace = item.workspace;

      if (navigation) {
        if (navigation.workspaceField) {
          const resolvedWorkspace = resolvePath(
            item.raw,
            navigation.workspaceField
          );
          if (resolvedWorkspace) {
            targetWorkspace = String(resolvedWorkspace);
          }
        }

        if (!targetWorkspace && navigation.workspace) {
          targetWorkspace = navigation.workspace;
        }

        const paramName = navigation.paramName || "id";
        let resolvedId =
          navigation.idPath !== undefined
            ? resolvePath(item.raw, navigation.idPath)
            : undefined;

        if (
          resolvedId === undefined ||
          resolvedId === null ||
          resolvedId === ""
        ) {
          resolvedId = item.raw?.id ?? item.raw?._id ?? item.key;
        }

        if (
          resolvedId !== undefined &&
          resolvedId !== null &&
          resolvedId !== ""
        ) {
          mergedParams[paramName] = resolvedId;
        }

        navigation.additionalParams?.forEach((paramConfig) => {
          const value = resolvePath(item.raw, paramConfig.path);
          if (value !== undefined && value !== null && value !== "") {
            mergedParams[paramConfig.name] = value;
          }
        });
      }

      const hasParams = Object.keys(mergedParams).length > 0;
      const navigationPayload = {
        item: item.key,
        workspace: targetWorkspace,
        params: hasParams ? mergedParams : undefined,
      };

      if (typeof window !== "undefined" && targetWorkspace) {
        try {
          window.sessionStorage.setItem(
            `workspace:${targetWorkspace}`,
            JSON.stringify(navigationPayload.params || {})
          );
          window.sessionStorage.setItem(
            "portfolio:last-selection",
            JSON.stringify({
              workspace: targetWorkspace,
              params: navigationPayload.params || {},
            })
          );
        } catch {
          // ignore storage exceptions
        }
      }

      gadgetLogger?.info?.("portfolio_gadget.card_clicked", {
        gadgetId: config.id,
        workspaceId,
        userId,
        targetWorkspace,
        params: navigationPayload.params,
      });
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug("[ProjectPortfolioGadget] card clicked", {
          itemKey: item.key,
          navigation,
          targetWorkspace,
          mergedParams,
          navigationPayload,
        });
      }

      if (
        navigation?.openInNewTab &&
        typeof window !== "undefined" &&
        targetWorkspace
      ) {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.debug("[ProjectPortfolioGadget] opening new tab", {
            targetWorkspace,
            mergedParams,
          });
        }
        const baseUrl = window.location.origin + window.location.pathname;
        const searchParams = new URLSearchParams();
        searchParams.append("workspace", targetWorkspace);
        if (hasParams) {
          Object.entries(mergedParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
        }
        window.open(
          `${baseUrl}?${searchParams.toString()}`,
          "_blank",
          "noopener"
        );
        return;
      }

      if (context && (context as any).onAction && targetWorkspace) {
        (context as any).onAction("navigate", navigationPayload);

        if (typeof window !== "undefined") {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set("workspace", targetWorkspace);

          if (hasParams && navigationPayload.params) {
            Object.entries(navigationPayload.params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                currentUrl.searchParams.set(key, String(value));
              }
            });
          }

          window.history.pushState(
            {},
            "",
            `${currentUrl.pathname}${currentUrl.search}`
          );
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.debug("[ProjectPortfolioGadget] updated URL", {
              url: currentUrl.toString(),
            });
          }
        }
        return;
      }

      if (typeof window !== "undefined" && targetWorkspace) {
        const baseUrl = window.location.origin + window.location.pathname;
        const searchParams = new URLSearchParams();
        searchParams.append("workspace", targetWorkspace);
        if (hasParams) {
          Object.entries(mergedParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
        }
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.debug("[ProjectPortfolioGadget] fallback navigation", {
            url: `${baseUrl}?${searchParams.toString()}`,
          });
        }
        window.location.href = `${baseUrl}?${searchParams.toString()}`;
      }
    },
    [
      context,
      config.features?.enableRecents,
      config.navigation,
      addRecent,
      gadgetLogger,
      config.id,
      workspaceId,
      userId,
    ]
  );

  // Handle favorite toggle - memoized
  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, itemKey: string) => {
      e.stopPropagation();
      toggleFavorite(itemKey);
    },
    [toggleFavorite]
  );

  // Handle save preferences
  const handleSavePreferences = useCallback(() => {
    const currentState: PortfolioPreferences = {
      searchText,
      sortByField,
      sortOrder,
      groupByField,
      showFavoritesOnly,
      viewMode,
    };

    const success = savePreferences(currentState);
    if (success) {
      gadgetLogger?.info?.("portfolio_gadget.preferences_saved", {
        gadgetId: config.id,
        userId,
        workspaceId,
        preferences: {
          searchText: currentState.searchText,
          sortByField: currentState.sortByField,
          sortOrder: currentState.sortOrder,
          groupByField: currentState.groupByField,
          showFavoritesOnly: currentState.showFavoritesOnly,
          viewMode: currentState.viewMode,
        },
      });
    }
  }, [
    searchText,
    sortByField,
    sortOrder,
    groupByField,
    showFavoritesOnly,
    viewMode,
    savePreferences,
    gadgetLogger,
    config.id,
    userId,
    workspaceId,
  ]);

  // Handle reset/reload - clear all filters and reload data
  const handleReset = useCallback(() => {
    // Clear search
    setSearchText("");
    // Clear sort
    setSortByField(undefined);
    setSortOrder("asc");
    // Clear group by
    setGroupByField(undefined);
    // Clear favorites filter
    setShowFavoritesOnly(false);
    // Reload data
    reload();
  }, [setSearchText, setSortByField, setSortOrder, setGroupByField, reload]);

  return (
    <div className={styles.portfolioContainer} ref={containerRef}>
      {/* Header Section */}
      <div className={styles.portfolioHeader}>
        <div className={styles.portfolioHeaderContent}>
          {renderIcon(config.header?.icon)}
          <Title level={4} className={styles.portfolioHeaderTitle}>
            {config.header?.title || labels.portfolio}
          </Title>
          <Tooltip
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <Button
              type="text"
              size="small"
              icon={
                isFullscreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={toggleFullscreen}
              className={styles.fullscreenButton}
            />
          </Tooltip>
        </div>
        {config.header?.subtitle && (
          <Text className={styles.portfolioHeaderSubtitle}>
            {config.header.subtitle}
          </Text>
        )}
      </div>

      {/* Toolbar Section */}
      <PortfolioToolbar
        toolbarConfig={config.toolbar}
        listItems={config.cardDisplay?.list}
        searchText={searchText}
        onSearchChange={setSearchText}
        sortOptions={sortOptions}
        sortByField={sortByField}
        sortOrder={sortOrder}
        onSortFieldChange={setSortByField}
        onSortOrderToggle={() =>
          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        }
        groupByField={groupByField}
        onGroupByChange={setGroupByField}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesFilter={() => setShowFavoritesOnly(!showFavoritesOnly)}
        favoriteCount={favorites.length}
        enableFavorites={config.features?.enableFavorites}
        enableRecents={config.features?.enableRecents}
        favoritesLabel={labels.favoritesLabel}
        recentlyViewedLabel={labels.recentlyViewedLabel}
        favoritesFilterLabel={labels.favoritesFilterLabel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        enableViewToggle={config.viewModes?.enableToggle}
        onSavePreferences={handleSavePreferences}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSaved={lastSaved}
        onReset={handleReset}
        isLoading={loading}
        onStartTour={startTour}
      />

      {/* Body Section */}
      <div className={styles.portfolioBody}>
        {error && <ErrorState error={error} />}

        {loading && <LoadingState rows={4} />}

        {!loading && !error && filteredItems.length === 0 && (
          <EmptyState message={labels.noItemsFound} />
        )}

        {!loading &&
          !error &&
          filteredItems.length > 0 &&
          viewMode === "kanban" &&
          kanbanItems.length === 0 && (
            <EmptyState message={labels.noItemsFound} />
          )}

        {!loading &&
          !error &&
          (viewMode === "kanban"
            ? kanbanItems.length > 0
            : filteredItems.length > 0) && (
            <div>
              {viewMode === "kanban" ? (
                // Kanban view - uses sorted items with favorites filter applied
                <KanbanView
                  items={kanbanItems}
                  cardDisplay={config.cardDisplay}
                  statusField={config.viewModes?.kanbanConfig?.statusField}
                  columnOrder={config.viewModes?.kanbanConfig?.columnOrder}
                  onClick={handleCardClick}
                  isFavorite={isFavorite}
                  isRecent={isRecent}
                  onToggleFavorite={handleToggleFavorite}
                  showFavoriteIcon={config.features?.enableFavorites}
                />
              ) : (
                // Other views - respect grouping
                displayItems.map((group, groupIdx) => {
                  const isCollapsed = isGroupCollapsed(group.groupName);

                  return (
                    <div key={groupIdx} className={styles.cardGroup}>
                      {groupByField && (
                        <GroupHeader
                          groupName={group.groupName}
                          itemCount={group.items.length}
                          isCollapsed={isCollapsed}
                          onToggle={() => toggleGroupCollapse(group.groupName)}
                        />
                      )}
                      {!isCollapsed && (
                        <>
                          {viewMode === "grid" && (
                            <div
                              className={styles.cardsGrid}
                              data-tour="portfolio-cards"
                            >
                              {group.items.map((item) => (
                                <PortfolioCard
                                  key={item.key}
                                  item={item}
                                  cardDisplay={config.cardDisplay}
                                  onClick={handleCardClick}
                                  isFavorite={isFavorite(item.key)}
                                  isRecent={isRecent(item.key)}
                                  onToggleFavorite={handleToggleFavorite}
                                  showFavoriteIcon={
                                    config.features?.enableFavorites
                                  }
                                />
                              ))}
                            </div>
                          )}
                          {viewMode === "list" && (
                            <ListView
                              items={group.items}
                              cardDisplay={config.cardDisplay}
                              onClick={handleCardClick}
                              isFavorite={isFavorite}
                              isRecent={isRecent}
                              onToggleFavorite={handleToggleFavorite}
                              showFavoriteIcon={
                                config.features?.enableFavorites
                              }
                            />
                          )}
                          {viewMode === "table" && (
                            <TableView
                              items={group.items}
                              cardDisplay={config.cardDisplay}
                              onClick={handleCardClick}
                              isFavorite={isFavorite}
                              isRecent={isRecent}
                              onToggleFavorite={handleToggleFavorite}
                              showFavoriteIcon={
                                config.features?.enableFavorites
                              }
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
      </div>

      {/* Footer Section */}
      <div className={styles.portfolioFooter}>
        {!loading && !error && (
          <Text type="secondary">
            Showing{" "}
            {viewMode === "kanban" ? kanbanItems.length : filteredItems.length}{" "}
            of {items.length} items
          </Text>
        )}
      </div>
    </div>
  );
};
