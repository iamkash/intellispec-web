/**
 * FormTabsWidget - Tabbed form sections
 * 
 * A form organization widget that provides tabbed interface for form sections.
 * Supports different tab types and validation indicators.
 */

import React, { useState, useCallback } from 'react';
import { Tabs, Badge } from 'antd';

const { TabPane } = Tabs;

export interface FormTab {
  key: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  closable?: boolean;
  icon?: React.ReactNode;
  badge?: number | string;
  forceRender?: boolean;
}

export interface FormTabsWidgetProps {
  id: string;
  tabs: FormTab[];
  activeTab?: string;
  onTabChange?: (activeKey: string) => void;
  onTabEdit?: (targetKey: string, action: 'add' | 'remove') => void;
  type?: 'line' | 'card' | 'editable-card';
  size?: 'small' | 'middle' | 'large';
  position?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FormTabsWidget: React.FC<FormTabsWidgetProps> = ({
  id,
  tabs,
  activeTab,
  onTabChange,
  onTabEdit,
  type = 'line',
  size = 'middle',
  position = 'top',
  disabled = false,
  className,
  style,
}) => {
  const [activeKey, setActiveKey] = useState(activeTab || tabs[0]?.key || '');

  const handleTabChange = useCallback((key: string) => {
    if (!disabled) {
      setActiveKey(key);
      onTabChange?.(key);
    }
  }, [disabled, onTabChange]);

  const handleTabEdit = useCallback((targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
    if (!disabled) {
      const key = typeof targetKey === 'string' ? targetKey : '';
      onTabEdit?.(key, action);
    }
  }, [disabled, onTabEdit]);

  const renderTabTitle = (tab: FormTab) => {
    const title = (
      <span>
        {tab.icon}
        {tab.title}
      </span>
    );

    if (tab.badge) {
      return (
        <Badge count={tab.badge} size="small">
          {title}
        </Badge>
      );
    }

    return title;
  };

  return (
    <Tabs
      className={className}
      style={style}
      activeKey={activeKey}
      onChange={handleTabChange}
      onEdit={handleTabEdit}
      type={type}
      size={size}
      tabPosition={position}
      animated={{ inkBar: true, tabPane: true }}
    >
      {tabs.map((tab) => (
        <TabPane
          key={tab.key}
          tab={renderTabTitle(tab)}
          disabled={tab.disabled || disabled}
          closable={tab.closable}
          forceRender={tab.forceRender}
        >
          <div style={{ padding: '16px 0' }}>
            {tab.content}
          </div>
        </TabPane>
      ))}
    </Tabs>
  );
};

export default FormTabsWidget; 