import React from 'react';
import { Button } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

export interface AnalysisHeroProps {
  title?: string;
  subtitle?: string;
  onAnalyze: () => void;
  analyzing?: boolean;
  onAutoFill?: () => void;
}

export const AnalysisHero: React.FC<AnalysisHeroProps> = React.memo(({ title, subtitle, onAnalyze, analyzing, onAutoFill }) => (
  <div className="analysis-hero" role="region" aria-label={title || 'AI Analysis'}>
    <div className="analysis-hero__content">
      <div className="analysis-hero__title">{title || 'AI Analysis'}</div>
      {subtitle && <div className="analysis-hero__subtitle">{subtitle}</div>}
    </div>
    <div className="analysis-hero__cta">
      <Button type="primary" size="large" icon={<RobotOutlined />} onClick={onAnalyze} loading={!!analyzing} disabled={!!analyzing} aria-label="Analyze">
        Analyze Images
      </Button>
      {onAutoFill && (
        <Button style={{ marginLeft: 8 }} size="large" onClick={onAutoFill} aria-label="Auto-fill">
          Auto-Fill Form
        </Button>
      )}
    </div>
  </div>
));

AnalysisHero.displayName = 'AnalysisHero';


