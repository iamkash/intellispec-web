/**
 * Empty State Component
 * Displays when no timeline items are available
 */

import { Empty } from "antd";
import React from "react";

interface EmptyStateProps {
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({ message }) => {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <Empty description={message} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
