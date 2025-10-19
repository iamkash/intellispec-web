/**
 * Portfolio Toolbar Component
 * Presentational component for search, sort, and group controls
 * Pure component - receives handlers from parent
 */

import {
  AppstoreOutlined,
  BarsOutlined,
  HeartOutlined,
  ProjectOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Button, Divider, Input, Select, Space, Tooltip } from "antd";
import React from "react";
import { DEFAULT_LABELS } from "../constants";
import styles from "../PortfolioGadget.module.css";
import { ListItemConfig, ToolbarConfig, ViewMode } from "../types";
import { SortOrder } from "../hooks/useSort";

const { Option } = Select;

interface PortfolioToolbarProps {
  toolbarConfig?: ToolbarConfig;
  listItems?: ListItemConfig[];
  // Search
  searchText: string;
  onSearchChange: (value: string) => void;
  // Sort
  sortOptions: Array<{ label: string; path: string }>;
  sortByField?: string;
  sortOrder: SortOrder;
  onSortFieldChange: (value: string | undefined) => void;
  onSortOrderToggle: () => void;
  // Group
  groupByField?: string;
  onGroupByChange: (value: string | undefined) => void;
  // Favorites
  showFavoritesOnly?: boolean;
  onToggleFavoritesFilter?: () => void;
  favoriteCount?: number;
  enableFavorites?: boolean;
  enableRecents?: boolean;
  favoritesLabel?: string;
  recentlyViewedLabel?: string;
  favoritesFilterLabel?: string;
  // View Modes
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  enableViewToggle?: boolean;
  // Reset/Reload
  onReset?: () => void;
  isLoading?: boolean;
  // Save Preferences
  onSavePreferences?: () => void;
  hasUnsavedChanges?: boolean;
  lastSaved?: Date | null;
  // Help/Tour
  onStartTour?: () => void;
}

