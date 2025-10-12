import { WizardStep, WizardState, FormValidationResult, FieldConfig, FormSection, FormGroup } from '../components/library/gadgets/forms/types';

/**
 * Wizard utility functions for managing wizard state and navigation
 */
export class WizardUtils {
  /**
   * Parse gadget options into wizard steps
   */
  static parseWizardSteps(
    sections: Record<string, FormSection>,
    sectionGroups: Record<string, string[]>,
    groupFields: Record<string, string[]>,
    fieldConfigs: Record<string, FieldConfig>,
    formData?: Record<string, any>
  ): WizardStep[] {
    const steps: WizardStep[] = [];
    
    // Sort sections by order
    const sortedSections = Object.values(sections).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedSections.forEach((section, index) => {
      const stepFields: Record<string, FieldConfig> = {};
      
      // Get groups for this section
      const groupIds = sectionGroups[section.id] || [];
      // Note: groupFields contains field IDs, not group objects
      // We'll use the groupIds directly since we don't have group objects here
      const sortedGroupIds = groupIds.sort();
      
      // Get fields for each group
      sortedGroupIds.forEach(groupId => {
        const fieldIds = groupFields[groupId] || [];
        fieldIds.forEach(fieldId => {
          const fieldConfig = fieldConfigs[fieldId];
          if (fieldConfig) {
            stepFields[fieldId] = fieldConfig;
          }
        });
      });
      
      if (Object.keys(stepFields).length > 0) {
        steps.push({
          id: section.id,
          title: section.title,
          description: section.description,
          icon: section.icon as string,
          order: index,
          fields: stepFields
        });
      }
    });
    
    return steps;
  }

  /**
   * Get current step from wizard state
   */
  static getCurrentStep(state: WizardState): WizardStep | null {
    if (!state.steps || state.steps.length === 0) {
      return null;
    }
    
    const currentStepIndex = state.currentStep || 0;
    return state.steps[currentStepIndex] || null;
  }

  /**
   * Navigate to a specific step
   */
  static navigateToStep(
    state: WizardState,
    stepIndex: number,
    config: any,
    validateStep: (stepId: string, stepData: any) => FormValidationResult
  ): { success: boolean; newState?: WizardState; error?: string } {
    if (stepIndex < 0 || stepIndex >= state.steps.length) {
      return { success: false, error: 'Invalid step index' };
    }

    // Validate current step if validation is enabled
    if (config.validateOnStepChange && state.currentStep !== undefined) {
      const currentStep = state.steps[state.currentStep];
      if (currentStep) {
        const validation = validateStep(currentStep.id, state.stepData[currentStep.id] || {});
        if (!validation.isValid) {
          return { success: false, error: 'Current step validation failed' };
        }
      }
    }

    // Check if we can navigate to the target step
    if (config.allowStepNavigation === false) {
      // Only allow navigation to next step or completed steps
      if (stepIndex > state.currentStep && !state.completedSteps.has(stepIndex)) {
        return { success: false, error: 'Cannot navigate to this step' };
      }
    }

    const safeHistory = Array.isArray((state as any).navigationHistory)
      ? (state as any).navigationHistory as number[]
      : [];
    const newState: WizardState = {
      ...state,
      currentStep: stepIndex,
      navigationHistory: [...safeHistory, stepIndex]
    };

    return { success: true, newState };
  }

  /**
   * Validate a specific step
   */
  static validateStep(stepId: string, stepData: any, steps: WizardStep[]): FormValidationResult {
    const step = steps.find(s => s.id === stepId);
    if (!step) {
      console.error('WizardUtils: Step not found:', stepId);
      return {
        isValid: false,
        errors: { [stepId]: 'Step not found' },
        warnings: {}
      };
    }
const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Validate each field in the step
    Object.entries(step.fields).forEach(([fieldId, fieldConfig]) => {
      const fieldValue = stepData[fieldId];
      
      // Check if field should be visible based on conditional rendering
      const shouldValidate = this.shouldValidateField(fieldConfig, stepData);
// Only validate if field should be visible
      if (!shouldValidate) {
return;
      }

      // Required field validation
      if (fieldConfig.required && (fieldValue === undefined || fieldValue === null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0))) {
        errors[fieldId] = `${fieldConfig.label || fieldId} is required`;
        console.warn('WizardUtils: Required field validation failed:', fieldId);
      }

      // Custom validator if provided
      if (fieldConfig.validator) {
        const result = fieldConfig.validator(fieldValue);
        if (!result.isValid) {
          errors[fieldId] = result.message || `${fieldConfig.label || fieldId} is invalid`;
          console.warn('WizardUtils: Custom validation failed:', fieldId, result.message);
        }
      }

      // Type-specific validation
      if (fieldConfig.type === 'email' && fieldValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
        errors[fieldId] = 'Please enter a valid email address';
        console.warn('WizardUtils: Email validation failed:', fieldId);
      }

      if (fieldConfig.type === 'url' && fieldValue && !/^https?:\/\/.+/.test(fieldValue)) {
        errors[fieldId] = 'Please enter a valid URL';
        console.warn('WizardUtils: URL validation failed:', fieldId);
      }

      if (fieldConfig.type === 'number' && fieldValue && isNaN(Number(fieldValue))) {
        errors[fieldId] = 'Please enter a valid number';
        console.warn('WizardUtils: Number validation failed:', fieldId);
      }
    });

