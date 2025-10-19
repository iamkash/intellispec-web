/**
 * Icon rendering utilities
 * Pure presentational helpers
 */

import * as Icons from "@ant-design/icons";
import React from "react";

/**
 * Render Ant Design icon by name
 */
export const renderIcon = (iconName?: string): React.ReactNode => {
  if (!iconName) return null;
  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? React.createElement(IconComponent) : null;
};

