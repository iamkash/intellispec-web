import { CloseOutlined, CompressOutlined, ExpandOutlined, FileMarkdownOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';
import type { AIAnalysisWizardConfig } from '../AIAnalysisWizardGadget.types';

interface WizardHeaderProps {
  config: AIAnalysisWizardConfig;
  currentStep: number;
  totalSteps: number;
  isFullscreen?: boolean;
  onClose?: () => void;
  onToggleFullscreen?: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  config,
  currentStep,
  totalSteps,
  isFullscreen = false,
  onClose,
  onToggleFullscreen
}) => {
  return (
    <div className="wizard-header">
      <div>
        <h1 className="wizard-header__title">
          <FileMarkdownOutlined style={{ fontSize: '1.25rem' }} />
          {config.title || 'AI Inspection Assistant'}
        </h1>
        <p className="wizard-header__subtitle">
          {config.description || 'Intelligent inspection workflow with AI-powered analysis and documentation'}
        </p>
      </div>
      <div className="wizard-header__actions">
        <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
          Step {currentStep + 1} of {totalSteps}
        </span>
        <div className="wizard-header__buttons">
          {onToggleFullscreen && (
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
              <Button
                type="text"
                size="small"
                icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={onToggleFullscreen}
                className="wizard-header__button"
              />
            </Tooltip>
          )}
          {onClose && (
            <Tooltip title="Close Wizard">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClose}
                className="wizard-header__button wizard-header__close-button"
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