    const result = {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
return result;
  }

  /**
   * Check if a field should be validated based on conditional rendering
   */
  static shouldValidateField(fieldConfig: any, stepData: any): boolean {
    if (!fieldConfig.watchField || fieldConfig.showWhen === undefined) {
      return true;
    }
    
    const watchedValue = stepData[fieldConfig.watchField];
// Handle array values for showWhen
    if (Array.isArray(fieldConfig.showWhen)) {
      const isIncluded = fieldConfig.showWhen.includes(watchedValue);
      const result = fieldConfig.showOnMatch !== false ? isIncluded : !isIncluded;
return result;
    }
    
    // Handle comma-separated string values for showWhen (e.g., "yes,planned")
    if (typeof fieldConfig.showWhen === 'string' && fieldConfig.showWhen.includes(',')) {
      const showWhenArray = fieldConfig.showWhen.split(',').map((s: string) => s.trim());
      const isIncluded = showWhenArray.includes(watchedValue);
      const result = fieldConfig.showOnMatch !== false ? isIncluded : !isIncluded;
return result;
    }
    
    // Handle single value for showWhen
    const matches = watchedValue === fieldConfig.showWhen;
    const result = fieldConfig.showOnMatch !== false ? matches : !matches;
return result;
  }

  /**
   * Get wizard progress percentage
   */
  static getWizardProgress(state: WizardState): number {
    if (!state.steps || state.steps.length === 0) {
      return 0;
    }

    const completedCount = state.completedSteps.size;
    const totalSteps = state.steps.length;
    
    return Math.round((completedCount / totalSteps) * 100);
  }

  /**
   * Complete the current step
   */
  static completeCurrentStep(
    state: WizardState,
    stepData: any,
    validateStep: (stepId: string, stepData: any) => FormValidationResult
  ): { success: boolean; newState?: WizardState; error?: string } {
    if (!state.steps || state.steps.length === 0) {
      console.error('WizardUtils: No steps available');
      return { success: false, error: 'No steps available' };
    }

    const currentStepIndex = state.currentStep || 0;
    const currentStep = state.steps[currentStepIndex];
    
    if (!currentStep) {
      console.error('WizardUtils: Current step not found at index', currentStepIndex);
      return { success: false, error: 'Current step not found' };
    }
// Validate the current step
    const validation = validateStep(currentStep.id, stepData);
if (!validation.isValid) {
      console.error('WizardUtils: Step validation failed:', validation.errors);
      return { success: false, error: 'Step validation failed' };
    }

    // Mark step as completed
    const newCompletedSteps = new Set(state.completedSteps);
    newCompletedSteps.add(currentStepIndex);

    // Update step data
    const newStepData = {
      ...state.stepData,
      [currentStep.id]: stepData
    };

    // Navigate to next step if available
    const nextStepIndex = currentStepIndex + 1;
    const newCurrentStep = nextStepIndex < state.steps.length ? nextStepIndex : currentStepIndex;

    const newState: WizardState = {
      ...state,
      currentStep: newCurrentStep,
      completedSteps: newCompletedSteps,
      stepData: newStepData,
      stepValidation: {
        ...state.stepValidation,
        [currentStep.id]: validation
      }
    };

    console.log('WizardUtils: Step completion successful, new state:', {
      currentStep: newCurrentStep,
      completedSteps: Array.from(newCompletedSteps)
    });

    return { success: true, newState };
  }
} 