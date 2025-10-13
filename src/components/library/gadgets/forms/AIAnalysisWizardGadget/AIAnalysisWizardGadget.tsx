import React from 'react';
import { ValidationResult } from '../../../core/base';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from '../../base';
import './AIAnalysisWizardGadget.css';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from './AIAnalysisWizardGadget.types';
import { GenericWizardRenderer } from './components';

/**
 * AIAnalysisWizardGadget - A generic AI-powered inspection wizard
 * 
 * This is a metadata-driven wizard component that can be configured to handle
 * various types of inspections with AI assistance. The wizard supports:
 * - Voice recording and transcription
 * - Image upload with drawing annotations
 * - AI-powered image analysis
 * - Dynamic form generation
 * - PDF report generation
 * 
 * The component follows atomic design principles with the main logic broken down into:
 * - Custom hooks for state management and field options
 * - Atomic components for each step and section
 * - Utility functions for data processing
 * 
 * Configuration is entirely metadata-driven, allowing for flexible wizard creation
 * without code changes.
 */
export class AIAnalysisWizardGadget extends BaseGadget {
  private currentStep: number = 0;
  private completedSteps: number[] = [];
  private wizardData: AIAnalysisWizardData = { 
    currentStep: 0, 
    completedSteps: [], 
    sections: [], 
    voiceData: {}, 
    imageData: [], 
    analysisData: {} 
  };
  private config: AIAnalysisWizardConfig | null = null;
  private lastPropsHash: string = '';
  private persistedId: string | null = null;

  public metadata: GadgetMetadata = { 
    id: 'ai-analysis-wizard', 
    name: 'AI Analysis Wizard', 
    description: 'Generic AI-powered inspection wizard with metadata-driven configuration', 
    version: '1.0.0', 
    author: 'intelliSPEC Team', 
    category: 'forms', 
    tags: ['wizard','ai','inspection','voice','image','analysis','markdown','generic'], 
    gadgetType: GadgetType.FORM, 
    widgetTypes: ['voice-recorder-widget','image-upload-with-drawing-widget','ai-analysis-widget'] 
  };

  public schema: GadgetSchema = { 
    type: 'object', 
    properties: { 
      currentStep: { type: 'number', minimum: 0 }, 
      completedSteps: { type: 'array', items: { type: 'number' } }, 
      inspectionType: { type: 'string' }, 
      voiceData: { type: 'object' }, 
      textData: { type: 'string' }, 
      imageData: { type: 'array' }, 
      analysisData: { type: 'object' } 
    }, 
    required: ['currentStep','completedSteps'], 
    widgetSchemas: {} 
  };

  constructor() { 
    super(); 
    this.setState({ data: this.wizardData }); 
  }

  // Match DocumentFormGadget container behavior: remove base padding and allow full-height scroll
  public getContainerProps(props: any, context?: GadgetContext): any {
    const base = super.getContainerProps(props, context);
    return { ...base, noPadding: true };
  }

  private initializeConfig(props: any): void {
    const config = props.config || props.gadgetConfig || props;
    
    console.log('[AIAnalysisWizardGadget] Initializing config:', {
      hasConfig: !!config,
      hasSections: Array.isArray((config as any)?.sections),
      hasGroups: Array.isArray((config as any)?.groups),
      hasFields: Array.isArray((config as any)?.fields),
      sectionsCount: (config as any)?.sections?.length || 0,
      groupsCount: (config as any)?.groups?.length || 0,
      fieldsCount: (config as any)?.fields?.length || 0,
      hasSteps: !!(config as any)?.steps
    });
    
    // Strict: build steps only if metadata provides sections/groups/fields per inspection metadata
    if (config && Array.isArray((config as any).sections) && Array.isArray((config as any).groups) && Array.isArray((config as any).fields)) {
      console.log('[AIAnalysisWizardGadget] Building steps from flat structure...');
      const { buildStepsFromFlat } = require('./utils/steps');
      const built = buildStepsFromFlat(config as any);
      
      console.log('[AIAnalysisWizardGadget] Built steps result:', {
        hasBuiltSteps: !!built,
        builtSectionsCount: built?.sections?.length || 0,
        sampleBuiltSection: built?.sections?.[5] ? {
          id: built.sections[5].id,
          title: built.sections[5].title,
          hasForm: !!built.sections[5].form,
          formGroupsCount: built.sections[5].form?.groups?.length || 0,
          hasGrid: !!built.sections[5].grid
        } : null
      });
      
      this.config = { ...config, steps: built } as AIAnalysisWizardConfig;
    } else if (config && (config as any).steps) {
      console.log('[AIAnalysisWizardGadget] Using pre-built steps from config');
      this.config = { ...config } as AIAnalysisWizardConfig;
    } else {
      console.error('[AIAnalysisWizardGadget] No valid configuration found!');
    }
  }

  public getRequiredWidgets(): string[] { 
    return ['voice-recorder-widget','image-upload-with-drawing-widget','pdf-generator-widget']; 
  }

  public validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = []; 
    const warnings: string[] = [];
    
