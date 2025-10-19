/**
 * Group Header Component
 * Collapsible header for grouped card sections
 * Pure component - receives collapse handler from parent
 */

import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import React from "react";
import styles from "../PortfolioGadget.module.css";

const { Text } = Typography;

interface GroupHeaderProps {
  groupName: string;
  itemCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = React.memo(
  ({ groupName, itemCount, isCollapsed, onToggle }) => {
    return (
      <div className={styles.groupHeader} onClick={onToggle}>
        <div className={styles.groupHeaderLeft}>
          {isCollapsed ? <DownOutlined /> : <UpOutlined />}
          <Text className={styles.groupTitle}>{groupName}</Text>
        </div>
        <Text className={styles.groupCount}>{itemCount}</Text>
      </div>
    );
  }
);

GroupHeader.displayName = "GroupHeader";
