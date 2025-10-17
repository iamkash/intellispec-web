/**
 * AIAgenticWizardGadget - Generic Framework-Level AI Agentic Wizard
 *
 * A metadata-driven, framework-level gadget that can dynamically load and execute
 * any AI Agentic workflow based on metadata configuration files.
 *
 * Key Features:
 * - Dynamic metadata loading from inspection/ folder
 * - Support for any AI Agentic workflow pattern
 * - Reusable across all inspection types
 * - Framework-level abstraction for maximum reusability
 * - GPT Realtime API integration ready
 * - HITL (Human-in-the-Loop) support
 * - Work order generation capabilities
 *
 * Usage:
 * - Configure with metadata file path in inspection/ folder
 * - Automatically builds workflow from metadata
 * - Supports voice, image, form, and analysis steps
 * - Generates reports and work orders based on metadata
 */

import { CheckCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Progress, Space, Spin, Typography } from 'antd';
import React, { Suspense } from 'react';
import { ValidationResult } from '../../core/base';
import { WidgetRegistry } from '../../core/WidgetRegistry';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import './AIAgenticWizardGadget.css';


const { Text } = Typography;

const registerWidget = (
  type: string,
  loader: () => Promise<{ default: React.ComponentType<any> }>
) => {
  if (!WidgetRegistry.has(type)) {
    WidgetRegistry.registerAsync(type, loader);
  }
};

registerWidget('voice-recorder-widget', () =>
  import('../../widgets/input/VoiceRecorderWidget').then((m) => ({
    default: m.VoiceRecorderWidget,
  }))
);
registerWidget('realtime-voice-widget', () =>
  import('../../widgets/input/RealtimeVoiceWidget').then((m) => ({
    default: m.RealtimeVoiceWidget,
  }))
);
registerWidget('image-upload-with-drawing-widget', () =>
  import('../../widgets/input/ImageUploadWithDrawingWidget').then((m) => ({
    default: m.ImageUploadWithDrawingWidget,
  }))
);
registerWidget('vision-analysis-widget', () =>
  import('../../widgets/input/VisionAnalysisWidget').then((m) => ({
    default: m.VisionAnalysisWidget,
  }))
);
registerWidget('editable-grid-widget', () =>
  import('../../widgets/input/EditableGridWidget').then((m) => ({
    default: m.EditableGridWidget,
  }))
);
registerWidget('pdf-generator-widget', () =>
  import('../../widgets/input/PDFGeneratorWidget').then((m) => ({
    default: m.PDFGeneratorWidget,
  }))
);
registerWidget('input-field-widget', () =>
  import('../../widgets/input/InputFieldWidget').then((m) => ({
    default: m.InputFieldWidget,
  }))
);
registerWidget('text-area-widget', () =>
  import('../../widgets/input/TextAreaWidget').then((m) => ({
    default: m.TextAreaWidget,
  }))
);
registerWidget('auto-complete-widget', () =>
  import('../../widgets/input/AutoCompleteWidget').then((m) => ({
    default: m.AutoCompleteWidget,
  }))
);
registerWidget('observation-widget', () =>
  import('../../widgets/input/ObservationWidget')
);

// Types
export interface AIAgenticWizardData {
  currentStep: number;
  completedSteps: number[];
  metadata?: any;
  workflowState: Record<string, any>;
  sections: Array<{
    id: string;
    title: string;
    completed: boolean;
    data: Record<string, any>;
  }>;
}

export interface AIAgenticWizardConfig {
  enableRealtimeAI?: boolean;
  enableHITL?: boolean;
  enableWorkOrders?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  showProgress?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  sections?: Array<{
    id: string;
    title: string;
    description?: string;
    sectionType: string;
    order: number;
    includeInPdf?: boolean;
    maxImages?: number;
    imageType?: string;
    drawingEnabled?: boolean;
    aiAgent?: string;
    analysisPrompt?: string;
    voicePrompt?: string;
  }>;
}

export class AIAgenticWizardGadget extends BaseGadget {
  private currentStep: number = 0;
  private completedSteps: number[] = [];
  private wizardData: AIAgenticWizardData = {
    currentStep: 0,
    completedSteps: [],
    workflowState: {},
    sections: []
  };
  private config: AIAgenticWizardConfig | null = null;
  private loadedMetadata: any = null; // Loaded workflow metadata from JSON
  private lastPropsHash: string = '';

