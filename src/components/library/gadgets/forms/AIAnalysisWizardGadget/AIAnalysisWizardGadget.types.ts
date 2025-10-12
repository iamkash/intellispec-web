export interface InspectionType {
  label: string;
  value: string;
}

export interface AIAnalysisWizardData {
  currentStep: number;
  completedSteps: number[];
  inspectionType?: string;
  globalFormData?: Record<string, any>;
  disabledFields?: string[];
  sections?: Array<{
    id: string;
    title: string;
    formData?: Record<string, any>;
    imagesCollapsed?: boolean;
    voiceData?: { audioUrl?: string; transcription?: string; confidence?: number };
    textData?: string;
    images?: Array<{ uid: string; url: string; name: string; drawingData?: string; description?: string }>;
    imageAnalysis?: {
      overview?: string;
      suggestions?: Array<{
        id: string;
        label: string;
        rationale?: string;
        justification?: string;
        priority?: 'high' | 'medium' | 'low';
        category?: string;
        tags?: string[];
        riskScore?: number;
        riskText?: string;
        effort?: 'low' | 'medium' | 'high';
        timeEstimateMinutes?: number;
        confidence?: number;
        steps?: string[];
        dependencies?: string[];
      }>;
      selectedSuggestionIds?: string[];
      rawAnalysis?: any;
      previousResponseId?: string;
    };
    analysisData?: { analysisResults?: any[]; formData?: Record<string, any>; markdownReport?: string; previousResponseId?: string };
  }>;
  voiceData?: { audioUrl?: string; transcription?: string; confidence?: number };
  textData?: string;
  imageData?: Array<{ uid: string; url: string; name: string; drawingData?: string }>;
  analysisData?: { analysisResults?: any[]; formData?: Record<string, any>; markdownReport?: string; previousResponseId?: string };
}

export interface AIAnalysisWizardConfig {
  steps: {
    input?: {
      enabled: boolean;
      title: string;
      description: string;
      inspectionTypes: InspectionType[];
      nextLabel?: string;
      voice: { enabled: boolean; maxDuration: number; showVisualization: boolean; transcriptionModel: string };
      images: { enabled: boolean; maxCount: number; maxSize: number; drawingEnabled: boolean; drawingTools: Array<'pen' | 'line' | 'circle' | 'rectangle' | 'text' | 'arrow'> };
      text: { enabled: boolean; maxLength: number; placeholder: string };
    };
    sections: Array<{
      id: string;
      title: string;
      description?: string;
      nextLabel?: string;
      form?: { groups?: Array<{ name?: string; title?: string; id?: string; lgSpan?: number; fields: Array<{ id: string; label: string; type: 'text' | 'number' | 'date' | 'dropdown' | 'radio' | 'checkbox_group' | 'multi-select' | 'textarea' | 'file' | 'static_checklist' | 'signature' | 'select'; options?: Array<string | {label: string, value: any}>; required?: boolean; showWhen?: string | string[]; watchField?: string; showOnMatch?: boolean; lgSpan?: number; props?: Record<string, any>; optionsUrl?: string; dependsOn?: string; labelField?: string; valueField?: string; placeholder?: string; description?: string; defaultValue?: any; disabled?: boolean; readOnly?: boolean; calculated?: boolean; formula?: string }>; }>; };
      voiceExtractionPrompt?: { modelConfig?: { model: string; temperature?: number; maxTokens?: number }; promptConfig?: { systemPrompt?: string; userPrompt?: string } };
      recommendationMappings?: Array<{ match: string; set: Array<{ fieldId: string; value: any }> }>;
      voice?: { enabled: boolean; maxDuration?: number; showVisualization?: boolean; transcriptionModel?: string };
      images?: { enabled: boolean; maxCount?: number; maxSize?: number; drawingEnabled?: boolean; drawingTools?: Array<'pen' | 'line' | 'circle' | 'rectangle' | 'text' | 'arrow'> };
      text?: { enabled: boolean; maxLength?: number; placeholder?: string };
      imageAnalysisPrompt?: { modelConfig?: { model: string; temperature?: number; maxTokens?: number; topP?: number; frequencyPenalty?: number; presencePenalty?: number }; promptConfig?: { systemPrompt?: string; userPrompt?: string; context?: string; examples?: Array<{ input: string; output: string }> } };
    }>;
    pdf: { id?: string; enabled: boolean; title: string; description: string; reportConfig: { includeSections?: string[]; markdownTemplate?: Record<string, any>; pdfStyling?: Record<string, any>; templates?: Array<{ id: string; name: string; description?: string; sections?: string[] }>; defaultTemplateId?: string; value?: Record<string, any>; defaults?: Record<string, any> } };
  };
  title: string;
  description: string;
  theme: 'light' | 'dark';
  showProgress: boolean;
  allowStepNavigation: boolean;
  autoAdvance: boolean;
  typeLabel?: string;
  typePlaceholder?: string;
  typeHelpText?: string;
  reportTitle?: string;
  reportHeaderText?: string;
  reportHeaderSubtext?: string;
  reportFooterText?: string;
  editModalTitle?: string;
  minimumRequirements?: { onsiteOnly?: string[]; prepopulation?: string[] };
  validation?: { required?: string[] };
  assetDataPopulation?: {
    enabled: boolean;
    apiEndpoint: string;
    assetIdParam: string;
    populateOnLoad: boolean;
    disablePopulatedFields: boolean;
  };
}


