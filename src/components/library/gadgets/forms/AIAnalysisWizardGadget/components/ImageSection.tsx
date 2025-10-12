import { Card } from 'antd';
import React from 'react';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';

// Lazy-load heavy widgets to reduce initial bundle size
const ImageUploadWithDrawingWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.ImageUploadWithDrawingWidget })));

interface ImageSectionProps {
  section: any;
  sectionIndex: number;
  wizardData: AIAnalysisWizardData;
  updateSectionData: (sectionIndex: number, update: any) => void;
  config: AIAnalysisWizardConfig;
}

export const ImageSection: React.FC<ImageSectionProps> = ({
  section,
  sectionIndex,
  wizardData,
  updateSectionData,
  config
}) => {
  const imagesCollapsed = Boolean(((wizardData.sections || [])[sectionIndex] as any)?.imagesCollapsed);
  
  if ((section as any).sectionType !== 'image' || imagesCollapsed) {
    return null;
  }

  const data = (wizardData.sections || [])[sectionIndex] || {};

  // Only log once per section to prevent infinite loops
  if (!(window as any).__loggedImageSections) (window as any).__loggedImageSections = new Set();
  const logKey = `${section.id}-${sectionIndex}-${(data as any)?.images?.length || 0}`;
  if (!(window as any).__loggedImageSections.has(logKey)) {
    (window as any).__loggedImageSections.add(logKey);
    console.log(`[ImageSection] Rendering for section ${section.id}:`, {
      sectionIndex,
      hasData: !!data,
      hasImages: !!(data as any)?.images,
      imagesCount: (data as any)?.images?.length || 0,
      imagesCollapsed,
      willRenderWidget: !imagesCollapsed && (section as any).sectionType === 'image'
    });
  }

  return (
    <Card className="glass-subcard" size="small" title={<span>Images</span>} headStyle={{ padding: '6px 10px' }} bodyStyle={{ padding: 8 }}>
      <ImageUploadWithDrawingWidget 
        id={`images-${sectionIndex}`} 
        maxCount={section.images?.maxCount ?? config.steps.input?.images?.maxCount} 
        maxSize={section.images?.maxSize ?? config.steps.input?.images?.maxSize} 
        drawingEnabled={section.images?.drawingEnabled ?? config.steps.input?.images?.drawingEnabled} 
        drawingTools={section.images?.drawingTools ?? config.steps.input?.images?.drawingTools} 
        value={(data as any).images as any} 
        onChange={(value) => updateSectionData(sectionIndex, { images: value as any })} 
      />
    </Card>
  );
};
