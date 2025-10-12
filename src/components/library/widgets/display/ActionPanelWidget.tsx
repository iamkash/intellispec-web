import React from 'react';
import { Tooltip } from 'antd';
// Note: Using CSS variables directly instead of useTheme for better compatibility
import * as Icons from '@ant-design/icons';

export interface ActionPanelWidgetProps {
  title?: string;
  actions: Array<{
    title: string;
    description?: string;
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error';
    onClick?: () => void;
  }>;
}

const ActionPanelWidget: React.FC<ActionPanelWidgetProps> = ({ title, actions = [] }) => {
  // Note: theme context available but using CSS variables directly for compatibility
  
  // Safety check for actions
  const safeActions = Array.isArray(actions) ? actions : [];
  
  // Get icon component from string name
  const getIconComponent = (iconName: string) => {
    if (typeof iconName === 'string' && (Icons as any)[iconName]) {
      const IconComponent = (Icons as any)[iconName];
      return <IconComponent style={{ fontSize: '20px' }} />;
    }
    return iconName;
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: '100%',
      height: '100%'
    }}>
      {safeActions.map((action, index) => (
        <Tooltip key={index} title={action.description || action.title} placement="bottom">
          <div
            onClick={action.onClick}
            style={{
              width: '120px',
              height: '96px',
              borderRadius: '12px',
              background: 'hsl(var(--card))',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsl(var(--border))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 8px hsl(var(--shadow) / 0.08)',
              padding: '8px'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateY(-2px) scale(1.03)';
              target.style.boxShadow = '0 4px 12px hsl(var(--shadow) / 0.12)';
              target.style.background = 'hsl(var(--card) / 0.8)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'translateY(0) scale(1)';
              target.style.boxShadow = '0 2px 8px hsl(var(--shadow) / 0.08)';
              target.style.background = 'hsl(var(--card))';
            }}
          >
            {/* Icon */}
            <div style={{ 
              color: 'hsl(var(--foreground))',
              marginBottom: '6px',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {typeof action.icon === 'string' ? getIconComponent(action.icon) : action.icon}
            </div>
            
            {/* Title */}
            <div style={{ 
              color: 'hsl(var(--foreground))',
              fontSize: '11px',
              fontWeight: '500',
              textAlign: 'center',
              lineHeight: '1.2',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              maxWidth: '104px',
              opacity: 0.9,
              wordWrap: 'break-word',
              hyphens: 'auto'
            }}>
              {action.title}
            </div>
            
            {/* Glassmorphism effect overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, transparent 30%, hsl(var(--foreground) / 0.1) 50%, transparent 70%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none'
            }} />
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

export default ActionPanelWidget; 