    if (!this.config) { 
      errors.push('Configuration is required'); 
      return { isValid: false, errors, warnings }; 
    }
    
    const hasSections = Array.isArray(this.config.steps.sections) && this.config.steps.sections.length > 0; 
    if (!hasSections) errors.push('At least one section must be defined');
    
    if (this.config.steps.input) { 
      const input = this.config.steps.input; 
      if (!Array.isArray(input.inspectionTypes) || input.inspectionTypes.length === 0) { 
        errors.push('Input step requires at least one inspection type'); 
      } 
    }
    
    if (!this.config.steps.pdf?.enabled) { 
      errors.push('PDF generation step must be enabled'); 
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  public getWidgetLayout(): any { 
    return { 
      type: 'grid', 
      columns: 1, 
      rows: 1, 
      widgets: [{ 
        id: 'ai-analysis-wizard-renderer', 
        type: 'ai-analysis-wizard-renderer', 
        position: { x: 0, y: 0, w: 1, h: 1 } 
      }] 
    }; 
  }

  public processDataFlow(data: any): any { 
    if (data.type === 'step_completed') { 
      this.completeCurrentStep(); 
    } else if (data.type === 'step_navigation') { 
      this.navigateToStep(data.stepIndex); 
    } else if (data.type === 'data_update') { 
      this.updateWizardData(data.data); 
    } 
    return this.wizardData; 
  }

  public getStepProgress(totalStepsOverride?: number): number { 
    // Allow override of total steps from renderer for consistency
    const sectionsCount = this.config?.steps?.sections?.length || (this.config as any)?.sections?.length || 0;
    const hasInputStep = this.config?.steps?.input || false;
    const calculatedTotal = sectionsCount + 1 + (hasInputStep ? 1 : 0);
    const totalSteps = totalStepsOverride || calculatedTotal; 
    
    if (totalSteps <= 0) return 0; 
    
    // CRITICAL FIX: Use the same completedSteps source as the sidebar tick marks
    // The sidebar uses wizardData.completedSteps, so we should too
    const wizardCompletedSteps = this.wizardData.completedSteps || [];
    const completedCount = wizardCompletedSteps.length;
    
    // Calculate progress based on completed steps (same as sidebar logic)
    const clamped = Math.min(completedCount, totalSteps); 
    
    
    return (clamped / totalSteps) * 100; 
  }

  public canNavigateToStep(stepIndex: number): boolean { 
                        return true;
  }

  public navigateToStep(stepIndex: number): void { 
    this.currentStep = stepIndex; 
    this.wizardData.currentStep = stepIndex; 
    this.setState({ data: this.wizardData }); 
  }

  public completeCurrentStep(): void { 
    if (!this.completedSteps.includes(this.currentStep)) { 
      this.completedSteps.push(this.currentStep); 
      this.wizardData.completedSteps = [...this.completedSteps]; 
    } 
    
    const totalSteps = (this.config?.steps.sections?.length || 0) + 1 + (this.config?.steps.input ? 1 : 0); 
    if (this.currentStep < totalSteps - 1) { 
      this.navigateToStep(this.currentStep + 1); 
    } 
    
    this.setState({ data: this.wizardData }); 
  }

  public updateWizardData(data: Partial<AIAnalysisWizardData>): void { 
    
    this.wizardData = { ...this.wizardData, ...data }; 
    
    // CRITICAL FIX: Sync internal state with updated wizard data
    if (data.currentStep !== undefined) {
      this.currentStep = data.currentStep;
    }
    if (data.completedSteps !== undefined) {
      this.completedSteps = [...data.completedSteps];
      console.log('[AIAnalysisWizardGadget] Synced completedSteps:', this.completedSteps);
    }
    
    
    this.setState({ data: this.wizardData }); 
  }

  public getWizardData(): AIAnalysisWizardData { 
    return this.wizardData; 
  }

  public getWizardState(totalStepsOverride?: number): any { 
      const sectionsCount = this.config?.steps?.sections?.length || (this.config as any)?.sections?.length || 0;
      const hasInputStep = this.config?.steps?.input || false;
      const calculatedTotal = sectionsCount + 1 + (hasInputStep ? 1 : 0);
      const totalSteps = totalStepsOverride || calculatedTotal;
      
      return {
      currentStep: this.currentStep, 
      completedSteps: this.completedSteps, 
      progress: this.getStepProgress(totalSteps), 
      canNavigate: true, 
      totalSteps: totalSteps,
      data: this.wizardData 
    }; 
  }

  public setPersistedId(id: string | null): void { 
    this.persistedId = id; 
  }

  public getPersistedId(): string | null { 
    return this.persistedId; 
  }

  public renderBody(props: any, context?: GadgetContext): React.ReactNode {
    const propsHash = JSON.stringify(props);
    if (!this.config || this.lastPropsHash !== propsHash) { 
      this.initializeConfig(props); 
      this.lastPropsHash = propsHash; 
    }
    
    if (!this.config) return <div>Configuration is required</div>;
    
    return <GenericWizardRenderer gadget={this} config={this.config} />;
  }
}

export default AIAnalysisWizardGadget;
