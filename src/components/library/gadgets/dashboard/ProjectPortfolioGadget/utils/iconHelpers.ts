/**
 * Icon Helper Utilities
 * Generic functions for rendering Ant Design icons from metadata
 * All styling is done via CSS - no inline styles
 */

import * as Icons from "@ant-design/icons";
import React from "react";

/**
 * Renders an Ant Design icon component from icon name string
 * @param iconName - Name of the icon (e.g., "ProjectOutlined")
 * @returns React element or null if icon not found
 */
export const renderIcon = (
  iconName: string | undefined | null
): React.ReactElement | null => {
  if (!iconName) return null;

  try {
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) return null;

    return React.createElement(IconComponent);
  } catch {
    return null;
  }
};

/**
 * Validates if an icon name exists in Ant Design Icons
 * @param iconName - Name of the icon to validate
 * @returns true if icon exists, false otherwise
 */
export const isValidIcon = (iconName: string): boolean => {
  try {
    return !!(Icons as any)[iconName];
  } catch {
    return false;
  }
};

