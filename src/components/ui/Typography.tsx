import React from 'react';
import { Typography as AntTypography } from 'antd';
import { typography } from '../../theme';

const { Title: AntTitle, Text: AntText, Paragraph: AntParagraph } = AntTypography;

// Enhanced Title component with accent font support
export interface TitleProps {
  level?: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
  useAccentFont?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Title: React.FC<TitleProps> = ({ 
  level = 1, 
  children, 
  useAccentFont = true,
  style,
  className 
}) => {
  const fontFamily = useAccentFont ? typography.fontFamily.accent : typography.fontFamily.primary;
  
  return (
    <AntTitle 
      level={level} 
      style={{ 
        fontFamily,
        fontWeight: 600,
        margin: 0,
        ...style 
      }}
      className={className}
    >
      {children}
    </AntTitle>
  );
};

// Enhanced Text component
export interface TextProps {
  children: React.ReactNode;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  delete?: boolean;
  code?: boolean;
  mark?: boolean;
  keyboard?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Text: React.FC<TextProps> = ({ 
  children, 
  style,
  className,
  ...props 
}) => {
  return (
    <AntText 
      style={{ 
        fontFamily: typography.fontFamily.primary,
        ...style 
      }}
      className={className}
      {...props}
    >
      {children}
    </AntText>
  );
};

// Enhanced Paragraph component
export interface ParagraphProps {
  children: React.ReactNode;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  delete?: boolean;
  code?: boolean;
  mark?: boolean;
  keyboard?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Paragraph: React.FC<ParagraphProps> = ({ 
  children, 
  style,
  className,
  ...props 
}) => {
  return (
    <AntParagraph 
      style={{ 
        fontFamily: typography.fontFamily.primary,
        lineHeight: 1.6,
        ...style 
      }}
      className={className}
      {...props}
    >
      {children}
    </AntParagraph>
  );
};

// Export the original Ant Design components for backward compatibility
export { AntTypography as Typography }; 
