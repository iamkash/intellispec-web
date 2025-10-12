import { Button, Card, Space, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useOpenAI } from '../../../../../../hooks/useOpenAI';
import { getOpenAIConfig } from '../../../../../../utils/config';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';
import { getIconForSection } from '../utils/iconUtils';
import { FormSection } from './FormSection';
import { GridSection } from './GridSection';
import { ImageSectionClean } from './ImageSectionClean';
import { SectionImageAnalysis } from './SectionImageAnalysis';
import { VoiceSection } from './VoiceSection';

interface SectionStepProps {
  section: any;
  sectionIndex: number;
  sections: any[];
  wizardData: AIAnalysisWizardData;
  updateSectionData: (sectionIndex: number, update: any) => void;
  openAI: any;
  config: AIAnalysisWizardConfig;
  getFormFieldValue: (fieldId: string) => any;
  disabledFields?: string[];
}

export const SectionStep: React.FC<SectionStepProps> = ({
  section,
  sectionIndex,
  sections,
  wizardData,
  updateSectionData,
  openAI,
  config,
  getFormFieldValue,
  disabledFields = []
}) => {
  const data = (wizardData.sections || [])[sectionIndex] || {};
  const openAIHook = useOpenAI(getOpenAIConfig());
  const [populateLoading, setPopulateLoading] = useState(false);
  
  console.log('[SectionStep] Rendering section:', {
    sectionId: section.id,
    sectionIndex,
    sectionType: section.sectionType,
    hasFormGroups: !!section.form?.groups,
    formGroupsCount: section.form?.groups?.length || 0,
    totalFields: section.form?.groups?.reduce((count: number, g: any) => count + (g.fields?.length || 0), 0) || 0,
    hasImageAnalysis: !!(section.imageAnalysisPrompt || section.imageAnalysisPromptRef),
    hasFormData: !!data?.formData,
    formDataKeys: data?.formData ? Object.keys(data.formData) : [],
    // CRITICAL: Show what rendering conditions will trigger
    renderingConditions: {
      willRenderVoice: section.sectionType === 'voice',
      willRenderImage: section.sectionType === 'image',
      willRenderForm: !!section.form?.groups,
      willRenderGrid: !!(section as any).grid,
      willRenderAIAnalysis: !!(section.imageAnalysisPrompt || section.imageAnalysisPromptRef)
    },
    sectionStructure: {
      hasForm: !!section.form,
      hasGrid: !!(section as any).grid,
      formKeys: section.form ? Object.keys(section.form) : [],
      gridTitle: (section as any).grid?.title,
      gridDataKey: (section as any).grid?.dataKey,
      gridColumns: (section as any).grid?.columns?.length || 0,
      hasPromptRef: !!section.promptRef,
      hasBtnLabel: !!section.btnLabel,
      groups: section.form?.groups?.map((g: any) => ({
        id: g.id,
        title: g.title,
        fieldCount: g.fields?.length || 0
      })) || []
    }
  });

  // Handle AI populate button for form sections
  const handlePopulate = useCallback(async () => {
    if (!section.promptRef || !openAIHook) return;
    
    try {
      // Get prompt configuration from metadata
      const promptConfig = (config as any)?.prompts?.[section.promptRef];
      if (!promptConfig) {
        message.error(`Prompt configuration "${section.promptRef}" not found in metadata`);
        return;
      }

      // Build context from available data
      const context = {
        sectionTitle: section.title,
        sectionDescription: section.description,
        currentFormData: data?.formData || {},
        allFormData: {} as Record<string, any>
      };
      
      // Collect all form data from wizard
      for (const field of section.form?.groups?.flatMap((g: any) => g.fields || []) || []) {
        const value = getFormFieldValue(field.id);
        if (value !== undefined && value !== '') {
          (context.allFormData as Record<string, any>)[field.id] = value;
        }
      }

      // Get available field IDs for this section
      const availableFields = section.form?.groups?.flatMap((g: any) => g.fields || []) || [];
      const fieldInfo = availableFields.map((f: any) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options
      }));

      const contextPrompt = `Based on the context below, populate the form fields for the "${section.title}" section.

Context:
${JSON.stringify(context, null, 2)}

Available Form Fields:
${JSON.stringify(fieldInfo, null, 2)}

IMPORTANT: Use the exact field IDs from the "Available Form Fields" list above as JSON keys.
Please provide form field values as a JSON object where keys are the exact field IDs (like "scope_description", "inspection_methods_used", etc.) and values are the populated data.
Only include fields that can be reasonably populated based on the context.`;

      // Get response ID from image analysis section for conversation continuity
      let prevId = null;
      
      // First, try to get response ID from AI analysis section data
      const aiAnalysisSection = wizardData.sections?.find((s: any) => s?.id === 'ai_analysis');
      if (aiAnalysisSection?.imageAnalysis?.previousResponseId) {
        prevId = aiAnalysisSection.imageAnalysis.previousResponseId;
        console.log(`🔗 Using response ID from AI analysis section imageAnalysis: ${prevId}`);
      }
      // Also check analysisData if it exists
      else if (aiAnalysisSection?.analysisData?.previousResponseId) {
        prevId = aiAnalysisSection.analysisData.previousResponseId;
        console.log(`🔗 Using response ID from AI analysis section analysisData: ${prevId}`);
      }
      // Fallback to global analysis data
      else if ((wizardData as any)?.analysisData?.previousResponseId) {
        prevId = (wizardData as any).analysisData.previousResponseId;
        console.log(`🔗 Using response ID from global analysis data: ${prevId}`);
      }
      // Final fallback to window storage
      else if ((window as any)?.__previousResponseId) {
        prevId = (window as any).__previousResponseId;
        console.log(`🔗 Using response ID from window storage: ${prevId}`);
      } else {
        console.log(`⚠️ No existing response ID found - populate will start new conversation thread`);
      }
      
      // Use the model and configuration from metadata with response API for continuity
      console.log(`🤖 Populate request for ${section.title}:`, {
        model: promptConfig.modelConfig?.model || 'gpt-5-nano',
        promptRef: section.promptRef,
        hasPreviousResponseId: !!prevId,
        previousResponseId: prevId
      });
      
      const result = await openAIHook.respond({
        text: contextPrompt,
        modelConfig: {
          model: promptConfig.modelConfig?.model || 'gpt-5-nano',
          temperature: promptConfig.modelConfig?.temperature || 0.2,
          maxTokens: promptConfig.modelConfig?.maxTokens,
          maxCompletionTokens: promptConfig.modelConfig?.maxCompletionTokens
        },
        promptConfig: {
          systemPrompt: promptConfig.promptConfig?.systemPrompt || 'You are a helpful assistant that populates form fields based on context. Always respond with valid JSON.',
          userPrompt: promptConfig.promptConfig?.userPrompt || '{text}'
        },
        responseFormat: 'json',
        store: true,
        previousResponseId: typeof prevId === 'string' ? prevId : undefined,
        reasoningEffort: 'low'
      });
      
      console.log(`🔍 Populate response for ${section.title}:`, {
        hasData: !!result?.data,
        dataType: typeof result?.data,
        dataLength: result?.data?.length || 0,
        responseId: result?.responseId,
        rawResult: result
      });

      if (result?.data) {
        try {
          // Try to parse as JSON
          const parsedData = JSON.parse(result.data);
          
          console.log(`📝 Parsed populate data for ${section.title}:`, {
            parsedDataType: typeof parsedData,
            parsedDataKeys: Object.keys(parsedData || {}),
            parsedData
          });
          
          if (typeof parsedData === 'object' && parsedData !== null) {
            // Update form data with populated values
            const currentFormData = data?.formData || {};
            const updatedFormData = { ...currentFormData, ...parsedData };
            
            console.log(`🔄 Updating form data for ${section.title}:`, {
              sectionIndex,
              currentFormDataKeys: Object.keys(currentFormData),
              newDataKeys: Object.keys(parsedData),
              updatedFormDataKeys: Object.keys(updatedFormData),
              currentFormData,
              newData: parsedData,
              updatedFormData
            });
            
            // Save response ID for conversation continuity
            if (result.responseId) {
              (window as any).__previousResponseId = result.responseId;
              
              // Also save in wizard data for persistence
              const currentAnalysisData = (wizardData as any)?.analysisData || {};
              updateSectionData(sectionIndex, { 
                formData: updatedFormData,
                analysisData: { ...currentAnalysisData, previousResponseId: result.responseId }
              });
              
              console.log(`💾 Saved response ID for continuity: ${result.responseId}`);
            } else {
              updateSectionData(sectionIndex, { formData: updatedFormData });
            }
            
            message.success(`Populated ${Object.keys(parsedData).length} field(s) using AI`);
          } else {
            message.warning('AI returned invalid data format');
          }
        } catch (parseError) {
          // If not valid JSON, treat as text and try to extract key-value pairs
          message.warning('AI returned non-JSON response. Please populate fields manually.');
        }
      }
    } catch (error) {
      console.error('Error populating form:', error);
      message.error('Failed to populate form with AI');
    }
  }, [section, data, updateSectionData, sectionIndex, getFormFieldValue, openAIHook]);

  // Listen for auto-populate events from wizard navigation
  useEffect(() => {
    const handleAutoPopulate = (event: CustomEvent) => {
      const { sectionIndex: targetSectionIndex, sectionId, promptRef, isForm } = event.detail;
      
      // Only respond if this is the target form section
      if (targetSectionIndex === sectionIndex && 
          sectionId === section.id && 
          promptRef === section.promptRef &&
          isForm &&
          section.form?.groups) {
        
        console.log(`🤖 Auto-populating form section: ${section.title}`);
        setPopulateLoading(true);
        
        // Trigger the populate function
        handlePopulate().finally(() => {
          setPopulateLoading(false);
        });
      }
    };

    window.addEventListener('wizard-auto-populate', handleAutoPopulate as EventListener);
    
    return () => {
      window.removeEventListener('wizard-auto-populate', handleAutoPopulate as EventListener);
    };
  }, [sectionIndex, section.id, section.promptRef, section.title, section.form?.groups, handlePopulate]);

  return (
    <Card
      className="glass-card wizard-card"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <Space direction="vertical" size={0} style={{ flex: 1 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {getIconForSection(section)}
              <span>{section.title}</span>
            </span>
            {section.description && (
              <span style={{ fontSize: 12, opacity: 0.8 }}>{section.description}</span>
            )}
          </Space>
          
          {/* Populate Button in Header */}
          {section.promptRef && section.form?.groups && (
            <Button 
              size="small" 
              loading={openAIHook?.loading || populateLoading} 
              onClick={handlePopulate}
              style={{ 
                backgroundColor: 'hsl(var(--primary))', 
                borderColor: 'hsl(var(--primary))', 
                color: 'hsl(var(--primary-foreground))',
                marginLeft: 12,
                flexShrink: 0
              }}
            >
              {section.btnLabel || 'Populate with AI'}
            </Button>
          )}
        </div>
      }
      style={{ borderRadius: 'var(--radius)', marginTop: 8, marginBottom: 12 }}
      headStyle={{ padding: '6px 10px' }}
      bodyStyle={{ padding: 8 }}
    >
      <div className="section-body">
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          {/* Voice Section */}
          {section.sectionType === 'voice' && (
            <VoiceSection 
              section={section}
              sectionIndex={sectionIndex}
              data={data}
              updateSectionData={updateSectionData}
              config={config}
            />
          )}
          
        {/* Image Section - Clean GridFS Implementation */}
        {section.sectionType === 'image' && (
          <ImageSectionClean 
            section={section}
            sectionIndex={sectionIndex}
            wizardData={wizardData}
            updateSectionData={updateSectionData}
            config={config}
          />
        )}
          
          {/* Form Section */}
          {section.form?.groups && (
            <FormSection 
              section={section}
              sectionIndex={sectionIndex}
              data={data}
              updateSectionData={updateSectionData}
              getFormFieldValue={getFormFieldValue}
              disabledFields={disabledFields}
            />
          )}
          
          {/* Grid Section */}
          {(section as any).grid && (
            <GridSection 
              section={section}
              sectionIndex={sectionIndex}
              sections={sections}
              wizardData={wizardData}
              data={data}
              updateSectionData={updateSectionData}
              openAI={openAI}
              config={config}
            />
          )}
          
          {/* AI Analysis Section */}
          {(section.imageAnalysisPrompt || section.imageAnalysisPromptRef) && (
            <SectionImageAnalysis 
              sectionIndex={sectionIndex}
              sections={sections}
              wizardData={wizardData}
              updateSectionData={updateSectionData}
              gadget={null}
              triggerRerender={() => {}}
            />
          )}
        </Space>
      </div>
    </Card>
  );
};