/**
 * Error State Component
 * Displays error messages
 */

import { Empty } from "antd";
import React from "react";

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = React.memo(
  ({ message }) => {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Empty description={message} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }
);

ErrorState.displayName = "ErrorState";

