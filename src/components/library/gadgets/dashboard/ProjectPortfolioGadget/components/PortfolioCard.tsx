/**
 * Portfolio Card Component
 * Presentational component for rendering individual portfolio cards
 * Pure component - no business logic
 */

import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Badge, Card, Space, Tag, Typography } from "antd";
import React, { useMemo } from "react";
import { DEFAULT_LABELS } from "../constants";
import styles from "../PortfolioGadget.module.css";
import { CardDisplayConfig, MenuItem } from "../types";
import { formatDate, isDateField } from "../utils/formatters";
import { renderIcon } from "../utils/iconHelpers";
import { resolvePath } from "../utils/pathResolver";

const { Title, Text } = Typography;

interface PortfolioCardProps {
  item: MenuItem;
  cardDisplay?: CardDisplayConfig;
  onClick?: (item: MenuItem) => void;
  isFavorite?: boolean;
  isRecent?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, itemKey: string) => void;
  showFavoriteIcon?: boolean;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = React.memo(
  ({
    item,
    cardDisplay,
    onClick,
    isFavorite = false,
    isRecent = false,
    onToggleFavorite,
    showFavoriteIcon = false,
  }) => {
    // Resolve title from metadata - memoized
    const title = useMemo(() => {
      if (cardDisplay?.title) {
        const resolved = resolvePath(item.raw, cardDisplay.title);
        if (resolved === null || resolved === undefined || resolved === "") {
          return DEFAULT_LABELS.MISSING_VALUE;
        }
        return String(resolved);
      }
      return item.label ?? DEFAULT_LABELS.MISSING_VALUE;
    }, [item.raw, item.label, cardDisplay?.title]);

    // Resolve subtitle from metadata - memoized
    const subtitle = useMemo(
      () =>
        cardDisplay?.subtitle
          ? resolvePath(item.raw, cardDisplay.subtitle)
          : undefined,
      [item.raw, cardDisplay?.subtitle]
    );

    // Resolve icon from metadata - memoized
    const iconName = useMemo(
      () =>
        cardDisplay?.titleIcon
          ? resolvePath(item.raw, cardDisplay.titleIcon) ||
            cardDisplay.titleIcon
          : item.icon,
      [item.raw, item.icon, cardDisplay?.titleIcon]
    );

    // Resolve tags from metadata - memoized
    const tagValues = useMemo(
      () =>
        cardDisplay?.tags
          ?.map((tagPath) => {
            const value = resolvePath(item.raw, tagPath);
            return value ? { path: tagPath, value: String(value) } : null;
          })
          .filter(Boolean) || [],
      [item.raw, cardDisplay?.tags]
    );

    // Resolve list items from metadata - always show all labels - memoized
    const listItems = useMemo(
      () =>
        cardDisplay?.list?.map((listConfig) => {
          const rawValue = resolvePath(item.raw, listConfig.path);

          if (!rawValue) {
            return {
              label: listConfig.label,
              value: DEFAULT_LABELS.MISSING_VALUE,
              icon: listConfig.icon,
            };
          }

          // Auto-format dates based on field name
          const formattedValue = isDateField(listConfig.path)
            ? formatDate(rawValue)
            : String(rawValue);

          return {
            label: listConfig.label,
            value: formattedValue,
            icon: listConfig.icon,
          };
        }) || [],
      [item.raw, cardDisplay?.list]
    );

    return (
      <Card
        className={styles.portfolioCard}
        bordered={false}
        hoverable
        onClick={() => onClick?.(item)}
      >
        <div className={styles.cardHeader}>
          {iconName && (
            <div className={styles.cardIcon}>
              {isRecent ? (
                <Badge dot>{renderIcon(iconName)}</Badge>
              ) : (
                renderIcon(iconName)
              )}
            </div>
          )}
          <div className={styles.cardHeaderContent}>
            {title && (
              <Title level={5} className={styles.cardTitle}>
                {title}
              </Title>
            )}
            {subtitle && (
              <Text className={styles.cardSubtitle}>{subtitle}</Text>
            )}
          </div>
          {showFavoriteIcon && onToggleFavorite && (
            <div
              className={styles.cardFavorite}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(e, item.key);
              }}
            >
              {isFavorite ? (
                <HeartFilled className={styles.favoriteIconActive} />
              ) : (
                <HeartOutlined className={styles.favoriteIcon} />
              )}
            </div>
          )}
        </div>
        {tagValues.length > 0 && (
          <Space size={4} wrap className={styles.cardTags}>
            {tagValues.map((tag, idx) => (
              <Tag key={idx} className={styles.cardTag}>
                {tag!.value}
              </Tag>
            ))}
          </Space>
        )}
        {listItems.length > 0 && (
          <div className={styles.cardList}>
            {listItems.map((listItem, idx) => (
              <div key={idx} className={styles.cardListItem}>
                {listItem.icon && (
                  <div className={styles.cardListIcon}>
                    {renderIcon(listItem.icon)}
                  </div>
                )}
                <div className={styles.cardListContent}>
                  <Text className={styles.cardListLabel}>{listItem.label}</Text>
                  <Text className={styles.cardListValue}>{listItem.value}</Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }
);

PortfolioCard.displayName = "PortfolioCard";
