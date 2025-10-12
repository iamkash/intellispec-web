import { FormOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { AIAnalysisWizardGadget } from '../AIAnalysisWizardGadget';

interface WizardFooterProps {
  gadget: AIAnalysisWizardGadget;
  currentStep: number;
  totalSteps: number;
  isAtLast: boolean;
  goPrev: () => void;
  handleStepComplete: () => void;
  wizardData?: any; // Add wizardData prop to use local React state
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  gadget,
  currentStep,
  totalSteps,
  isAtLast,
  goPrev,
  handleStepComplete,
  wizardData: localWizardData
}) => {
  // Use local wizardData if provided, otherwise fall back to gadget
  const wizardData = localWizardData || gadget.getWizardData();
  
  // Calculate progress using the same data source as the sidebar
  const completedCount = wizardData.completedSteps?.length || 0;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  
  
  return (
    <div className="wizard-footer">
      <div className="wizard-footer-left">
        <span className="progress-indicator">
          {Math.round(progress)}% Complete
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: 'hsl(var(--muted-foreground))',
          marginLeft: '8px'
        }}>
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <div className="wizard-footer-actions">
        <Button
          onClick={goPrev}
          disabled={currentStep === 0}
          style={{
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))'
          }}
        >
          ← Back
        </Button>
        <Button
          type="primary"
          onClick={() => {
            console.log('[WizardFooter] Continue button clicked');
            handleStepComplete();
          }}
          style={{
            fontWeight: 600,
            padding: '6px 24px'
          }}
        >
          {isAtLast ? (
            <>
              <FormOutlined style={{ marginRight: '8px' }} />
              Complete Inspection
            </>
          ) : (
            <>
              Continue →
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
