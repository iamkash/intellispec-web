/**
 * Error State Component
 * Displays error alerts
 * Pure presentational component
 */

import { Alert } from "antd";
import React from "react";
import { DEFAULT_LABELS } from "../constants";

interface ErrorStateProps {
  error: string;
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = React.memo(
  ({ error, message = DEFAULT_LABELS.ERROR_MESSAGE }) => {
    return (
      <Alert type="error" message={message} description={error} showIcon />
    );
  }
);

ErrorState.displayName = "ErrorState";
