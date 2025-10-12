import { Card, Col, Input, Row } from 'antd';
import React from 'react';
import { getOpenAIConfig } from '../../../../../../utils/config';
import type { AIAnalysisWizardConfig } from '../AIAnalysisWizardGadget.types';

// Lazy-load heavy widgets to reduce initial bundle size
const VoiceRecorderWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.VoiceRecorderWidget })));

interface VoiceSectionProps {
  section: any;
  sectionIndex: number;
  data: any;
  updateSectionData: (sectionIndex: number, update: any) => void;
  config: AIAnalysisWizardConfig;
}

export const VoiceSection: React.FC<VoiceSectionProps> = ({
  section,
  sectionIndex,
  data,
  updateSectionData,
  config
}) => {
  if ((section as any).sectionType !== 'voice') {
    return null;
  }

  return (
    <Row gutter={[8, 8]}>
      <Col xs={24} md={12}>
        <Card className="glass-subcard" size="small" title={<span>Voice</span>} headStyle={{ padding: '6px 10px' }} bodyStyle={{ padding: 8 }}>
          <div style={{ height: 200, overflow: 'auto' }}>
            <VoiceRecorderWidget 
              id={`voice-${sectionIndex}`} 
              maxDuration={section.voice?.maxDuration ?? config.steps.input?.voice?.maxDuration} 
              showVisualization={section.voice?.showVisualization ?? config.steps.input?.voice?.showVisualization} 
              openaiConfig={getOpenAIConfig()} 
              autoTranscribe 
              value={(data as any).voiceData} 
              onChange={(value) => updateSectionData(sectionIndex, { voiceData: value, textData: value?.transcription })} 
            />
          </div>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card className="glass-subcard" size="small" title={<span>Notes</span>} headStyle={{ padding: '6px 10px' }} bodyStyle={{ padding: 8 }}>
          <Input.TextArea 
            placeholder={section.text?.placeholder || `Enter notes for ${section.title}`} 
            value={(data as any).textData} 
            onChange={(e) => updateSectionData(sectionIndex, { textData: e.target.value })} 
            rows={8} 
            maxLength={section.text?.maxLength || 6000} 
            showCount 
            style={{ resize: 'none' }} 
          />
        </Card>
      </Col>
    </Row>
  );
};
