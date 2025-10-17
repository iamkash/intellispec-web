import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext } from '../base';
import { ValidationResult } from '../../core/base';
import { sanitizeData } from '../../../../utils/sanitizeData';
import { FormValidationResult } from '../../../../utils/FormValidator';
import { WizardUtils } from '../../../../utils/WizardUtils';
import { WizardConfig, WizardState, WizardStep } from './types';
import { FormDataUtils } from '../../../../utils/FormDataUtils';
import {
  FieldConfig,
  FormSection,
  FormGroup,
  GadgetOption
} from './types';
// FormRenderer is imported dynamically to avoid circular dependency
import { 
  DocumentFormConfig, 
  FormData, 
  DocumentFormGadgetState
} from './types';

// Extend DocumentFormConfig to include wizard options
interface ExtendedDocumentFormConfig extends DocumentFormConfig, WizardConfig {}

// Extend DocumentFormGadgetState to include wizard state
interface ExtendedDocumentFormGadgetState extends DocumentFormGadgetState, WizardState {}

/**
 * Document Form Gadget
 * A powerful gadget that can dynamically generate forms based on metadata structure
 * Supports all input widget types and provides comprehensive form management capabilities
 * 
 * NEW: Wizard Mode Support
 * - Set mode: 'wizard' to enable step-by-step navigation
 * - Automatically converts sections/groups into wizard steps
 * - Provides stepper UI, progress tracking, and step validation
 * - Maintains all existing form functionality when mode: 'form'
 * 
 * Layout System:
 * - Uses a 12-column grid system for responsive layout
 * - Each field can specify its own span (1-12 columns) in the fieldConfig
 * - Default span is 6 columns (half width) if not specified
 * - Spans are automatically converted to Ant Design's 24-column system internally
 * 
 * Smart Defaults:
 * - layout: 'vertical' (clean vertical form layout)
 * - size: 'middle' (comfortable input sizing)
 * - enableValidation: true (form validation enabled)
 * - autoSave: false (manual save by default)
 * - autoSaveInterval: 30000 (30 seconds when auto-save enabled)
 * - showSaveButton: true (show save button)
 * - showResetButton: true (show reset button)
 * - showClearButton: false (hide clear button by default)
 * 
 * Wizard Mode Defaults:
 * - mode: 'form' (standard form mode)
 * - showStepper: true (show step navigation)
 * - showProgress: true (show progress bar)
 * - allowStepNavigation: true (allow clicking on steps)
 * - validateOnStepChange: true (validate before step change)
 * - autoSave: false (manual save by default)
 * - stepperPosition: 'top' (stepper above form)
 * - stepperSize: 'default' (normal stepper size)
 * 
 * Minimal Configuration Example:
 * {
 *   "dataUrl": "/api/form-data",
 *   "mode": "wizard", // Enable wizard mode
 *   "fieldConfigs": {
 *     "name": { type: "text", span: 6 },
 *     "email": { type: "email", span: 6 },
 *     "description": { type: "textarea", span: 12 }
 *   }
 * }
 */
class DocumentFormGadget extends BaseGadget {
  private autoSaveTimer: NodeJS.Timeout | null = null;
  public config: ExtendedDocumentFormConfig;

  constructor(config: ExtendedDocumentFormConfig, widgetRegistry?: any, context?: any) {
    super();
    this.config = {
      // Default wizard settings
      showStepper: true,
      showProgress: true,
      allowStepNavigation: true,
      validateOnStepChange: true,
      autoSave: false,
      autoSaveInterval: 30000,
      stepperSize: 'default',
      ...config
    };
  }

  /**
   * Gadget metadata
   */
  metadata: GadgetMetadata = {
    id: 'document-form-gadget',
    name: 'Document Form',
    description: 'Dynamic form generator that creates forms from metadata with all input widget types',
    category: 'forms',
    tags: ['form', 'dynamic', 'metadata', 'input', 'validation'],
    version: '1.0.0',
    author: 'System',
    gadgetType: GadgetType.FORM,
    widgetTypes: [
      'InputFieldWidget',
      'TextAreaWidget',
      'InputNumberWidget',
      'SearchWidget',
      'DatePickerWidget',
      'TimePickerWidget',
      'SliderWidget',
      'SwitchWidget',
      'RadioWidget',
      'CheckboxWidget',
      'ComboBoxWidget',
      'TagsInputWidget',
      'RateWidget',
      'ColorPickerWidget',
      'AutoCompleteWidget',
      'CascaderWidget',
      'TreeSelectWidget',
      'SegmentedWidget',
      'UploadWidget',
      'TransferWidget',
      'MentionWidget',
      'PasswordWidget',
      'OTPInputWidget',
      'LocationPickerWidget',
      'SignatureWidget',
      'DrawingWidget',
      'CameraWidget',
      'AudioRecorderWidget',
      'QRCodeScannerWidget',
      'ButtonGroupWidget',
      'FormSectionWidget',
      'FormStepWidget',
      'FormTabsWidget'
    ]
  };

