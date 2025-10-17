import * as AntIcons from '@ant-design/icons';
import React from 'react';

// Map business/common icon names to Ant Design icon names
const iconNameMap: Record<string, string> = {
  // Business terms to Ant Design icon names
  AuditOutlined: 'FileSearchOutlined', // No AuditOutlined in AntD
  ComplianceOutlined: 'SafetyCertificateOutlined',
  HeaderOutlined: 'ProfileOutlined',
  InfoOutlined: 'InfoCircleOutlined',
  DocumentOutlined: 'FileTextOutlined',
  SectionOutlined: 'FormOutlined',
  // Add the specific icons from the metadata
  SolutionOutlined: 'SolutionOutlined', // This exists in AntD
  TeamOutlined: 'TeamOutlined', // This exists in AntD
  SafetyOutlined: 'SafetyOutlined', // This exists in AntD
  BarChartOutlined: 'BarChartOutlined', // This exists in AntD
  // API 510 specific icons
  DatabaseOutlined: 'DatabaseOutlined', // This exists in AntD
  CalendarOutlined: 'CalendarOutlined', // This exists in AntD
  GaugeOutlined: 'DashboardOutlined', // Map to DashboardOutlined
  EyeOutlined: 'EyeOutlined', // This exists in AntD
  RulerOutlined: 'ColumnWidthOutlined', // Map to ColumnWidthOutlined
  ScanOutlined: 'ScanOutlined', // This exists in AntD
  ToolOutlined: 'ToolOutlined', // This exists in AntD
  CheckCircleOutlined: 'CheckCircleOutlined', // This exists in AntD
  BuildOutlined: 'BuildOutlined', // This exists in AntD
};

function createIconElement(iconName: string): React.ReactNode {
  try {
    const IconComponent = (AntIcons as any)[iconName];
    // Check if it's a valid React component (function or forwardRef)
    if (IconComponent && (typeof IconComponent === 'function' || IconComponent.$$typeof)) {
      // Use React.createElement with proper props
      return React.createElement(IconComponent, {});
    }
    return React.createElement(AntIcons.FormOutlined, {});
  } catch (error) {
    return React.createElement(AntIcons.FormOutlined, {});
  }
}

/**
 * Get section icon dynamically
 */
export const getSectionIcon = (sectionId: string, sections: Record<string, any>): React.ReactNode => {
  const section = sections[sectionId];
  if (section && section.icon) {
    let iconName = section.icon;
    // Map business/common names to AntD icon names
    if (iconNameMap[iconName]) {
      iconName = iconNameMap[iconName];
    }
    if (typeof iconName === 'string') {
      const IconComponent = (AntIcons as any)[iconName];
      
      if (IconComponent && (typeof IconComponent === 'function' || IconComponent.$$typeof)) {
        return createIconElement(iconName);
      } else {
        // Return a safe fallback icon
        return React.createElement(AntIcons.FormOutlined, {});
      }
    }
    // If icon is not a string, return fallback
    return React.createElement(AntIcons.FormOutlined, {});
  }
  return React.createElement(AntIcons.FormOutlined, {});
};

/**
 * Get group icon dynamically
 */
export const getGroupIcon = (groupId: string, groups: Record<string, any>): React.ReactNode => {
  const group = groups[groupId];
  if (group && group.icon) {
    let iconName = group.icon;
    if (iconNameMap[iconName]) {
      iconName = iconNameMap[iconName];
    }
    if (typeof iconName === 'string') {
      const IconComponent = (AntIcons as any)[iconName];
      
      if (IconComponent && (typeof IconComponent === 'function' || IconComponent.$$typeof)) {
        return createIconElement(iconName);
      } else {
        // Return a safe fallback icon
        return React.createElement(AntIcons.FormOutlined, {});
      }
    }
    // If icon is not a string, return fallback
    return React.createElement(AntIcons.FormOutlined, {});
  }
  return React.createElement(AntIcons.FormOutlined, {});
}; 
