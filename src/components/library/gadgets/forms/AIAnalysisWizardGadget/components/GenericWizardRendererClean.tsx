/**
 * GenericWizardRendererClean - Clean implementation of wizard renderer
 * 
 * This component:
 * 1. Uses clean state management
 * 2. Never handles base64 images
 * 3. Only works with GridFS references
 * 4. Provides simple, maintainable code
 */

import { Menu } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { useInspectionSave } from '../../../../../../hooks/useInspectionSave';
import { useOpenAI } from '../../../../../../hooks/useOpenAI';
import { getOpenAIConfig } from '../../../../../../utils/config';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';
import {
    convertInspectionToWizardData,
    getStableRestoreIdFromUrl,
    tryFetchRecordFromApi
} from '../utils';
import { getStepItems } from '../utils/iconUtils';
import { InputStep } from './InputStep';
import { PDFStep } from './PDFStep';
import { SectionStep } from './SectionStep';
import { WizardFooter } from './WizardFooter';

interface GenericWizardRendererCleanProps {
    gadget: any;
    config: AIAnalysisWizardConfig;
}

export const GenericWizardRendererClean: React.FC<GenericWizardRendererCleanProps> = ({ 
    gadget, 
    config 
}) => {
    const { user } = useAuth();
    const openAI = useOpenAI(getOpenAIConfig());
    const sections = config.steps.sections || [];
    
    // Simple state management
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [wizardData, setWizardData] = useState<AIAnalysisWizardData>({
        currentStep: 0,
        completedSteps: [],
        sections: [],
        voiceData: {},
        imageData: [], // Will only contain GridFS references
        analysisData: {}
    });

    const { saveSectionProgress, inspectionId, setInspectionId } = useInspectionSave();

    // Load existing inspection data if available
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const id = getStableRestoreIdFromUrl();
                if (id) {
                    console.log('[Wizard] Loading existing inspection:', id);
                    const payload = await tryFetchRecordFromApi(id);
                    
                    if (payload && payload.type === 'inspection') {
                        const converted = convertInspectionToWizardData(payload);
                        
                        // Clean any base64 images that might exist in old data
                        if (converted.sections) {
                            converted.sections = converted.sections.map((section: any) => {
                                if (section?.images) {
                                    // Only keep GridFS images
                                    section.images = section.images.filter((img: any) => 
                                        img.type === 'gridfs' || 
                                        (img.url && img.url.startsWith('/api/uploads/'))
                                    );
                                }
                                return section;
                            });
                        }
                        
                        setWizardData({
                            currentStep: converted.currentStep || 0,
                            completedSteps: converted.completedSteps || [],
                            sections: converted.sections || [],
                            voiceData: converted.voiceData || {},
                            imageData: converted.imageData || [],
                            analysisData: converted.analysisData || {}
                        });
                        setCurrentStep(converted.currentStep || 0);
                        setInspectionId(payload.id);
                        
                        console.log('[Wizard] Loaded inspection with GridFS images only');
                    }
                }
            } catch (error) {
                console.error('[Wizard] Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [setInspectionId]);

    // Get form field value helper
    const getFormFieldValue = useCallback((fieldId: string): any => {
        for (const section of wizardData.sections || []) {
            if (section?.formData && section.formData[fieldId] !== undefined) {
                return section.formData[fieldId];
            }
        }
        return undefined;
    }, [wizardData.sections]);

    // Update section data
    const updateSectionData = useCallback((sectionIndex: number, update: any) => {
        setWizardData(prev => {
            const next = { ...prev };
            next.sections = [...(next.sections || [])];
            
            // Ensure section exists
            while (next.sections.length <= sectionIndex) {
                const newSectionIndex = next.sections.length;
                next.sections.push({
                    id: sections[newSectionIndex]?.id || `section_${newSectionIndex}`,
                    title: sections[newSectionIndex]?.title || `Section ${newSectionIndex}`,
                    formData: {}
                });
            }
            
            // Update section
            next.sections[sectionIndex] = {
                ...next.sections[sectionIndex],
                ...update
            };
            
            return next;
        });
    }, [sections]);

    // Handle step completion - CLEAN VERSION
    const handleStepComplete = useCallback(async () => {
        // Prevent multiple simultaneous executions
        if ((window as any).__stepCompleting) {
            console.log('[Wizard] Step completion already in progress');
            return;
        }
        
        (window as any).__stepCompleting = true;
        console.log('[Wizard] Completing step:', currentStep);
        
        try {
            const currentSection = sections[currentStep];
            const currentSectionData = wizardData.sections?.[currentStep];
            
            // Build form data from all sections
            const allFormData: any = {};
            wizardData.sections?.forEach((section: any) => {
                if (section?.formData) {
                    Object.assign(allFormData, section.formData);
                }
            });
            
            // Prepare section data for save - NO BASE64 FILTERING NEEDED!
            const sectionData = {
                sectionId: currentSection?.id || `step_${currentStep}`,
                inspectionType: allFormData.inspection_type || 'inspection',
                workspaceId: (config as any)?.id,
                isStepCompletion: true,
                formData: allFormData,
                sections: currentSectionData ? [currentSectionData] : [], // Already clean!
                grids: {},
                aiAnalysis: {
                    voice: wizardData.voiceData || {},
                    images: [], // Only GridFS references if any
                    results: wizardData.analysisData?.analysisResults || [],
                    markdownReport: wizardData.analysisData?.markdownReport || '',
                    transcription: wizardData.voiceData?.transcription || ''
                },
                attachments: [], // Only GridFS references if any
                wizardState: {
                    currentStep,
                    completedSteps: wizardData.completedSteps || [],
                    sections: wizardData.sections || [] // Already clean!
                }
            };
            
            // Simple lightweight wizard data
            const lightweightWizardData = {
                currentStep,
                completedSteps: wizardData.completedSteps || [],
                sections: (wizardData.sections || []).map((s: any) => ({
                    id: s?.id,
                    title: s?.title
                    // No images or complex data
                }))
            };
            
            // Save to backend
            const saveResult = await saveSectionProgress(
                sectionData.sectionId, 
                sectionData, 
                lightweightWizardData
            );
            
            console.log('[Wizard] Save completed:', {
                inspectionId: saveResult?.id,
                sectionId: sectionData.sectionId
            });
            
            // Move to next step
            const nextStep = currentStep + 1;
            const newCompletedSteps = [...(wizardData.completedSteps || [])];
            if (!newCompletedSteps.includes(currentStep)) {
                newCompletedSteps.push(currentStep);
            }
            
            setCurrentStep(nextStep);
            setWizardData(prev => ({
                ...prev,
                currentStep: nextStep,
                completedSteps: newCompletedSteps
            }));
            
        } catch (error) {
            console.error('[Wizard] Error completing step:', error);
        } finally {
            (window as any).__stepCompleting = false;
        }
    }, [currentStep, wizardData, sections, config, saveSectionProgress]);

    // Navigation handlers
    const handleStepChange = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    const goPrev = useCallback(() => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    }, []);

    // Visible sections logic
    const shouldShowSection = useCallback((section: any) => {
        if (!section.watchField || !section.showWhen) return true;
        
        const fieldValue = getFormFieldValue(section.watchField);
        const showWhenValues = Array.isArray(section.showWhen) 
            ? section.showWhen 
            : String(section.showWhen).split(',').map(s => s.trim());
        
        const match = showWhenValues.includes(String(fieldValue));
        return section.showOnMatch === false ? !match : match;
    }, [getFormFieldValue]);

    const visibleSections = useMemo(() => {
        return sections.filter(shouldShowSection);
    }, [sections, shouldShowSection]);

    const menuItems = useMemo(() => {
        const items = getStepItems(config, visibleSections);
        // Ensure each item has a key property
        return items.map((item: any, index: number) => ({
            ...item,
            key: item.key || String(index)
        }));
    }, [config, visibleSections]);

    const finalStepIndex = visibleSections.length;
    const isAtLast = currentStep === finalStepIndex;

    // Get current section index
    const getSectionIndex = (step: number) => {
        const adjustedStep = config.steps.input ? step - 1 : step;
        if (adjustedStep < 0 || adjustedStep >= visibleSections.length) return -1;
        return sections.findIndex(s => s.id === visibleSections[adjustedStep]?.id);
    };

    const sectionIndex = getSectionIndex(currentStep);

    if (isLoading) {
        return <div className="wizard-loading">Loading inspection data...</div>;
    }

    return (
        <div className="ai-analysis-wizard-gadget">
            <div className="wizard-content">
                <div className="wizard-sidebar">
                    <Menu
                        mode="inline"
                        selectedKeys={[String(currentStep)]}
                        items={menuItems}
                        onSelect={({ key }) => handleStepChange(Number(key))}
                    />
                </div>
                <div className="wizard-main">
                    <div className="wizard-body">
                        {/* Input Step */}
                        {config.steps.input && currentStep === 0 && (
                            <InputStep
                                config={config}
                                wizardData={wizardData}
                                handleDataUpdate={(data) => setWizardData(prev => ({ ...prev, ...data }))}
                                handleStepComplete={handleStepComplete}
                            />
                        )}
                        
                        {/* Section Steps */}
                        {sectionIndex >= 0 && (
                            <SectionStep
                                section={sections[sectionIndex]}
                                sectionIndex={sectionIndex}
                                sections={sections}
                                wizardData={wizardData}
                                updateSectionData={updateSectionData}
                                openAI={openAI}
                                config={config}
                                getFormFieldValue={getFormFieldValue}
                            />
                        )}
                        
                        {/* PDF Step */}
                        {(!config.steps.input && currentStep === visibleSections.length) && (
                            <PDFStep 
                                config={config}
                                sections={sections}
                                wizardData={wizardData}
                            />
                        )}
                    </div>
                    
                    <WizardFooter
                        gadget={gadget}
                        currentStep={currentStep}
                        totalSteps={visibleSections.length}
                        isAtLast={isAtLast}
                        goPrev={goPrev}
                        handleStepComplete={handleStepComplete}
                    />
                </div>
            </div>
        </div>
    );
};

export default GenericWizardRendererClean;