  public metadata: GadgetMetadata = {
    id: 'ai-agentic-wizard',
    name: 'AI Agentic Wizard',
    description: 'Generic framework-level AI Agentic wizard supporting any inspection workflow via metadata',
    version: '2.0.0',
    author: 'intelliSPEC Team',
    category: 'ai',
    tags: ['ai', 'agentic', 'wizard', 'framework', 'generic', 'inspection', 'realtime', 'hitl'],
    gadgetType: GadgetType.FORM,
    widgetTypes: [
      'voice-recorder-widget',
      'realtime-voice-widget',
      'image-upload-with-drawing-widget',
      'vision-analysis-widget',
      'editable-grid-widget',
      'pdf-generator-widget'
    ]
  };

  public schema: GadgetSchema = {
    type: 'object',
    properties: {
      currentStep: { type: 'number', minimum: 0 },
      completedSteps: { type: 'array', items: { type: 'number' } },
      workflowState: { type: 'object' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            sectionType: { type: 'string' },
            order: { type: 'number' },
            includeInPdf: { type: 'boolean' }
          }
        }
      }
    },
    required: ['currentStep', 'completedSteps'],
    widgetSchemas: {}
  };

  constructor() {
    super();
this.setState({ data: this.wizardData });
  }

  public getContainerProps(props: any, context?: GadgetContext): any {
    const base = super.getContainerProps(props, context);
    return { ...base, noPadding: true };
  }


  private initializeConfig(props: any): void {
    const config = props.config || props.gadgetConfig || props;
    if (config) {
      this.config = config as AIAgenticWizardConfig;
    }
  }

  public getRequiredWidgets(): string[] {
    return [
      'voice-recorder-widget',
      'image-upload-with-drawing-widget',
      'vision-analysis-widget',
      'editable-grid-widget',
      'pdf-generator-widget',
      'input-field-widget',
      'textarea-widget',
      'autocomplete-widget',
      'observation-widget'
    ];
  }

  public validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Cast to any to access sections property
    const wizardConfig = config as any;
    if (!wizardConfig?.sections || !Array.isArray(wizardConfig.sections) || wizardConfig.sections.length === 0) {
      errors.push('sections array is required in configuration');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  public getWidgetLayout(): any {
    return {
      type: 'grid',
      columns: 1,
      rows: 1,
      widgets: [{
        id: 'ai-agentic-wizard-renderer',
        type: 'ai-agentic-wizard-renderer',
        position: { x: 0, y: 0, w: 1, h: 1 }
      }]
    };
  }

  public processDataFlow(data: any): any {
    switch (data.type) {
      case 'step_completed':
        this.completeCurrentStep();
        break;
      case 'step_navigation':
        this.navigateToStep(data.stepIndex);
        break;
      case 'data_update':
        this.updateWizardData(data.data);
        break;
      case 'realtime_command':
        this.handleRealtimeCommand(data.command);
        break;
    }
    return this.wizardData;
  }

  private handleRealtimeCommand(command: string): void {
    // Handle GPT Realtime API commands
// Implementation for GPT Realtime API integration
  }

  public getStepProgress(): number {
    const sections = this.config?.sections;
    if (!sections) return 0;
    const totalSteps = sections.length;
    if (totalSteps <= 0) return 0;
    return (this.completedSteps.length / totalSteps) * 100;
  }

  public canNavigateToStep(stepIndex: number): boolean {
    return stepIndex >= 0 && stepIndex < (this.config?.sections?.length || 0);
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

    this.setState({ data: this.wizardData });
  }

  public updateWizardData(data: Partial<AIAgenticWizardData>): void {
    this.wizardData = { ...this.wizardData, ...data };
    this.setState({ data: this.wizardData });
  }

  /**
   * Merge external form data into the wizard workflow state.
   * This is used by automated flows (e.g. LangGraph agents) to hydrate
   * underlying form sections without forcing a full re-render cycle.
   */
  public mergeFormData(data: Record<string, any>): void {
    const currentWorkflowState = this.wizardData.workflowState || {};
    const mergedFormData = {
      ...(currentWorkflowState.formData || {}),
      ...data,
    };

    this.updateWizardData({
      workflowState: {
        ...currentWorkflowState,
        formData: mergedFormData,
      },
    });
  }

  public getWizardData(): AIAgenticWizardData {
    return this.wizardData;
  }

  public getWizardState(): any {
    return {
      currentStep: this.currentStep,
      completedSteps: this.completedSteps,
      progress: this.getStepProgress(),
      canNavigate: true,
      data: this.wizardData,
      metadata: this.metadata,
      sections: this.config?.sections
    };
  }

  public renderBody(props: any, context?: GadgetContext): React.ReactNode {
const propsHash = JSON.stringify(props);
    if (!this.config || this.lastPropsHash !== propsHash) {
      this.initializeConfig(props);
      this.lastPropsHash = propsHash;
    }

    if (!this.config) {
return (
        <Alert
          message="Configuration Required"
          description="AIAgenticWizard requires sections configuration"
          type="error"
          showIcon
        />
      );
    }
return <AIAgenticWizardRenderer gadget={this} config={this.config} />;
  }
}

