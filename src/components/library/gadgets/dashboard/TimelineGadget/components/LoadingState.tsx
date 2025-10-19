/**
 * Loading State Component
 * Displays skeleton while data is loading
 */

import { Skeleton } from "antd";
import React from "react";
import styles from "../TimelineGadget.module.css";

export const LoadingState: React.FC = React.memo(() => {
  return (
    <div className={styles.timelineContainer}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
});

LoadingState.displayName = "LoadingState";
