/**
 * Loading State Component
 * Displays skeleton loading state
 * Pure presentational component
 */

import { Skeleton } from "antd";
import React from "react";

interface LoadingStateProps {
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = React.memo(
  ({ rows = 4 }) => {
    return (
      <div>
        <Skeleton active paragraph={{ rows }} />
      </div>
    );
  }
);

LoadingState.displayName = "LoadingState";