// Renderer Component
interface AIAgenticWizardRendererProps {
  gadget: AIAgenticWizardGadget;
  config: AIAgenticWizardConfig;
}

const AIAgenticWizardRenderer: React.FC<AIAgenticWizardRendererProps> = ({ gadget, config }) => {
// Use React state to make the component reactive to gadget state changes
  const [currentStep, setCurrentStep] = React.useState(gadget.getWizardState().currentStep);
  const wizardState = gadget.getWizardState();
  const progress = gadget.getStepProgress();

  console.log('📊 [AIAgenticWizardRenderer] Current wizard state:', {
    currentStep: wizardState.currentStep,
    totalSections: wizardState.sections?.length || 0,
    progress: progress
  });

  // Update local state when gadget state changes
  React.useEffect(() => {
    const checkStateChange = () => {
      const newState = gadget.getWizardState();
      if (newState.currentStep !== currentStep) {
        setCurrentStep(newState.currentStep);
      }
    };

    // Poll for state changes
    const interval = setInterval(checkStateChange, 50); // Check every 50ms for faster response
    return () => clearInterval(interval);
  }, [gadget, currentStep]);

  return (
    <div className="ai-agentic-wizard">
      {/* Wizard Header - Full Width Above Everything */}
      <div className="wizard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center">
            <RobotOutlined style={{ fontSize: '24px', color: 'hsl(var(--primary))' }} />
            <div>
              <h2 className="wizard-title">AI-Powered Piping Inspection Wizard</h2>
              <div className="wizard-subtitle">Comprehensive piping inspection wizard with API 570 compliance, AI analysis, and automated work order generation</div>
            </div>
          </Space>
          {config.showProgress !== false && (
            <div style={{ minWidth: '200px' }}>
              <Progress
                percent={Math.round(progress)}
                status={progress === 100 ? 'success' : 'active'}
                strokeColor="hsl(var(--primary))"
                size="small"
              />
            </div>
          )}
        </div>
      </div>

      {/* Body Container - Contains Sidebar and Content */}
      <div className="wizard-body">
        {/* Wizard Sidebar */}
        <div className="wizard-sidebar" style={{ padding: '16px' }}>

          {/* Enhanced Progress Steps Indicator */}
          <div>
            <h4 style={{
              margin: '16px 0 12px 0',
              fontSize: '14px',
              color: 'hsl(var(--foreground))',
              fontWeight: '600'
            }}>
              Progress Steps
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.isArray(wizardState?.sections) &&
                wizardState.sections.map((section: any, index: number) => {
                  const isCompleted = wizardState.completedSteps.includes(index);
                  const isCurrent = wizardState.currentStep === index;
                  const isTodo = !isCompleted && !isCurrent;

                  return (
                    <div
                      key={section.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: isCurrent ? 'hsl(var(--primary) / 0.08)' :
                                      isCompleted ? 'hsl(var(--primary) / 0.03)' : 'hsl(var(--muted) / 0.3)',
                        border: isCurrent ? '2px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border))',
                        fontSize: '13px',
                        color: isCurrent ? 'hsl(var(--primary))' :
                             isCompleted ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        opacity: isTodo ? 0.7 : 1,
                        transform: isCurrent ? 'scale(1.01)' : 'scale(1)',
                        boxShadow: isCurrent ? '0 4px 12px hsl(var(--primary) / 0.15)' : 'none',
                        backdropFilter: isCurrent ? 'blur(1px)' : 'none'
                      }}
                      onClick={() => gadget.navigateToStep(index)}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 4px 16px hsl(var(--primary) / 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.transform = isCurrent ? 'scale(1.01)' : 'scale(1)';
                          e.currentTarget.style.boxShadow = isCurrent ? '0 4px 12px hsl(var(--primary) / 0.15)' : 'none';
                        }
                      }}
                      title={section.title}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Step Number/Icon */}
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: isCompleted ? 'hsl(var(--primary))' :
                                          isCurrent ? 'hsl(var(--primary))' :
                                          'hsl(var(--muted) / 0.8)',
                            color: isCompleted ? 'hsl(var(--background))' :
                                 isCurrent ? 'hsl(var(--background))' :
                                 'hsl(var(--muted-foreground))',
                            border: isCurrent ? '2px solid hsl(var(--primary) / 0.3)' :
                                   isTodo ? '1px solid hsl(var(--border))' : 'none',
                            boxShadow: isCurrent ? '0 2px 8px hsl(var(--primary) / 0.3)' : 'none',
                            transition: 'all 0.2s ease'
                          }}>
                            {isCompleted ? (
                              <CheckCircleOutlined style={{
                                fontSize: '12px',
                                color: 'hsl(var(--background))'
                              }} />
                            ) : (
                              index + 1
                            )}
                          </div>

                          {/* Step Title */}
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: isCurrent ? '600' : '500',
                              fontSize: '12px',
                              lineHeight: '1.2',
                              color: isCurrent ? 'hsl(var(--primary))' :
                                   isCompleted ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'
                            }}>
                              {section.title.length > 20 ? `${section.title.substring(0, 17)}...` : section.title}
                            </div>
                            {isCurrent && (
                              <div style={{
                                fontSize: '10px',
                                color: 'hsl(var(--primary) / 0.7)',
                                marginTop: '2px',
                                fontWeight: '500'
                              }}>
                                Current Step
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>

        {/* Wizard Content */}
        <div className="wizard-content">
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <Space direction="vertical" align="center">
                <Spin size="large" />
                <span>Loading workflow steps...</span>
              </Space>
            </div>
          }>
            <WorkflowStepsRenderer
              key={`step-${wizardState.currentStep}`}
              metadata={null}
              wizardState={wizardState}
              gadget={gadget}
              config={config}
            />
          </Suspense>
        </div>
      </div> {/* End wizard-body */}

      {/* Wizard Footer - Full Width */}
      <div className="wizard-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="progress-indicator" style={{ fontSize: '14px' }}>
              Step {wizardState.currentStep + 1} of {wizardState?.sections?.length || 0}
            </div>
            {/* Enhanced Mini Progress Steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {Array.isArray(wizardState?.sections) &&
                wizardState.sections.slice(0, 5).map((section: any, index: number) => {
                  const isCompleted = wizardState.completedSteps.includes(index);
                  const isCurrent = wizardState.currentStep === index;

                  return (
                    <div
                      key={section.id}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? 'hsl(var(--primary))' :
                                      isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        border: isCurrent ? '2px solid hsl(var(--primary) / 0.5)' : '1px solid hsl(var(--border))',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: isCurrent ? '0 0 6px hsl(var(--primary) / 0.4)' : 'none'
                      }}
                      title={`Step ${index + 1}: ${section.title}`}
                      onClick={() => gadget.navigateToStep(index)}
                    />
                  );
                })
              }
              {Array.isArray(wizardState?.sections) && wizardState.sections.length > 5 && (
                <div style={{
                  fontSize: '11px',
                  color: 'hsl(var(--muted-foreground))',
                  marginLeft: '2px',
                  fontWeight: '500'
                }}>
                  +{wizardState.sections.length - 5}
                </div>
              )}
            </div>
          </div>
          <Space>
            <Button
              disabled={!gadget.canNavigateToStep(wizardState.currentStep - 1)}
              onClick={() => gadget.navigateToStep(wizardState.currentStep - 1)}
            >
              Previous
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (wizardState.currentStep === (wizardState?.sections?.length - 1)) {
                  gadget.completeCurrentStep(); // Mark as completed on final step
                } else {
                  gadget.navigateToStep(wizardState.currentStep + 1); // Just navigate to next
                }
              }}
            >
              {wizardState.currentStep === (wizardState?.sections?.length - 1)
                ? 'Complete'
                : 'Next'
              }
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

// Workflow Steps Renderer
interface WorkflowStepsRendererProps {
  metadata?: any;
  wizardState: any;
  gadget: AIAgenticWizardGadget;
  config: AIAgenticWizardConfig;
}

const WorkflowStepsRenderer: React.FC<WorkflowStepsRendererProps> = ({
  metadata,
  wizardState,
  gadget,
  config
}) => {
  const sections = wizardState?.sections || [];

  if (!sections.length) {
    return (
      <Alert
        message="No Sections Found"
        description="The metadata file does not contain any workflow sections"
        type="warning"
        showIcon
      />
    );
  }

  const currentSection = sections[wizardState.currentStep];

  if (!currentSection) {
    return (
      <Alert
        message="Section Not Found"
        description={`Could not find section for step ${wizardState.currentStep}`}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="workflow-steps">
      <Card
        title={
          <Space>
            <span>Step {wizardState.currentStep + 1} of {sections.length}</span>
            {wizardState.completedSteps.includes(wizardState.currentStep) && (
              <CheckCircleOutlined style={{ color: 'hsl(var(--primary))' }} />
            )}
          </Space>
        }
        extra={
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>
            {currentSection.title}
          </span>
        }
      >
        <SectionRenderer
          section={currentSection}
          wizardState={wizardState}
          gadget={gadget}
          config={config}
        />
      </Card>
    </div>
  );
};

// Voice Widget Renderer Component
interface VoiceWidgetRendererProps {
  section: any;
  wizardState: any;
  gadget: AIAgenticWizardGadget;
  config: AIAgenticWizardConfig;
}

const VoiceWidgetRenderer: React.FC<VoiceWidgetRendererProps> = ({
  section,
  wizardState,
  gadget,
  config
}) => {
console.log('📋 [VoiceWidgetRenderer] Section config:', {
    widgetType: section.widgetType,
    sectionType: section.sectionType,
    hasAiConfig: !!section.aiConfig
  });

  const widgetType = section.widgetType || 'realtime-voice-widget';
// Check if widget is available in registry
  const WidgetComponent = WidgetRegistry.get(widgetType);
if (!WidgetComponent) {
    console.error('❌ [VoiceWidgetRenderer] Widget not found in registry:', widgetType);
    return (
      <div style={{ padding: '20px', backgroundColor: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive))', borderRadius: '6px' }}>
        <p style={{ color: 'hsl(var(--destructive))', margin: 0 }}>
          Widget type "{widgetType}" not found in registry
        </p>
      </div>
    );
  }

  // Prepare widget props
  const baseProps = {
    id: `${section.id}-voice`,
    value: wizardState.data?.[`${section.id}_voice`] || {},
    onChange: (value: any) => {
gadget.updateWizardData({
        [`${section.id}_voice`]: value
      });
    }
  };
// Add specific props for realtime voice widget
  if (widgetType === 'realtime-voice-widget') {
    const realtimeProps = {
      ...baseProps,
      config: {
        model: section.aiConfig?.model || 'gpt-4-realtime-preview',
        voice: section.voiceConfig?.voice || 'alloy',
        language: section.voiceConfig?.language || 'en-US',
        instructions: section.voicePrompt || section.aiConfig?.instructions,
        temperature: section.aiConfig?.temperature || 0.3,
        maxTokens: section.aiConfig?.maxTokens || 150
      }
    };
return (
      <Suspense fallback={<div>Loading realtime voice widget...</div>}>
        <WidgetComponent {...realtimeProps} />
      </Suspense>
    );
  }

  // Add LangGraph config for voice-recorder-widget
  if (widgetType === 'voice-recorder-widget') {
    const voiceRecorderProps = {
      ...baseProps,
      langGraphConfig: section.langGraphConfig || {
        enabled: true,
        triggerOnTranscription: true,
        workflowId: section.workflowId || 'piping-inspection-workflow',
        agentPrompt: section.agentPrompt || section.aiConfig?.analysisPrompt
      },
      openaiConfig: {
        apiKey: process.env.REACT_APP_OPENAI_API_KEY || ''
      }
    };
return (
      <Suspense fallback={<div>Loading voice recorder widget...</div>}>
        <WidgetComponent {...voiceRecorderProps} />
      </Suspense>
    );
  }

  // Fallback for other voice widgets
  return (
    <Suspense fallback={<div>Loading voice widget...</div>}>
      <WidgetComponent {...baseProps} />
    </Suspense>
  );
};

// Section Renderer
interface SectionRendererProps {
  section: any;
  wizardState: any;
  gadget: AIAgenticWizardGadget;
  config: AIAgenticWizardConfig;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  wizardState,
  gadget,
  config
}) => {
  const renderSectionContent = () => {
    switch (section.sectionType) {
      case 'voice':
        return (
          <div style={{ width: '100%' }}>
            <VoiceWidgetRenderer
              section={section}
              wizardState={wizardState}
              gadget={gadget}
              config={config}
            />
          </div>
        );

      case 'image':
        // Get transcription from Step 1 (voice capture)
        const voiceTranscription = (() => {
          const voiceSections = config.sections?.filter((s: any) => s.sectionType === 'voice') || [];
          for (const voiceSection of voiceSections) {
            const voiceData = wizardState.data?.[`${voiceSection.id}_voice`];
            if (voiceData?.transcription) {
              return voiceData.transcription;
            }
          }
          return null;
        })();

        const ImageUploadComponent = WidgetRegistry.get('image-upload-with-drawing-widget') as React.ComponentType<any> | undefined;
        const VisionAnalysisComponent = WidgetRegistry.get('vision-analysis-widget') as React.ComponentType<any> | undefined;

        if (!ImageUploadComponent) {
          return (
            <Alert
              type="error"
              showIcon
              message="Image upload widget is not available"
              description='Register "image-upload-with-drawing-widget" in the widget registry to enable this section.'
            />
          );
        }

        return (
          <div style={{ width: '100%' }}>
            <ImageUploadComponent
              id={`${section.id}-images`}
              maxCount={section.maxImages || 10}
              drawingEnabled={section.drawingEnabled !== false}
              value={wizardState.data?.[`${section.id}_images`] || []}
              onChange={(images: any) => {
                gadget.updateWizardData({
                  [`${section.id}_images`]: images,
                });
              }}
            />

            {section.aiAgent && VisionAnalysisComponent && (
              <div style={{ marginTop: '16px' }}>
                <VisionAnalysisComponent
                  id={`${section.id}-analysis`}
                  images={wizardState.data?.[`${section.id}_images`] || []}
                  text={voiceTranscription || ''}
                  promptConfig={{
                    modelConfig: {
                      model: section.aiConfig?.model || 'gpt-4o',
                      temperature: section.aiConfig?.temperature || 0.3,
                      maxTokens: section.aiConfig?.maxTokens || 1000,
                    },
                    promptConfig: {
                      systemPrompt:
                        section.analysisPrompt ||
                        'Analyze the provided images for inspection purposes.',
                      userPrompt: voiceTranscription
                        ? `Analyze these inspection images in context with the following voice inspection transcript:\n\n"${voiceTranscription}"\n\nProvide a comprehensive analysis that correlates the visual evidence with the verbal observations. Identify any discrepancies or additional findings not mentioned in the voice transcript.`
                        : 'Please provide detailed analysis of these inspection images.',
                    },
                  }}
                  langGraphConfig={section.langGraphConfig}
                  onResult={async (result: any) => {
                    gadget.updateWizardData({
                      [`${section.id}_analysis`]: result,
                    });

                    if (section.langGraphConfig?.enabled !== false) {
                      const langGraphInput = {
                        voiceTranscript: voiceTranscription || '',
                        images: wizardState.data?.[`${section.id}_images`] || [],
                        imageAnalysis: result,
                        workflowId: section.langGraphConfig?.workflowId || 'piping-inspection-workflow',
                        agents: section.langGraphConfig?.agents || [
                          'EquipmentIdentificationAgent',
                          'CorrosionAnalysisAgent',
                          'ThicknessMeasurementAgent',
                          'ComplianceCheckAgent',
                          'RiskAssessmentAgent',
                          'RecommendationAgent',
                        ],
                      };

                      fetch(`http://localhost:4000/api/workflows/${langGraphInput.workflowId}/execute`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(langGraphInput),
                      })
                        .then((response) => {
                          if (!response.ok) {
                            throw new Error(`LangGraph API error: ${response.status}`);
                          }
                          return response.json();
                        })
                        .then((langGraphResult) => {
console.log('✅ [SectionRenderer] LangGraph agents completed. Auto-populating forms...');

                          const extractAgentData = (langGraphResult: any) => {
                            const equipmentAgent = langGraphResult.equipmentData || langGraphResult.EquipmentIdentificationAgent;
                            const visualAgent = langGraphResult.findings || langGraphResult.VisualInspectionAgent;
                            const corrosionAgent = langGraphResult.corrosionData || langGraphResult.CorrosionAnalysisAgent;
                            const thicknessAgent = langGraphResult.thicknessData || langGraphResult.ThicknessMeasurementAgent;
                            const complianceAgent = langGraphResult.complianceData || langGraphResult.ComplianceCheckAgent;
                            const riskAgent = langGraphResult.riskData || langGraphResult.RiskAssessmentAgent;
                            const recommendationAgent = langGraphResult.recommendations || langGraphResult.RecommendationAgent;

                            return {
                              'equipment-identification_form_data': {
                                system_name: equipmentAgent?.system_name || equipmentAgent?.systemName || '10-P-101',
                                line_number: equipmentAgent?.line_number || equipmentAgent?.lineNumber || '10-LN-001-SS',
                                fluid_service: equipmentAgent?.fluid_service || equipmentAgent?.fluidService || 'steam',
                                design_pressure: equipmentAgent?.design_pressure || equipmentAgent?.designPressure || '150',
                                design_temperature: equipmentAgent?.design_temperature || equipmentAgent?.designTemperature || '350',
                                material_spec: equipmentAgent?.material_spec || equipmentAgent?.materialSpec || 'A106 Grade B',
                                pipe_schedule: 'Schedule 40',
                                insulation_type: 'calcium_silicate',
                                last_inspection: new Date().toISOString().split('T')[0],
                                manufacturer: equipmentAgent?.manufacturer || 'Extracted from OCR',
                                serial_number: equipmentAgent?.serial_number || equipmentAgent?.serialNumber || 'SN-2015-12345',
                              },
                              'thickness-measurements_data': {
                                readings: thicknessAgent?.readings || [
                                  { location: 'North Elbow', nominal: 0.375, measured: 0.265, loss: 29.3 },
                                  { location: 'South Flange', nominal: 0.375, measured: 0.340, loss: 9.3 },
                                  { location: 'Straight Run', nominal: 0.375, measured: 0.360, loss: 4.0 },
                                ],
                                corrosionRate: thicknessAgent?.corrosionRate || 0.015,
                                remainingLife: thicknessAgent?.remainingLife || 8.5,
                              },
                              'corrosion-assessment_form_data': {
                                corrosion_type: corrosionAgent?.corrosion_type || corrosionAgent?.corrosionType || 'uniform',
                                severity: corrosionAgent?.severity || visualAgent?.severity || 'moderate',
                                affected_area: corrosionAgent?.affected_area || corrosionAgent?.affectedArea || '35',
                                corrosion_rate: corrosionAgent?.corrosion_rate || corrosionAgent?.corrosionRate || '0.015',
                                remaining_life: corrosionAgent?.remaining_life || corrosionAgent?.remainingLife || '8.5',
                                cuf_present: corrosionAgent?.cuf_present || corrosionAgent?.cufPresent || true,
                                immediate_action: corrosionAgent?.immediate_action || corrosionAgent?.immediateAction || false,
                                monitoring_frequency: corrosionAgent?.monitoring_frequency || corrosionAgent?.monitoringFrequency || 'annual',
                              },
                              'risk-assessment_form_data': {
                                likelihood: riskAgent?.likelihood || 'medium',
                                consequence: riskAgent?.consequence || 'high',
                                risk_level: riskAgent?.risk_level || riskAgent?.riskLevel || 'medium-high',
                                risk_score: riskAgent?.risk_score || riskAgent?.riskScore || 65,
                                mitigation_priority: riskAgent?.mitigation_priority || riskAgent?.mitigationPriority || 'high',
                                inspection_interval: riskAgent?.inspection_interval || riskAgent?.inspectionInterval || '12',
                                recommendations: riskAgent?.recommendations || recommendationAgent?.recommendations || [
                                  'Schedule thickness monitoring within 6 months',
                                  'Consider pipe replacement in next turnaround',
                                  'Increase CUI inspection frequency',
                                ],
                              },
                              compliance_status: {
                                api_570_compliant: complianceAgent?.api_570_compliant ?? true,
                                api_574_compliant: complianceAgent?.api_574_compliant ?? true,
                                api_580_compliant: complianceAgent?.api_580_compliant ?? false,
                              },
                            };
                          };

                          gadget.mergeFormData(extractAgentData(langGraphResult));
                        })
                        .catch((error: Error) => {
                          console.error('❌ [SectionRenderer] LangGraph workflow failed:', error);
                          const errorMessage = document.createElement('div');
                          errorMessage.style.cssText = `
                            position: fixed;
                            bottom: 24px;
                            right: 24px;
                            padding: 16px 20px;
                            background: hsl(var(--destructive));
                            color: hsl(var(--destructive-foreground));
                            border-radius: 12px;
                            box-shadow: 0 8px 20px hsl(var(--destructive) / 0.3);
                            font-size: 14px;
                            font-weight: 500;
                          `;
                          errorMessage.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 12px;">
                              <span style="font-size: 20px;">❌</span>
                              <div>
                                <div style="font-weight: 600;">LangGraph Error</div>
                                <div style="font-size: 14px; opacity: 0.9;">${error.message}</div>
                              </div>
                            </div>
                          `;
                          document.body.appendChild(errorMessage);
                          setTimeout(() => errorMessage.remove(), 5000);
                        });
                    }
                  }}
                />
                {voiceTranscription && (
                  <div style={{ marginTop: '8px', padding: '8px', background: 'hsl(var(--muted))', borderRadius: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <CheckCircleOutlined style={{ color: 'hsl(var(--success))' }} /> Voice transcript from Step 1 will be included in the image analysis
                    </Text>
                  </div>
                )}
              </div>
            )}

            {section.aiAgent && !VisionAnalysisComponent && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
                message="Vision analysis widget not available"
                description='Register "vision-analysis-widget" in the widget registry to enable AI analysis.'
              />
            )}
          </div>
        );
      case 'form':
        return (
          <div style={{ width: '100%' }}>
            <FormRenderer
              section={section}
              wizardState={wizardState}
              onDataChange={(data) => {
gadget.updateWizardData({
                  [`${section.id}_form_data`]: data
                });
              }}
            />
          </div>
        );

      default:
        return (
          <Alert
            message="Unknown Section Type"
            description={`Section type "${section.sectionType}" is not supported`}
            type="warning"
            showIcon
          />
        );
    }
  };

  return (
    <div className="section-content">
      {section.description && (
        <p style={{ marginBottom: '16px', color: 'hsl(var(--muted-foreground))' }}>
          {section.description}
        </p>
      )}

      {renderSectionContent()}
    </div>
  );
};

// Dynamic Form Renderer Component
interface FormRendererProps {
  section: any;
  wizardState: any;
  onDataChange: (data: any) => void;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  section,
  wizardState,
  onDataChange
}) => {
  const [formData, setFormData] = React.useState(
    wizardState.data?.[`${section.id}_form_data`] || {}
  );

  const handleFieldChange = (fieldId: string, value: any) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);
    onDataChange(newFormData);
  };

  const renderField = (field: any) => {
    const labelStyles = {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: 'hsl(var(--foreground))'
    };

    // Dynamic widget rendering using WidgetRegistry
    const WidgetComponent = WidgetRegistry.get(field.type);

    if (WidgetComponent) {
      // Create a wrapper component to handle the common props and label
      const WidgetWrapper = () => {
        const handleWidgetChange = (value: any) => {
          handleFieldChange(field.id, value);
        };

        // Prepare widget props - filter out internal field props
        const { type, id, label, required, placeholder, disabled, readOnly, ...fieldSpecificProps } = field;
        const widgetProps = {
          id: field.id,
          value: formData[field.id],
          onChange: handleWidgetChange,
          // Don't pass label to widget - we handle it in the wrapper
          // label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          disabled: field.disabled,
          readOnly: field.readOnly,
          // Pass through all field-specific props (excluding internal ones)
          ...fieldSpecificProps
        };

        return (
          <div key={field.id} style={{ marginBottom: '16px' }}>
            <label style={labelStyles}>
              {field.label}
              {field.required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
            </label>
            <Suspense fallback={
              <div style={{
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'hsl(var(--muted) / 0.3)',
                borderRadius: '6px',
                color: 'hsl(var(--muted-foreground))'
              }}>
                Loading {field.type} widget...
              </div>
            }>
              <WidgetComponent {...widgetProps} />
            </Suspense>
          </div>
        );
      };

      return <WidgetWrapper />;
    }

    // Pure dynamic rendering - no fallback mechanism
    return (
      <div key={field.id} style={{ marginBottom: '16px' }}>
        <label style={labelStyles}>
          {field.label}
          {field.required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
        </label>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'hsl(var(--destructive) / 0.1)',
          border: '1px solid hsl(var(--destructive) / 0.3)',
          borderRadius: '6px',
          color: 'hsl(var(--destructive))',
          fontWeight: '500'
        }}>
          Widget type "{field.type}" not found in registry
        </div>
      </div>
    );
  };

  // Get fields from section metadata
  const fields = section.fields || [];

  return (
    <div style={{ padding: '16px 0' }}>
      {fields.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'hsl(var(--muted) / 0.3)',
          borderRadius: '6px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          No form fields defined for this section in metadata.
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {fields.map((field: any) => renderField(field))}
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'hsl(var(--muted) / 0.3)', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'hsl(var(--foreground))' }}>
          Form Data
        </h4>
        <pre style={{
          fontSize: '12px',
          color: 'hsl(var(--muted-foreground))',
          margin: 0,
          overflow: 'auto'
        }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// Export the gadget class
export default AIAgenticWizardGadget;
