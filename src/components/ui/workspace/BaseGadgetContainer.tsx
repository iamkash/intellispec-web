/**
 * BaseGadgetContainer - Consistent container for all gadgets
 * 
 * Provides standardized structure with:
 * - Gadget header (title, actions, status indicators)
 * - Gadget body (main content area)
 * - Gadget footer (optional metadata, timestamps, etc.)
 * - Consistent glassmorphism styling
 */

import { FullscreenOutlined, MoreOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Typography } from 'antd';
import React from 'react';
// Note: Using CSS variables directly instead of useTheme for better compatibility

const { Text } = Typography;

export interface BaseGadgetContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string;
  lastUpdated?: string;
  refreshable?: boolean;
  configurable?: boolean;
  expandable?: boolean;
  onRefresh?: () => void;
  onConfigure?: () => void;
  onExpand?: () => void;
  className?: string;
  style?: React.CSSProperties;
  headerActions?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  status?: 'normal' | 'warning' | 'error' | 'success';
  noPadding?: boolean;
}

export const BaseGadgetContainer: React.FC<BaseGadgetContainerProps> = ({
  title,
  subtitle,
  children,
  footer,
  loading = false,
  error,
  lastUpdated,
  refreshable = false,
  configurable = false,
  expandable = false,
  onRefresh,
  onConfigure,
  onExpand,
  className = '',
  style = {},
  headerActions,
  size = 'medium',
  status = 'normal',
  noPadding = false
}) => {
  // Note: theme context available but using CSS variables directly for compatibility

  const getStatusColor = () => {
    switch (status) {
      case 'warning': return 'hsl(var(--warning))';
      case 'error': return 'hsl(var(--destructive))';
      case 'success': return 'hsl(var(--success))';
      default: return 'transparent';
    }
  };

  // Removed getSizePadding function - now using inline size-based padding for better control

  // Check if this is a minimal/hidden wrapper mode
  const isMinimalMode = !title && !subtitle && !headerActions && !footer && !lastUpdated && noPadding;

  const cardStyle: React.CSSProperties = {
    height: '100%', // Fixed height to prevent overflow
    background: isMinimalMode ? 'transparent' : 'hsl(var(--card))',
    backdropFilter: isMinimalMode ? 'none' : 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: isMinimalMode ? 'none' : 'blur(20px) saturate(180%)',
    borderRadius: isMinimalMode ? '0' : 'var(--radius)',
    border: isMinimalMode ? 'none' : '1px solid hsl(var(--border))',
    borderLeftColor: isMinimalMode ? 'transparent' : getStatusColor(),
    borderLeftWidth: isMinimalMode ? '0' : (status !== 'normal' ? '4px' : '1px'),
    boxShadow: isMinimalMode ? 'none' : '0 8px 32px hsl(var(--shadow) / 0.15)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden', // Prevent content from overflowing the card
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    ...style
  };

  const headerStyle: React.CSSProperties = {
    padding: size === 'small' ? '8px 12px 0 12px' : size === 'large' ? '12px 16px 0 16px' : '10px 14px 0 14px',
    borderBottom: title || subtitle || headerActions ? '1px solid hsl(var(--border))' : 'none',
    background: 'hsl(var(--muted) / 0.3)',
    minHeight: title || subtitle || headerActions ? 'auto' : '0',
    display: title || subtitle || headerActions ? 'block' : 'none',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  };

  const bodyStyle: React.CSSProperties = {
    padding: noPadding ? 0 : (size === 'small' ? '12px' : size === 'large' ? '24px' : '20px'),
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto', // Allow scrolling within gadget if needed
    background: 'transparent',
    minHeight: 0 // Allow flex item to shrink
  };

  const footerStyle: React.CSSProperties = {
    padding: size === 'small' ? '6px 8px' : size === 'large' ? '10px 16px' : '8px 12px',
    borderTop: footer || lastUpdated ? '1px solid hsl(var(--border))' : 'none',
    background: 'hsl(var(--muted) / 0.2)',
    display: footer || lastUpdated ? 'block' : 'none',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  };

  const actionItems = [
    refreshable && onRefresh && {
      key: 'refresh',
      label: 'Refresh',
      icon: <ReloadOutlined />,
      onClick: onRefresh
    },
    configurable && onConfigure && {
      key: 'configure',
      label: 'Configure',
      icon: <SettingOutlined />,
      onClick: onConfigure
    },
    expandable && onExpand && {
      key: 'expand',
      label: 'Expand',
      icon: <FullscreenOutlined />,
      onClick: onExpand
    }
  ].filter((item): item is { key: string; label: string; icon: React.ReactElement; onClick: () => void } => Boolean(item));

  const renderHeader = () => {
    if (!title && !subtitle && !headerActions) return null;

    return (
      <div style={headerStyle}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div style={{
                fontSize: size === 'small' ? '13px' : size === 'large' ? '16px' : '14px',
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                marginBottom: subtitle ? '2px' : '0',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {title}
              </div>
            )}
            {subtitle && (
              <Text style={{
                fontSize: size === 'small' ? '10px' : '11px',
                color: 'hsl(var(--muted-foreground))',
                opacity: 0.7,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {subtitle}
              </Text>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {headerActions}
            {actionItems.length > 0 && (
              <Dropdown
                menu={{ items: actionItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  size="small"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    border: 'none',
                    background: 'hsl(var(--accent))',
                    borderRadius: 'var(--radius)',
                    padding: '2px 6px',
                    fontSize: '10px'
                  }}
                />
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBody = () => {
    if (error) {
      return (
        <div style={{
          ...bodyStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--destructive))',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>Error</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>{error}</div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div style={{
          ...bodyStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--muted-foreground))'
        }}>
          <div>Loading...</div>
        </div>
      );
    }

    return (
      <div style={bodyStyle}>
        {children}
      </div>
    );
  };

  const renderFooter = () => {
    if (!footer && !lastUpdated) return null;

    return (
      <div style={footerStyle}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '8px'
        }}>
        {footer && (
            <div style={{ flex: 1, minWidth: 0 }}>
            {footer}
          </div>
        )}
        {lastUpdated && (
          <Text style={{
              fontSize: '9px',
                                color: 'hsl(var(--muted-foreground))',
              opacity: 0.5,
              flexShrink: 0
          }}>
              {lastUpdated}
          </Text>
        )}
        </div>
      </div>
    );
  };

  // In minimal mode, render content directly without Card wrapper
  if (isMinimalMode) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {renderBody()}
      </div>
    );
  }

  return (
    <Card
      style={cardStyle}
      className={`base-gadget-container liquid-glass ${className}`}
      styles={{ 
        body: {
          padding: 0, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden' // Prevent content from overflowing
        }
      }}
    >
      {renderHeader()}
      {renderBody()}
      {renderFooter()}
    </Card>
  );
};

export default BaseGadgetContainer; 