export const PortfolioToolbar: React.FC<PortfolioToolbarProps> = React.memo(
  ({
    toolbarConfig,
    listItems,
    searchText,
    onSearchChange,
    sortOptions,
    sortByField,
    sortOrder,
    onSortFieldChange,
    onSortOrderToggle,
    groupByField,
    onGroupByChange,
    showFavoritesOnly = false,
    onToggleFavoritesFilter,
    favoriteCount = 0,
    enableFavorites = false,
    enableRecents = false,
    favoritesLabel = DEFAULT_LABELS.FAVORITES,
    recentlyViewedLabel = DEFAULT_LABELS.RECENTLY_VIEWED,
    favoritesFilterLabel = DEFAULT_LABELS.FAVORITES_FILTER,
    viewMode = "grid",
    onViewModeChange,
    enableViewToggle = false,
    onReset,
    isLoading = false,
    onSavePreferences,
    hasUnsavedChanges = false,
    lastSaved,
    onStartTour,
  }) => {
    return (
      <div className={styles.portfolioToolbar}>
        {/* Left Section - Search */}
        <div className={styles.toolbarLeft}>
          {toolbarConfig?.enableSearch && (
            <Input
              placeholder={
                toolbarConfig?.searchPlaceholder ||
                DEFAULT_LABELS.SEARCH_PLACEHOLDER
              }
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
              className={styles.searchInput}
              data-tour="search-input"
            />
          )}
        </div>

        {/* Right Section - Controls */}
        <div className={styles.toolbarRight}>
          <Space split={<Divider type="vertical" />} size="middle">
            {/* Sort Controls */}
            {toolbarConfig?.enableSort && sortOptions.length > 0 && (
              <Space.Compact data-tour="sort-select">
                <Select
                  placeholder={
                    toolbarConfig?.sortPlaceholder ||
                    DEFAULT_LABELS.SORT_PLACEHOLDER
                  }
                  value={sortByField}
                  onChange={onSortFieldChange}
                  allowClear
                  className={styles.sortSelect}
                >
                  {sortOptions.map((option) => (
                    <Option key={option.path} value={option.path}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
                {sortByField && (
                  <Tooltip
                    title={
                      sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"
                    }
                  >
                    <Button
                      icon={
                        sortOrder === "asc" ? (
                          <SortAscendingOutlined />
                        ) : (
                          <SortDescendingOutlined />
                        )
                      }
                      onClick={onSortOrderToggle}
                    />
                  </Tooltip>
                )}
              </Space.Compact>
            )}

            {/* Group By Control */}
            {toolbarConfig?.enableGroupBy && (
              <Select
                placeholder={
                  toolbarConfig?.groupByPlaceholder ||
                  DEFAULT_LABELS.GROUP_PLACEHOLDER
                }
                value={groupByField}
                onChange={onGroupByChange}
                allowClear
                className={styles.groupSelect}
                data-tour="group-by-select"
              >
                {enableFavorites && (
                  <Option key="__favorites" value="__favorites">
                    {favoritesLabel}
                  </Option>
                )}
                {enableRecents && (
                  <Option key="__recents" value="__recents">
                    {recentlyViewedLabel}
                  </Option>
                )}
                {listItems?.map((listItem) => (
                  <Option key={listItem.path} value={listItem.path}>
                    {listItem.label}
                  </Option>
                ))}
              </Select>
            )}

            {/* Favorites Filter */}
            {toolbarConfig?.enableFavoritesFilter &&
              onToggleFavoritesFilter && (
                <Tooltip title="Show only favorites">
                  <Button
                    type={showFavoritesOnly ? "primary" : "default"}
                    icon={<HeartOutlined />}
                    onClick={onToggleFavoritesFilter}
                    data-tour="favorites-button"
                  >
                    {favoritesFilterLabel}
                    {favoriteCount > 0 && ` (${favoriteCount})`}
                  </Button>
                </Tooltip>
              )}

            {/* View Mode Toggle */}
            {enableViewToggle && onViewModeChange && (
              <Space.Compact data-tour="view-modes">
                <Tooltip title="Grid View">
                  <Button
                    type={viewMode === "grid" ? "primary" : "default"}
                    icon={<AppstoreOutlined />}
                    onClick={() => onViewModeChange("grid")}
                  />
                </Tooltip>
                <Tooltip title="List View">
                  <Button
                    type={viewMode === "list" ? "primary" : "default"}
                    icon={<BarsOutlined />}
                    onClick={() => onViewModeChange("list")}
                  />
                </Tooltip>
                <Tooltip title="Table View">
                  <Button
                    type={viewMode === "table" ? "primary" : "default"}
                    icon={<TableOutlined />}
                    onClick={() => onViewModeChange("table")}
                  />
                </Tooltip>
                <Tooltip title="Kanban View">
                  <Button
                    type={viewMode === "kanban" ? "primary" : "default"}
                    icon={<ProjectOutlined />}
                    onClick={() => onViewModeChange("kanban")}
                  />
                </Tooltip>
              </Space.Compact>
            )}

            {/* Save Preferences Button */}
            {onSavePreferences && (
              <Tooltip
                title={
                  lastSaved
                    ? `Last saved: ${lastSaved.toLocaleString()}`
                    : "Save current filters and view settings"
                }
              >
                <Button
                  type={hasUnsavedChanges ? "primary" : "default"}
                  icon={<SaveOutlined />}
                  onClick={onSavePreferences}
                  disabled={isLoading}
                  data-tour="save-preferences"
                >
                  {hasUnsavedChanges ? "Save*" : "Save"}
                </Button>
              </Tooltip>
            )}

            {/* Reset/Reload Button */}
            {onReset && (
              <Tooltip title="Reset filters and reload data">
                <Button
                  icon={<ReloadOutlined spin={isLoading} />}
                  onClick={onReset}
                  disabled={isLoading}
                  data-tour="reset-button"
                >
                  Reset
                </Button>
              </Tooltip>
            )}

            {/* Help/Tour Button */}
            {onStartTour && (
              <Tooltip title="Show guided tour of all features">
                <Button
                  icon={<QuestionCircleOutlined />}
                  onClick={onStartTour}
                  type="text"
                >
                  Help
                </Button>
              </Tooltip>
            )}
          </Space>
        </div>
      </div>
    );
  }
);

PortfolioToolbar.displayName = "PortfolioToolbar";
