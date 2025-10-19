/**
 * List View Component
 * Compact list layout for portfolio items
 */

import { Space } from "antd";
import React from "react";
import styles from "../PortfolioGadget.module.css";
import { CardDisplayConfig, MenuItem } from "../types";
import { PortfolioCard } from "./PortfolioCard";

interface ListViewProps {
  items: MenuItem[];
  cardDisplay?: CardDisplayConfig;
  onClick?: (item: MenuItem) => void;
  isFavorite?: (key: string) => boolean;
  isRecent?: (key: string) => boolean;
  onToggleFavorite?: (e: React.MouseEvent, itemKey: string) => void;
  showFavoriteIcon?: boolean;
}

export const ListView: React.FC<ListViewProps> = React.memo(
  ({
    items,
    cardDisplay,
    onClick,
    isFavorite,
    isRecent,
    onToggleFavorite,
    showFavoriteIcon,
  }) => {
    return (
      <Space direction="vertical" size={8} className={styles.listView}>
        {items.map((item) => (
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
      </Space>
    );
  }
);

ListView.displayName = "ListView";
