/**
 * Detail Card Component
 * Presentational component for rendering individual detail cards
 * Pure component - no business logic
 */

import { Card, Typography } from "antd";
import React from "react";
import { CardConfig } from "../types";
import { formatValue } from "../utils/formatters";
import { renderIcon } from "../utils/iconHelpers";
import { resolvePath } from "../utils/pathResolver";
import styles from "../DetailCardsGadget.module.css";

const { Title, Text } = Typography;

interface DetailCardProps {
  card: CardConfig;
  data: any;
}

export const DetailCard: React.FC<DetailCardProps> = React.memo(
  ({ card, data }) => {
    const cardIcon = renderIcon(card.icon);

    return (
      <Card key={card.id} className={styles.detailCard} bordered={false}>
        <div className={styles.cardHeader}>
          {cardIcon && <div className={styles.cardIcon}>{cardIcon}</div>}
          <div className={styles.cardHeaderContent}>
            <Title level={5} className={styles.cardTitle}>
              {card.title}
            </Title>
          </div>
        </div>

        <div className={styles.cardList}>
          {card.fields.map((field, index) => {
            const value = resolvePath(data, field.path);
            const formattedValue = formatValue(value, field.format, field.fallback);
            const fieldIcon = renderIcon(field.icon);

            return (
              <div
                key={`${card.id}-field-${index}`}
                className={styles.cardListItem}
              >
                {fieldIcon && (
                  <div className={styles.cardListIcon}>{fieldIcon}</div>
                )}
                <div className={styles.cardListContent}>
                  <Text className={styles.cardListLabel}>{field.label}</Text>
                  <Text className={styles.cardListValue}>{formattedValue}</Text>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }
);

DetailCard.displayName = "DetailCard";

