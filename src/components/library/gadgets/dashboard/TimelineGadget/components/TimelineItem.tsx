/**
 * Timeline Item Component
 * Presentational component for rendering individual timeline items
 * Pure component - no business logic
 */

import { Tag, Typography, Dropdown, Button, Segmented } from "antd";
import {
  MoreOutlined,
  FileTextOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import React from "react";
import {
  TimelineItem as TimelineItemType,
  TimelineItemActions,
} from "../types";
import { formatDate, formatDuration } from "../utils/formatters";
import { renderIcon } from "../utils/iconHelpers";
import { getThemeColors, getLineColor } from "../utils/colorMapper";
import styles from "../TimelineGadget.module.css";

const { Text, Title } = Typography;

interface TimelineItemProps {
  item: TimelineItemType;
  index: number;
  statusColor?: string;
  showDates?: boolean;
  showDuration?: boolean;
  showDependencies?: boolean;
  showStatus?: boolean;
  labels: {
    noDateLabel: string;
    noDurationLabel: string;
    daysLabel: string;
    dependsOnLabel: string;
  };
  actions?: TimelineItemActions;
  updating?: boolean;
}

export const TimelineItemComponent: React.FC<TimelineItemProps> = React.memo(
  ({
    item,
    index,
    statusColor = "gray",
    showDates = true,
    showDuration = true,
    showDependencies = true,
    showStatus = true,
    labels,
    actions,
    updating = false,
  }) => {
    const icon = renderIcon(item.icon);
    const formattedDate = formatDate(item.date);
    const formattedDuration = formatDuration(item.duration, labels.daysLabel);
    const themeColors = getThemeColors(statusColor);
    const lineColor = getLineColor(statusColor);

    // Build dropdown menu items (without status)
    const menuItems = [
      {
        key: "add-log",
        label: "Add Log",
        icon: <FileTextOutlined />,
        onClick: () => actions?.onAddLog?.(item.id || String(index)),
      },
      {
        key: "add-comment",
        label: "Add Comment",
        icon: <CommentOutlined />,
        onClick: () => actions?.onAddComment?.(item.id || String(index)),
      },
    ];

    // Status options for button group
    const statusOptions = [
      { label: "Not Started", value: "Not Started" },
      { label: "In Progress", value: "In Progress" },
      { label: "Complete", value: "Complete" },
    ];

    return (
      <div className={styles.timelineItem}>
        {showDates && (
          <div className={styles.timelineDate}>
            <Text className={styles.timelineDateText}>
              {formattedDate || labels.noDateLabel}
            </Text>
          </div>
        )}

        <div className={styles.timelineMarker}>
          <div
            className={styles.timelineDot}
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
            }}
          >
            {icon && (
              <div
                className={styles.timelineIcon}
                style={{ color: themeColors.text }}
              >
                {icon}
              </div>
            )}
            {!icon && (
              <div
                className={styles.timelineNumber}
                style={{ color: themeColors.text }}
              >
                {index + 1}
              </div>
            )}
          </div>
          <div
            className={styles.timelineLine}
            style={{ backgroundColor: lineColor }}
          />
        </div>

        <div className={styles.timelineContent}>
          <div className={styles.timelineItemHeader}>
            <Title level={5} className={styles.timelineTitle}>
              {item.title}
            </Title>
            <div className={styles.timelineBadges}>
              {showDuration && formattedDuration && (
                <Tag color="default" className={styles.timelineDuration}>
                  {formattedDuration}
                </Tag>
              )}
              {actions && (
                <Dropdown
                  menu={{ items: menuItems }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    size="small"
                    className={styles.timelineActionButton}
                  />
                </Dropdown>
              )}
            </div>
          </div>

          {showStatus && (
            <div className={styles.timelineStatusGroup}>
              {actions ? (
                <Segmented
                  size="small"
                  options={statusOptions}
                  value={item.status || "Not Started"}
                  disabled={updating}
                  onChange={(value) => {
                    actions.onStatusChange?.(
                      item.id || String(index),
                      String(value)
                    );
                  }}
                  className={styles.timelineStatusSegmented}
                />
              ) : (
                item.status && (
                  <Tag color={statusColor} className={styles.timelineStatusTag}>
                    {item.status}
                  </Tag>
                )
              )}
            </div>
          )}

          {item.description && (
            <Text className={styles.timelineDescription}>
              {item.description}
            </Text>
          )}

          {showDependencies && item.dependencies && (
            <div className={styles.timelineMeta}>
              <div className={styles.timelineMetaItem}>
                <Text className={styles.timelineMetaLabel}>
                  {labels.dependsOnLabel}:
                </Text>
                <Text className={styles.timelineMetaValue}>
                  {item.dependencies}
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

TimelineItemComponent.displayName = "TimelineItem";
