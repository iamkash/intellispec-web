/**
 * Empty State Component
 * Displays message when no items are found
 * Pure presentational component
 */

import { Empty } from "antd";
import React from "react";

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({ message = "No items found" }) => {
    return <Empty description={message} style={{ padding: "48px 0" }} />;
  }
);

EmptyState.displayName = "EmptyState";
