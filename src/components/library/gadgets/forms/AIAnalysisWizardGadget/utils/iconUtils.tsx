import React from 'react';
import {
  AlertOutlined,
  AudioOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FormOutlined,
  PaperClipOutlined,
  ProfileOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import type { AIAnalysisWizardConfig } from '../AIAnalysisWizardGadget.types';

/**
 * Get appropriate icon for a section based on its type and ID
 */
export const getIconForSection = (s: any): React.ReactNode => {
  const id = String((s?.id || '')).toLowerCase();
  const type = String((s?.sectionType || '')).toLowerCase();
  const size = { fontSize: '16px' } as const;
  
  if (type === 'voice' || id.includes('voice')) return <AudioOutlined style={size} />;
  if (type === 'image' || id.includes('image') || id.includes('nameplate')) return <FileImageOutlined style={size} />;
  if (id.includes('analysis')) return <SearchOutlined style={size} />;
  if (id.includes('general') || id.includes('information')) return <ProfileOutlined style={size} />;
  if (id.includes('scope') || id.includes('method')) return <ReadOutlined style={size} />;
  if (id.includes('nde')) return <ExperimentOutlined style={size} />;
  if (id.includes('condition') || id.includes('assessment')) return <AlertOutlined style={size} />;
  if (id.includes('thickness') || id.includes('measurement')) return <DashboardOutlined style={size} />;
  if (id.includes('evaluation') || id.includes('compliance')) return <SafetyCertificateOutlined style={size} />;
  if (id.includes('recommend')) return <BulbOutlined style={size} />;
  if (id.includes('attachment')) return <PaperClipOutlined style={size} />;
  if (id.includes('signoff') || id.includes('sign-off') || id.includes('sign')) return <CheckCircleOutlined style={size} />;
  
  return <FormOutlined style={size} />;
};

/**
 * Generate step items for wizard navigation
 */
export const getStepItems = (config: AIAnalysisWizardConfig, visibleSections: any[]) => {
  const items = [] as Array<{ title: string; description?: string; icon: React.ReactNode }>;
  
  if (config.steps.input) {
    items.push({ 
      title: config.steps.input.title, 
      description: config.steps.input.description, 
      icon: <SolutionOutlined style={{ fontSize: '16px' }} /> 
    });
  }
  
  items.push(...visibleSections.map((s) => ({ 
    title: s.title, 
    description: s.description, 
    icon: getIconForSection(s) 
  })));
  
  items.push({ 
    title: config.steps.pdf.title, 
    description: config.steps.pdf.description, 
    icon: <FileMarkdownOutlined style={{ fontSize: '16px' }} /> 
  });
  
  return items;
};
