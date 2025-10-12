/**
 * FormStepWidget - Multi-step form navigation
 * 
 * A form organization widget that provides step-by-step navigation.
 * Supports progress tracking and validation per step.
 */

import React, { useState, useCallback } from 'react';
import { Steps, Button, Space, Card } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Step } = Steps;

export interface FormStep {
  title: string;
  content: React.ReactNode;
  description?: string;
  disabled?: boolean;
  status?: 'wait' | 'process' | 'finish' | 'error';
}

export interface FormStepWidgetProps {
  id: string;
  steps: FormStep[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  showNavigation?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FormStepWidget: React.FC<FormStepWidgetProps> = ({
  id,
  steps,
  currentStep = 0,
  onStepChange,
  showNavigation = true,
  disabled = false,
  className,
  style,
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);

  const handleStepChange = useCallback((step: number) => {
    if (!disabled && step >= 0 && step < steps.length) {
      setActiveStep(step);
      onStepChange?.(step);
    }
  }, [disabled, steps.length, onStepChange]);

  const handleNext = useCallback(() => {
    handleStepChange(activeStep + 1);
  }, [activeStep, handleStepChange]);

  const handlePrevious = useCallback(() => {
    handleStepChange(activeStep - 1);
  }, [activeStep, handleStepChange]);

  const currentStepData = steps[activeStep];

  return (
    <div className={className} style={style}>
      <Steps current={activeStep} size="small" style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step
            key={index}
            title={step.title}
            description={step.description}
            status={step.status}
            disabled={step.disabled || disabled}
            onClick={() => handleStepChange(index)}
          />
        ))}
      </Steps>

      <Card style={{ minHeight: 200 }}>
        {currentStepData?.content}
      </Card>

      {showNavigation && (
        <Space style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrevious}
            disabled={disabled || activeStep === 0}
          >
            Previous
          </Button>

          <Button
            type="primary"
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={disabled || activeStep === steps.length - 1}
          >
            Next
          </Button>
        </Space>
      )}
    </div>
  );
};

export default FormStepWidget; 