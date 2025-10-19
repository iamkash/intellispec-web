/**
 * Table View Component
 * Ant Design Table layout for portfolio items
 */

import { Table, Tag } from "antd";
import React from "react";
import { CardDisplayConfig, MenuItem } from "../types";
import { resolvePath } from "../utils/pathResolver";
import { formatDate, isDateField } from "../utils/formatters";
import { renderIcon } from "../utils/iconHelpers";
import { DEFAULT_LABELS } from "../constants";

interface TableViewProps {
  items: MenuItem[];
  cardDisplay?: CardDisplayConfig;
  onClick?: (item: MenuItem) => void;
  isFavorite?: (key: string) => boolean;
  isRecent?: (key: string) => boolean;
  onToggleFavorite?: (e: React.MouseEvent, itemKey: string) => void;
  showFavoriteIcon?: boolean;
}

export const TableView: React.FC<TableViewProps> = React.memo(
  ({
    items,
    cardDisplay,
    onClick,
    isFavorite,
    isRecent,
    onToggleFavorite,
    showFavoriteIcon,
  }) => {
    // Generate columns from cardDisplay configuration
    const columns = React.useMemo(() => {
      const cols: any[] = [];

      // Title column
      if (cardDisplay?.title) {
        cols.push({
          title: "Title",
          dataIndex: "title",
          key: "title",
          render: (text: any, record: MenuItem) => {
            const title = resolvePath(record.raw, cardDisplay.title!);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {cardDisplay.titleIcon && (
                  <span style={{ fontSize: 16 }}>
                    {renderIcon(cardDisplay.titleIcon)}
                  </span>
                )}
                <span>{title || DEFAULT_LABELS.MISSING_VALUE}</span>
                {isRecent?.(record.key) && (
                  <span style={{ color: "#1890ff", fontSize: 12 }}>●</span>
                )}
              </div>
            );
          },
          sorter: (a: MenuItem, b: MenuItem) => {
            const titleA = resolvePath(a.raw, cardDisplay.title!) || "";
            const titleB = resolvePath(b.raw, cardDisplay.title!) || "";
            return titleA.localeCompare(titleB);
          },
        });
      }

      // Subtitle column
      if (cardDisplay?.subtitle) {
        cols.push({
          title: "Code",
          dataIndex: "subtitle",
          key: "subtitle",
          render: (text: any, record: MenuItem) => {
            const subtitle = resolvePath(record.raw, cardDisplay.subtitle!);
            return subtitle || DEFAULT_LABELS.MISSING_VALUE;
          },
          sorter: (a: MenuItem, b: MenuItem) => {
            const subtitleA = resolvePath(a.raw, cardDisplay.subtitle!) || "";
            const subtitleB = resolvePath(b.raw, cardDisplay.subtitle!) || "";
            return subtitleA.localeCompare(subtitleB);
          },
        });
      }

      // Tags column
      if (cardDisplay?.tags && cardDisplay.tags.length > 0) {
        cols.push({
          title: "Tags",
          dataIndex: "tags",
          key: "tags",
          render: (text: any, record: MenuItem) => {
            return (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {cardDisplay.tags!.map((tagPath, index) => {
                  const value = resolvePath(record.raw, tagPath);
                  if (!value) return null;
                  return <Tag key={index}>{value}</Tag>;
                })}
              </div>
            );
          },
        });
      }

      // List items as columns
      if (cardDisplay?.list) {
        cardDisplay.list.forEach((listItem, index) => {
          cols.push({
            title: listItem.label,
            dataIndex: `list_${index}`,
            key: `list_${index}`,
            render: (text: any, record: MenuItem) => {
              const value = resolvePath(record.raw, listItem.path);
              if (!value) return DEFAULT_LABELS.MISSING_VALUE;

              // Format dates
              if (isDateField(listItem.path)) {
                return formatDate(value);
              }

              return value;
            },
            sorter: (a: MenuItem, b: MenuItem) => {
              const valueA = resolvePath(a.raw, listItem.path) || "";
              const valueB = resolvePath(b.raw, listItem.path) || "";
              return valueA.localeCompare(valueB);
            },
          });
        });
      }

      // Actions column
      if (showFavoriteIcon) {
        cols.push({
          title: "Actions",
          key: "actions",
          width: 80,
          render: (text: any, record: MenuItem) => {
            return (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span
                  style={{
                    cursor: "pointer",
                    fontSize: 16,
                    color: isFavorite?.(record.key) ? "#ff4d4f" : "#d9d9d9",
                  }}
                  onClick={(e) => onToggleFavorite?.(e, record.key)}
                >
                  {isFavorite?.(record.key) ? "❤️" : "🤍"}
                </span>
              </div>
            );
          },
        });
      }

      return cols;
    }, [cardDisplay, isFavorite, isRecent, onToggleFavorite, showFavoriteIcon]);

    const handleRowClick = (record: MenuItem) => {
      onClick?.(record);
    };

    return (
      <Table
        columns={columns}
        dataSource={items}
        rowKey="key"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: "pointer" },
        })}
        size="small"
        scroll={{ x: "max-content" }}
      />
    );
  }
);

TableView.displayName = "TableView";