  /**
   * Gadget schema
   */
  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: { type: 'string' },
      dataPath: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      layout: { type: 'string', enum: ['horizontal', 'vertical', 'inline'] },
      size: { type: 'string', enum: ['small', 'middle', 'large'] },
      enableValidation: { type: 'boolean' },
      autoSave: { type: 'boolean' },
      autoSaveInterval: { type: 'number' },
      showSaveButton: { type: 'boolean' },
      showResetButton: { type: 'boolean' },
      showClearButton: { type: 'boolean' },
      readOnly: { type: 'boolean' },
      // Wizard mode properties
      mode: { type: 'string', enum: ['form', 'wizard'] },
      showStepper: { type: 'boolean' },
      showProgress: { type: 'boolean' },
      allowStepNavigation: { type: 'boolean' },
      validateOnStepChange: { type: 'boolean' },
      showStepNumbers: { type: 'boolean' },
      showStepDescriptions: { type: 'boolean' },
      allowBackNavigation: { type: 'boolean' },
      stepperPosition: { type: 'string', enum: ['top', 'bottom', 'left', 'right'] },
      stepperSize: { type: 'string', enum: ['small', 'default', 'large'] }
    },
    required: ['dataUrl'],
    widgetSchemas: {}
  };

  componentWillUnmount() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  onGadgetMount(): void {
    // Initialize state when gadget mounts
    this.setState({
      // Base GadgetState properties
      data: null,
      loading: false,
      error: null,
      lastFetch: null,
      
      // Document Form specific properties
      formData: {} as FormData,
      originalData: {} as FormData,
      metadata: null,
      fieldConfigs: {} as Record<string, FieldConfig>,
      validationResult: { isValid: true, errors: {}, warnings: {} } as FormValidationResult,
      isSubmitting: false,
      isDirty: false,
      lastSaved: null as Date | null,
      autoSaveStatus: 'idle' as 'idle' | 'saving' | 'saved' | 'error',
      dynamicOptions: {},
      optionsLoading: {},
      optionsErrors: {},
      sections: this.config.sections || {},
      groups: this.config.groups || {},
      sectionGroups: this.config.sectionGroups || {},
      groupFields: this.config.groupFields || {},
      activeSection: null,
      collapsedGroups: {},
      
      // Wizard specific properties
      currentStep: 0,
      steps: [],
      completedSteps: new Set<number>(),
      stepData: {},
      stepValidation: {},
      navigationHistory: [],
    } as ExtendedDocumentFormGadgetState);
  }

  /**
   * Initialize form data from metadata
   */
  public initializeFormData(metadata: any, fieldConfigs: Record<string, FieldConfig>): FormData {
    return FormDataUtils.initializeFormData(metadata, fieldConfigs);
  }

  /**
   * Parse flat gadgetOptions array into structured format
   */
  public parseGadgetOptions(gadgetOptions: GadgetOption[]): {
    fieldConfigs: Record<string, FieldConfig>;
    sections: Record<string, FormSection>;
    groups: Record<string, FormGroup>;
    sectionGroups: Record<string, string[]>;
    groupFields: Record<string, string[]>;
  } {
    return FormDataUtils.parseGadgetOptions(gadgetOptions);
  }

  /**
   * Transform options to tree data format
   */
  public transformOptionsToTreeData(options: any[]): any[] {
    return FormDataUtils.transformOptionsToTreeData(options);
  }

  /**
   * Transform options to transfer data format
   */
  public transformOptionsToTransferData(options: any[]): any[] {
    return FormDataUtils.transformOptionsToTransferData(options);
  }

  /**
   * Parse gadget options into wizard steps
   */
  public parseWizardSteps(formData?: Record<string, any>): WizardStep[] {
    if (!this.config.gadgetOptions || this.config.gadgetOptions.length === 0) {
      return [];
    }

    const parsedStructure = this.parseGadgetOptions(this.config.gadgetOptions);
    const currentFormData = formData || (this.state as ExtendedDocumentFormGadgetState).formData;
    
    return WizardUtils.parseWizardSteps(
      parsedStructure.sections,
      parsedStructure.sectionGroups,
      parsedStructure.groupFields,
      parsedStructure.fieldConfigs,
      currentFormData
    );
  }

  /**
   * Parse wizard steps with loaded data from FormRenderer
   */
  public parseWizardStepsWithLoadedData(
    sections: Record<string, FormSection>,
    groups: Record<string, FormGroup>,
    fieldConfigs: Record<string, FieldConfig>,
    sectionGroups: Record<string, string[]>,
    groupFields: Record<string, string[]>,
    formData?: Record<string, any>
  ): WizardStep[] {
    const currentFormData = formData || (this.state as ExtendedDocumentFormGadgetState).formData;
    
    return WizardUtils.parseWizardSteps(
      sections,
      sectionGroups,
      groupFields,
      fieldConfigs,
      currentFormData
    );
  }

  /**
   * Update form data and regenerate wizard steps
   */
  public updateFormDataAndRegenerateSteps(fieldPath: string, value: any): WizardStep[] {
    // Update form data
    (this.state as ExtendedDocumentFormGadgetState).formData = {
      ...(this.state as ExtendedDocumentFormGadgetState).formData,
      [fieldPath]: value
    };
    
    // Regenerate steps
    return this.parseWizardSteps((this.state as ExtendedDocumentFormGadgetState).formData);
  }

  /**
   * Merge form data without regenerating steps.
   * Useful when bulk updates are applied from external automation.
   */
  public mergeFormData(newData: Record<string, any>): void {
    (this.state as ExtendedDocumentFormGadgetState).formData = {
      ...(this.state as ExtendedDocumentFormGadgetState).formData,
      ...newData,
    };
  }

  /**
   * Initialize wizard steps
   */
  public initializeWizardSteps(): void {
    if ((this.config as any).mode === 'wizard') {
      // Prefer using parsed structure from state when available; otherwise, fallback to parsing gadgetOptions directly
      const extendedState = this.state as ExtendedDocumentFormGadgetState;
      const hasParsedState = !!extendedState &&
        extendedState.sections && Object.keys(extendedState.sections).length > 0 &&
        extendedState.fieldConfigs && Object.keys(extendedState.fieldConfigs).length > 0;

      let steps: WizardStep[] = [];
      if (hasParsedState) {
        steps = this.parseWizardStepsWithLoadedData(
          extendedState.sections || {},
          extendedState.groups || {},
          extendedState.fieldConfigs || {},
          extendedState.sectionGroups || {},
          extendedState.groupFields || {},
          extendedState.formData
        );
      } else {
        // Fallback: derive steps directly from gadgetOptions
        steps = this.parseWizardSteps(extendedState?.formData);
      }

      (this.state as ExtendedDocumentFormGadgetState).steps = steps;
}
  }

  /**
   * Get current step
   */
  public getCurrentStep(): WizardStep | null {
    if ((this.config as any).mode !== 'wizard') {
      return null;
    }
    return WizardUtils.getCurrentStep(this.state as ExtendedDocumentFormGadgetState);
  }

  /**
   * Navigate to step
   */
  public navigateToStep(stepIndex: number): boolean {
    if ((this.config as any).mode !== 'wizard') {
      return false;
    }

    const extendedState = this.state as ExtendedDocumentFormGadgetState;
    const result = WizardUtils.navigateToStep(
      extendedState,
      stepIndex,
      this.config,
      (stepId: string, stepData: any) => this.validateStep(stepId, stepData)
    );

    if (result.success) {
      Object.assign(this.state, result.newState);
    }

    return result.success;
  }

  /**
   * Validate a specific step
   */
  public validateStep(stepId: string, stepData: any): FormValidationResult {
    const extendedState = this.state as ExtendedDocumentFormGadgetState;
    return WizardUtils.validateStep(stepId, stepData, extendedState.steps);
  }

  /**
   * Get wizard progress
   */
  public getWizardProgress(): number {
    if ((this.config as any).mode !== 'wizard') {
      return 0;
    }
    const state = (this.state as ExtendedDocumentFormGadgetState);
    const safeState = {
      steps: state.steps || [],
      completedSteps: state.completedSteps || new Set<number>(),
    } as unknown as any;
    try {
      return WizardUtils.getWizardProgress(safeState);
    } catch {
      const stepsLen = Array.isArray(state.steps) ? state.steps.length : 0;
      const completed = state.completedSteps ? state.completedSteps.size : 0;
      return stepsLen === 0 ? 0 : Math.round((completed / stepsLen) * 100);
    }
  }

  /**
   * Get current step index
   */
  public getCurrentStepIndex(): number {
    return (this.state as ExtendedDocumentFormGadgetState).currentStep || 0;
  }

  /**
   * Get completed steps
   */
  public getCompletedSteps(): Set<number> {
    return (this.state as ExtendedDocumentFormGadgetState).completedSteps || new Set();
  }

  /**
   * Get step validation results
   */
  public getStepValidation(): Record<string, FormValidationResult> {
    return (this.state as ExtendedDocumentFormGadgetState).stepValidation || {};
  }

  /**
   * Get wizard state
   */
  public getWizardState(): WizardState {
    const extendedState = this.state as ExtendedDocumentFormGadgetState;
    return {
      currentStep: extendedState.currentStep || 0,
      steps: extendedState.steps || [],
      completedSteps: extendedState.completedSteps || new Set(),
      stepData: extendedState.stepData || {},
      stepValidation: extendedState.stepValidation || {},
      navigationHistory: Array.isArray(extendedState.navigationHistory) ? extendedState.navigationHistory : [],
      isDirty: extendedState.isDirty || false,
      autoSaveStatus: extendedState.autoSaveStatus || 'idle',
      lastSaved: extendedState.lastSaved || null
    };
  }

  /**
   * Complete current step
   */
  public completeCurrentStep(stepData?: any): boolean {
    if ((this.config as any).mode !== 'wizard') {
      console.warn('DocumentFormGadget: Not in wizard mode');
      return false;
    }

    const extendedState = this.state as ExtendedDocumentFormGadgetState;
    
    // Debug: Check current state
    console.log('DocumentFormGadget: Current wizard state:', {
      currentStep: extendedState.currentStep,
      totalSteps: extendedState.steps?.length,
      completedSteps: Array.from(extendedState.completedSteps || []),
      stepData: extendedState.stepData,
      sections: Object.keys(extendedState.sections || {}),
      fieldConfigs: Object.keys(extendedState.fieldConfigs || {})
    });
    
    const result = WizardUtils.completeCurrentStep(
      extendedState,
      stepData,
      (stepId: string, stepData: any) => this.validateStep(stepId, stepData)
    );

    if (result.success) {
      // Update the state with the new wizard state
      Object.assign(this.state, result.newState);
      
      // Update form data
      (this.state as ExtendedDocumentFormGadgetState).formData = { 
        ...(this.state as ExtendedDocumentFormGadgetState).formData, 
        ...stepData 
      };
} else {
      console.error('DocumentFormGadget: Step completion failed:', result.error);
    }

    return result.success;
  }

  /**
   * Get container props - Remove padding for forms to allow full width
   */
  getContainerProps(props: any, context?: GadgetContext): any {
    const baseProps = super.getContainerProps(props, context);
    return {
      ...baseProps,
      noPadding: true // Remove padding for full width
    };
  }

  /**
   * Render gadget body
   */
  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    // The only job of renderBody is to render our new stateful component,
    // passing a reference to the gadget class itself and the initial props.
    // Import FormRenderer dynamically to avoid circular dependency
    const { FormRenderer } = require('./FormRenderer');
    return React.createElement(FormRenderer, { gadget: this, initialProps: props });
  }

  /**
   * Validate gadget configuration
   */
  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    if (!this.config.dataUrl) {
      errors.push('dataUrl is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get required widgets for this gadget
   */
  getRequiredWidgets(): string[] {
    return this.metadata.widgetTypes;
  }

  /**
   * Get widget layout
   */
  getWidgetLayout(): Record<string, any> {
    return {
      type: 'form',
      responsive: true,
      gridSystem: '24-column'
    };
  }

  /**
   * Process data flow
   */
  processDataFlow(data: any): any {
    return sanitizeData(data);
  }

  /**
   * Utility methods
   */
  private getNestedValue(obj: any, path: string): any {
    return FormDataUtils.getNestedValue(obj, path);
  }

  private formatLabel(key: string): string {
    return FormDataUtils.formatLabel(key);
  }

  /**
   * Override renderStructured to handle URL parameter substitution
   */
  renderStructured(props: any, context?: GadgetContext): {
    body: React.ReactNode;
    containerProps: any;
  } {
    const config = props as ExtendedDocumentFormConfig;
    
    // Substitute URL parameters in dataUrl before calling parent
    const modifiedConfig = { ...config };
    
    if (config.dataUrl) {
      // Get URL parameters from current location
      const urlParams = new URLSearchParams(window.location.search);
      
      // Replace common parameter placeholders
      const idParam = urlParams.get('id') || '';
      const recordIdParam = urlParams.get('recordId') || '';
      const restoreIdParam = urlParams.get('restoreId') || '';
      
      let resolvedDataUrl = config.dataUrl;
      resolvedDataUrl = resolvedDataUrl.replace(/{id}/g, idParam);
      resolvedDataUrl = resolvedDataUrl.replace(/{recordId}/g, recordIdParam);
      resolvedDataUrl = resolvedDataUrl.replace(/{restoreId}/g, restoreIdParam);

      // Don't set dataUrl if it still contains placeholders
      if (resolvedDataUrl.includes('{')) {
        delete (modifiedConfig as any).dataUrl; // This will prevent BaseGadget from fetching
      } else {
        modifiedConfig.dataUrl = resolvedDataUrl;
      }
    }

    // Call parent's renderStructured with modified config
    return super.renderStructured(modifiedConfig, context);
  }
}

export default DocumentFormGadget; 
