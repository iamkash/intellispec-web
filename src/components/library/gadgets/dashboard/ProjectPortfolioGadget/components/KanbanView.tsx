/**
 * Kanban View Component
 * Displays items in swim lanes based on status field
 */

import { Badge, Space } from "antd";
import React, { useMemo } from "react";
import styles from "../PortfolioGadget.module.css";
import { CardDisplayConfig, MenuItem } from "../types";
import { resolvePath } from "../utils/pathResolver";
import { PortfolioCard } from "./PortfolioCard";

interface KanbanViewProps {
  items: MenuItem[];
  cardDisplay?: CardDisplayConfig;
  statusField?: string; // Field to use for swim lanes
  columnOrder?: string[]; // Optional: custom order for columns
  onClick?: (item: MenuItem) => void;
  isFavorite?: (key: string) => boolean;
  isRecent?: (key: string) => boolean;
  onToggleFavorite?: (e: React.MouseEvent, itemKey: string) => void;
  showFavoriteIcon?: boolean;
}

interface KanbanColumn {
  status: string;
  items: MenuItem[];
}

export const KanbanView: React.FC<KanbanViewProps> = React.memo(
  ({
    items,
    cardDisplay,
    statusField = "summary.project_status", // Default status field
    columnOrder,
    onClick,
    isFavorite,
    isRecent,
    onToggleFavorite,
    showFavoriteIcon,
  }) => {
    // Group items by status to create swim lanes
    const columns = useMemo((): KanbanColumn[] => {
      // Extract unique status values
      const statusMap = new Map<string, MenuItem[]>();

      items.forEach((item) => {
        const status =
          resolvePath(item.raw, statusField)?.toString() || "Uncategorized";

        if (!statusMap.has(status)) {
          statusMap.set(status, []);
        }
        statusMap.get(status)!.push(item);
      });

      // Convert to array of columns
      let columnsArray: KanbanColumn[] = Array.from(statusMap.entries()).map(
        ([status, items]) => ({
          status,
          items,
        })
      );

      // Apply custom order if provided
      if (columnOrder && columnOrder.length > 0) {
        columnsArray = columnOrder
          .map((status) => {
            const column = columnsArray.find((col) => col.status === status);
            return column || { status, items: [] };
          })
          .concat(
            // Add any columns not in the custom order at the end
            columnsArray.filter((col) => !columnOrder.includes(col.status))
          );
      } else {
        // Default: sort alphabetically
        columnsArray.sort((a, b) => a.status.localeCompare(b.status));
      }

      return columnsArray;
    }, [items, statusField, columnOrder]);

    return (
      <div className={styles.kanbanView}>
        <div className={styles.kanbanBoard}>
          {columns.map((column, index) => (
            <div key={index} className={styles.kanbanColumn}>
              {/* Column Header */}
              <div className={styles.kanbanColumnHeader}>
                <h4 className={styles.kanbanColumnTitle}>{column.status}</h4>
                <Badge
                  count={column.items.length}
                  showZero
                  className={styles.kanbanColumnBadge}
                  style={{
                    backgroundColor: "hsl(var(--primary))",
                  }}
                />
              </div>

              {/* Column Cards */}
              <Space
                direction="vertical"
                size={8}
                className={styles.kanbanColumnCards}
              >
                {column.items.map((item) => (
                  <PortfolioCard
                    key={item.key}
                    item={item}
                    cardDisplay={cardDisplay}
                    onClick={onClick}
                    isFavorite={isFavorite?.(item.key)}
                    isRecent={isRecent?.(item.key)}
                    onToggleFavorite={onToggleFavorite}
                    showFavoriteIcon={showFavoriteIcon}
                  />
                ))}

                {/* Empty state for column */}
                {column.items.length === 0 && (
                  <div className={styles.kanbanColumnEmpty}>
                    No items in this stage
                  </div>
                )}
              </Space>
            </div>
          ))}

          {/* Empty board state */}
          {columns.length === 0 && (
            <div className={styles.kanbanEmpty}>
              No items to display in Kanban view
            </div>
          )}
        </div>
      </div>
    );
  }
);

KanbanView.displayName = "KanbanView";
