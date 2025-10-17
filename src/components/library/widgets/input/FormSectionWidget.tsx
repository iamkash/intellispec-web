/**
 * FormSectionWidget - Form section organizer
 * 
 * A form organization widget that groups related inputs into collapsible sections.
 * Supports headers, descriptions, and show/hide functionality.
 */

import React, { useState, useCallback } from 'react';
import { Card, Typography, Space } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface FormSectionWidgetProps {
  id: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FormSectionWidget: React.FC<FormSectionWidgetProps> = ({
  id,
  title,
  description,
  children,
  collapsible = true,
  defaultExpanded = true,
  disabled = false,
  className,
  style,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    if (!disabled && collapsible) {
      setExpanded(!expanded);
    }
  }, [expanded, disabled, collapsible]);

  return (
    <Card
      className={className}
      style={{
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        borderRadius: 0,
        ...style
      }}
      size="small"
      bodyStyle={{ padding: 0 }}
      title={
        title && (
          <Space
            style={{ 
              cursor: collapsible ? 'pointer' : 'default',
              color: 'hsl(var(--foreground))'
            }}
            onClick={toggleExpanded}
          >
            {collapsible && (
              expanded ? 
                <DownOutlined style={{ color: 'hsl(var(--primary))' }} /> : 
                <RightOutlined style={{ color: 'hsl(var(--muted-foreground))' }} />
            )}
            <Title level={5} style={{ 
              margin: 0, 
              color: 'hsl(var(--foreground))',
              fontWeight: 600
            }}>
              {title}
            </Title>
          </Space>
        )
      }
    >
      {description && (
        <div style={{ 
          marginBottom: 'var(--spacing-4)',
          padding: 'var(--spacing-2)',
          backgroundColor: 'hsl(var(--muted) / 0.1)',
          borderRadius: 'var(--radius)',
          border: 'none'
        }}>
          <Text style={{ 
            color: 'hsl(var(--muted-foreground))',
            fontSize: '14px',
            lineHeight: 1.5
          }}>
            {description}
          </Text>
        </div>
      )}
      
      {expanded && (
        <div style={{ opacity: disabled ? 0.5 : 1 }}>
          {children}
        </div>
      )}
    </Card>
  );
};

export default FormSectionWidget; 
