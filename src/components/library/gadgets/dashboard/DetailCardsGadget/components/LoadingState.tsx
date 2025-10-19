/**
 * Loading State Component
 * Displays skeleton cards while data is loading
 */

import { Card, Skeleton } from "antd";
import React from "react";
import styles from "../DetailCardsGadget.module.css";

export const LoadingState: React.FC = React.memo(() => {
  return (
    <div className={styles.cardsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className={styles.detailCard} bordered={false}>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      ))}
    </div>
  );
});

LoadingState.displayName = "LoadingState";

