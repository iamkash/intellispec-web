import { useCallback, useMemo, useState } from 'react';
import { AIAnalysisWizardGadget } from '../AIAnalysisWizardGadget';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';

/**
 * Custom hook to handle wizard navigation and step management
 */
export const useWizardNavigation = (
  gadget: AIAnalysisWizardGadget,
  config: AIAnalysisWizardConfig,
  visibleSections: any[]
) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<AIAnalysisWizardData>(gadget.getWizardData());
  
  // Sync with gadget state periodically
  const syncWithGadget = useCallback(() => {
    const freshData = gadget.getWizardData();
    setWizardData({ ...freshData }); // Force new reference for React
  }, [gadget]);
  
  // Force re-render when gadget data changes
  const triggerRerender = useCallback(() => {
    syncWithGadget();
  }, [syncWithGadget]);

  const handleStepChange = useCallback((step: number) => {
    if (gadget.canNavigateToStep(step)) {
      setCurrentStep(step);
      gadget.navigateToStep(step);
    }
  }, [gadget]);

  const handleDataUpdate = useCallback((data: Partial<AIAnalysisWizardData>) => {
    gadget.updateWizardData(data);
    syncWithGadget();
  }, [gadget, syncWithGadget]);

  const finalStepIndex = useMemo(() => {
    return visibleSections.length + (config.steps.input ? 1 : 0);
  }, [visibleSections.length, config.steps.input]);

  const goPrev = useCallback(() => {
    const minIndex = 0;
    const prev = Math.max(minIndex, currentStep - 1);
    if (prev !== currentStep) handleStepChange(prev);
  }, [currentStep, handleStepChange]);

  const isAtLast = useMemo((): boolean => {
    return (!config?.steps?.input && currentStep === visibleSections.length)
      || (Boolean(config?.steps?.input) && currentStep === visibleSections.length + 1);
  }, [currentStep, visibleSections.length, config?.steps?.input]);

  // Helper function to check if a section should be displayed based on conditional logic
  const shouldShowSection = useCallback((section: any) => {
    if (!section.watchField || !section.showWhen) return true;
    
    // Get the value of the watched field from all form data
    let watchedValue = '';
    try {
      for (const sectionData of Object.values(wizardData.sections || {})) {
        const formData = (sectionData as any)?.formData || {};
        if (formData.hasOwnProperty(section.watchField)) {
          watchedValue = formData[section.watchField] || '';
          break;
        }
      }
    } catch {}
    
    // Debug logging for conditional sections
    try {
      console.debug('[Conditional Section]', {
        sectionId: section.id,
        watchField: section.watchField,
        showWhen: section.showWhen,
        currentValue: watchedValue,
        shouldShow: watchedValue === section.showWhen,
        allFormData: Object.fromEntries(
          Object.values(wizardData.sections || {}).map((s: any, i) => [
            i, (s?.formData || {})
          ])
        )
      });
    } catch {}
    
    // Check if the condition is met
    return watchedValue === section.showWhen;
  }, [wizardData, wizardData.sections]);

  return {
    currentStep,
    setCurrentStep,
    wizardData,
    handleStepChange,
    handleDataUpdate,
    finalStepIndex,
    goPrev,
    isAtLast,
    shouldShowSection,
    triggerRerender
  };
};
