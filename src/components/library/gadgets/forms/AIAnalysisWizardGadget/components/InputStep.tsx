import { Button, Card, Col, Form, Input, Row, Select, Space } from 'antd';
import React from 'react';
import { getOpenAIConfig } from '../../../../../../utils/config';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';

// Lazy-load heavy widgets to reduce initial bundle size
const VoiceRecorderWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.VoiceRecorderWidget })));
const ImageUploadWithDrawingWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.ImageUploadWithDrawingWidget })));

const { Option } = Select;
const { TextArea } = Input;

interface InputStepProps {
  config: AIAnalysisWizardConfig;
  wizardData: AIAnalysisWizardData;
  handleDataUpdate: (data: Partial<AIAnalysisWizardData>) => void;
  handleStepComplete: () => void;
}

export const InputStep: React.FC<InputStepProps> = ({
  config,
  wizardData,
  handleDataUpdate,
  handleStepComplete
}) => {
  return (
    <Card className="glass-card wizard-card" title={<span style={{ color: 'hsl(var(--foreground))' }}>{config.steps.input?.title}</span>}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Form.Item label={<span style={{ color: 'hsl(var(--foreground))' }}>{config.typeLabel || 'Inspection Type'}</span>} required>
          <Select 
            placeholder={config.typePlaceholder || 'Select inspection type'} 
            value={wizardData.inspectionType} 
            onChange={(value) => handleDataUpdate({ inspectionType: value })} 
            style={{ width: '100%' }}
          >
            {config.steps.input?.inspectionTypes?.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Row gutter={[16, 16]}>
          {config.steps.input?.voice?.enabled && (
            <Col xs={24} md={12}>
              <Card className="glass-subcard" title={<span style={{ color: 'hsl(var(--foreground))' }}>Voice Recording</span>} size="small" style={{ height: '280px' }}>
                <div style={{ height: '200px', overflow: 'auto', padding: 'var(--spacing-2)' }}>
                  <VoiceRecorderWidget 
                    id="voice-recorder" 
                    maxDuration={config.steps.input?.voice?.maxDuration as number} 
                    showVisualization={Boolean(config.steps.input?.voice?.showVisualization)} 
                    openaiConfig={getOpenAIConfig()} 
                    autoTranscribe={true} 
                    value={wizardData.voiceData} 
                    onChange={(value) => handleDataUpdate({ voiceData: value })} 
                  />
                </div>
              </Card>
            </Col>
          )}
          
          {config.steps.input?.text?.enabled && (
            <Col xs={24} md={12}>
              <Card className="glass-subcard" title={<span style={{ color: 'hsl(var(--foreground))' }}>Text Notes</span>} size="small" style={{ height: '280px' }}>
                <div style={{ height: '200px', display: 'flex', flexDirection: 'column', padding: 'var(--spacing-2)' }}>
                  <TextArea 
                    placeholder={config.steps.input?.text?.placeholder} 
                    value={wizardData.textData} 
                    onChange={(e) => handleDataUpdate({ textData: e.target.value })} 
                    rows={8} 
                    maxLength={config.steps.input?.text?.maxLength} 
                    showCount 
                    style={{ flex: 1, resize: 'none' }} 
                  />
                </div>
              </Card>
            </Col>
          )}
        </Row>
        
        {config.steps.input?.images?.enabled && (
          <Card className="glass-subcard" title={<span style={{ color: 'hsl(var(--foreground))' }}>Image Upload</span>} size="small">
            <React.Suspense fallback={null}>
              <ImageUploadWithDrawingWidget 
                id="image-upload" 
                maxCount={config.steps.input?.images?.maxCount as number} 
                maxSize={config.steps.input?.images?.maxSize as number} 
                drawingEnabled={Boolean(config.steps.input?.images?.drawingEnabled)} 
                drawingTools={config.steps.input?.images?.drawingTools as any} 
                value={wizardData.imageData} 
                onChange={(value) => handleDataUpdate({ imageData: value })} 
              />
            </React.Suspense>
          </Card>
        )}
        
        <Space>
          <Button 
            type="primary" 
            onClick={handleStepComplete} 
            disabled={Boolean(config.steps.input) && (!wizardData.inspectionType)} 
            style={{ backgroundColor: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            Next
          </Button>
        </Space>
      </Space>
    </Card>
  );
};
