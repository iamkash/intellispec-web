import React from 'react';
import { BaseGadget } from '../../../base';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';

/**
 * Simple dependent dropdown logic:
 * 1. Load independent fields when step loads
 * 2. When parent field changes:
 *    - Load options for dependent field
 *    - Clear values of all dependent fields in the chain
 */
export const useFieldOptions = (
  config: AIAnalysisWizardConfig,
  wizardData: AIAnalysisWizardData,
  getFormFieldValue: (fieldId: string) => any,
  currentStep?: number,
  updateSectionData?: (sectionIndex: number, update: any) => void
) => {
  const [fieldOptions, setFieldOptions] = React.useState<Record<string, Array<{label: string, value: any}>>>({});
  const [loadingOptions, setLoadingOptions] = React.useState<Record<string, boolean>>({});

  // Get all fields with optionsUrl from current step
  const getCurrentStepFields = React.useMemo(() => {
    if (!config?.steps?.sections || currentStep === undefined) return [];
    
    let targetSectionIndex = currentStep;
    if (config.steps.input) {
      targetSectionIndex = currentStep - 1;
    }
    
    const currentSection = config.steps.sections[targetSectionIndex];
    if (!currentSection?.form?.groups) return [];
    
    const fields: Array<{fieldId: string, field: any}> = [];
    for (const group of currentSection.form.groups) {
      if (group?.fields) {
        for (const field of group.fields) {
          if (field?.optionsUrl && field?.id) {
            fields.push({ fieldId: field.id, field });
          }
        }
      }
    }
    
    return fields;
  }, [config?.steps?.sections, currentStep]);

  // Load options for a field
  const loadFieldOptions = React.useCallback(async (fieldId: string, field: any) => {
    if (!field?.optionsUrl || loadingOptions[fieldId]) return;

    console.log(`[useFieldOptions] Loading options for ${fieldId}`);
    setLoadingOptions(prev => ({ ...prev, [fieldId]: true }));

    try {
      let url = field.optionsUrl;
      
      // Add parent field values as query parameters
      if (field.dependsOn) {
        const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];
        const urlParams = new URLSearchParams();
        
        dependencies.forEach((depId: string) => {
          const parentValue = getFormFieldValue(depId);
          console.log(`[useFieldOptions] Parent ${depId} = ${parentValue}`);
          if (parentValue !== undefined && parentValue !== '') {
            urlParams.append(depId, parentValue);
          }
        });
        
        if (urlParams.toString()) {
          url += (url.includes('?') ? '&' : '?') + urlParams.toString();
        }
      }

      console.log(`[useFieldOptions] Fetching: ${url}`);
      const response = await BaseGadget.makeAuthenticatedFetch(url);
      const data = await response.json();

      // Parse response into options
      let options: Array<{ label: string; value: any }> = [];
      if (Array.isArray(data)) {
        options = data.map((item: any) => ({
          label: field.labelField ? item[field.labelField] : (item.label || item.name || String(item)),
          value: field.valueField ? item[field.valueField] : (item.value || item.id || item)
        }));
      } else if (data.options && Array.isArray(data.options)) {
        options = data.options.map((item: any) => ({
          label: field.labelField ? item[field.labelField] : (item.label || item.name || String(item)),
          value: field.valueField ? item[field.valueField] : (item.value || item.id || item)
        }));
      } else if (data.data && Array.isArray(data.data)) {
        options = data.data.map((item: any) => ({
          label: field.labelField ? item[field.labelField] : (item.label || item.name || String(item)),
          value: field.valueField ? item[field.valueField] : (item.value || item.id || item)
        }));
      }

      console.log(`[useFieldOptions] Loaded ${options.length} options for ${fieldId}`);
      setFieldOptions(prev => ({ ...prev, [fieldId]: options }));
    } catch (error) {
      console.error(`Failed to load options for ${fieldId}:`, error);
    } finally {
      setLoadingOptions(prev => ({ ...prev, [fieldId]: false }));
    }
  }, [getFormFieldValue, loadingOptions]);

  // Load independent fields when step loads
  React.useEffect(() => {
    console.log(`[useFieldOptions] Step ${currentStep} loaded, checking fields`);
    
    getCurrentStepFields.forEach(({ fieldId, field }) => {
      if (!field.dependsOn && !fieldOptions[fieldId]) {
        console.log(`[useFieldOptions] Loading independent field: ${fieldId}`);
        loadFieldOptions(fieldId, field);
      }
    });
  }, [currentStep, getCurrentStepFields, loadFieldOptions, fieldOptions]);

  // Handle field changes and dependent field loading
  const handleFieldChange = React.useCallback((fieldId: string, newValue: any) => {
    console.log(`[useFieldOptions] Field ${fieldId} changed to:`, newValue);
    
    // Find all dependent fields for this field
    const dependentFields = getCurrentStepFields.filter(({ field }) => {
      const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : (field.dependsOn ? [field.dependsOn] : []);
      return dependencies.includes(fieldId);
    });

    console.log(`[useFieldOptions] Found ${dependentFields.length} dependent fields:`, dependentFields.map(f => f.fieldId));

    // Clear dependent field values and options
    dependentFields.forEach(({ fieldId: depFieldId, field: depField }) => {
      console.log(`[useFieldOptions] Clearing dependent field: ${depFieldId}`);
      
      // Clear the field value
      if (updateSectionData) {
        const sectionIndex = getCurrentStepSectionIndex();
        if (sectionIndex >= 0) {
          const currentFormData = wizardData.sections?.[sectionIndex]?.formData || {};
          const newFormData = { ...currentFormData };
          delete newFormData[depFieldId];
          updateSectionData(sectionIndex, { formData: newFormData });
        }
      }
      
      // Clear options
      setFieldOptions(prev => {
        const next = { ...prev };
        delete next[depFieldId];
        return next;
      });
      
      // Load new options if parent has value
      if (newValue !== undefined && newValue !== '') {
        console.log(`[useFieldOptions] Loading options for dependent field: ${depFieldId}`);
        loadFieldOptions(depFieldId, depField);
      }
    });
  }, [getCurrentStepFields, loadFieldOptions, updateSectionData, wizardData.sections]);

  // Helper to get current step section index
  const getCurrentStepSectionIndex = React.useCallback(() => {
    if (currentStep === undefined) return -1;
    let sectionIndex = currentStep;
    if (config.steps.input) {
      sectionIndex = currentStep - 1;
    }
    return sectionIndex;
  }, [currentStep, config.steps.input]);

  return {
    fieldOptions,
    loadingOptions,
    loadFieldOptions,
    handleFieldChange
  };
};