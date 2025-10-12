import React from 'react';
import { Card } from 'antd';

export interface OverviewCardProps {
  title: string;
  text?: string | string[];
}

export const OverviewCard: React.FC<OverviewCardProps> = React.memo(({ title, text }) => {
  if (!text) return null;
  const content = Array.isArray(text) ? text.join('\n\n') : text;
  return (
    <Card size="small" title={title}>
      <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{content}</div>
    </Card>
  );
});

OverviewCard.displayName = 'OverviewCard';


