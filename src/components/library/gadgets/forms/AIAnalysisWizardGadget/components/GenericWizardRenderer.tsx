import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { useInspectionSave } from '../../../../../../hooks/useInspectionSave';
import { useOpenAI } from '../../../../../../hooks/useOpenAI';
import { getOpenAIConfig } from '../../../../../../utils/config';
import { BaseGadget } from '../../../base';
import { AIAnalysisWizardGadget } from '../AIAnalysisWizardGadget';
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
import { WizardHeader } from './WizardHeader';
import { WizardSidebar } from './WizardSidebar';

interface GenericWizardRendererProps { 
  gadget: AIAnalysisWizardGadget; 
  config: AIAnalysisWizardConfig; 
}

export const GenericWizardRenderer: React.FC<GenericWizardRendererProps> = ({ gadget, config }) => {
  const { user } = useAuth();
  const sections = config.steps.sections || [];
  
  console.log('[GenericWizardRenderer] Config analysis:', {
    hasConfig: !!config,
    hasSteps: !!config.steps,
    hasSections: !!config.steps?.sections,
    sectionsCount: sections.length,
    sampleSections: sections.slice(0, 5).map((s: any) => ({
      id: s?.id,
      title: s?.title,
      hasForm: !!s?.form,
      formGroupsCount: s?.form?.groups?.length || 0,
      hasGrid: !!(s as any)?.grid,
      gridTitle: (s as any)?.grid?.title
    }))
  });
  
  // SIMPLE STATE MANAGEMENT - React owns all state
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wizardData, setWizardData] = useState<AIAnalysisWizardData>({
    currentStep: 0,
    completedSteps: [],
    sections: [],
    voiceData: {},
    imageData: [],
    analysisData: {}
  });

  const { saveSectionProgress, inspectionId, setInspectionId } = useInspectionSave();
  const openAI = useOpenAI(getOpenAIConfig());

  // SIMPLE DATA LOADING - Load data first, then render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if we need to restore existing inspection data
        const inspectionId = getStableRestoreIdFromUrl();
        
        if (inspectionId) {
          console.log('[Wizard] Loading existing inspection:', inspectionId);
          const payload = await tryFetchRecordFromApi(inspectionId);
          
          if (payload && payload.type === 'inspection') {
            // Convert inspection data to wizard format
            const converted = convertInspectionToWizardData(payload);
            
            const wizardDataToSet = {
              currentStep: converted.currentStep || 0,
              completedSteps: converted.completedSteps || [],
              sections: converted.sections || [],
              voiceData: converted.voiceData || {},
              imageData: converted.imageData || [],
              analysisData: converted.analysisData || {},
              // CRITICAL FIX: Include globalFormData for field value lookup
              globalFormData: (converted as any).globalFormData
            } as any;
            
            
            setWizardData(wizardDataToSet);
            setCurrentStep(converted.currentStep || 0);
            setInspectionId(payload.id);
            
            // CRITICAL: Also update the gadget's internal state
            gadget.updateWizardData(wizardDataToSet);
            
          }
        } else {
          // Check for asset data population on new inspection
          const assetDataPopulation = config.assetDataPopulation;
          if (assetDataPopulation?.enabled) {
            const urlParams = new URLSearchParams(window.location.search);
            const assetId = urlParams.get('asset_id');
            
            if (assetId) {
              console.log('[Wizard] Loading asset data for asset ID:', assetId);
              await populateAssetData(assetId, assetDataPopulation);
            }
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

  // Asset data population function
  const populateAssetData = async (assetId: string, config: any) => {
    try {
      const response = await BaseGadget.makeAuthenticatedFetch(`${config.apiEndpoint}?type=asset&id=${assetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch asset data: ${response.statusText}`);
      }

      const result = await response.json();
      const assetData = result.data?.[0] || result.data;

      if (assetData) {
        console.log('[Wizard] Asset data loaded:', assetData);
        
        // Get fields that should be populated from asset
        const fieldsToPopulate = config.steps?.fields?.filter((field: any) => field.populateFromAsset) || [];
        
        // Create form data object with asset values
        const populatedFormData: any = {};
        const disabledFields: string[] = [];

        fieldsToPopulate.forEach((field: any) => {
          const assetField = field.populateFromAsset;
          const assetValue = assetData[assetField];
          
          if (assetValue !== undefined && assetValue !== null && assetValue !== '') {
            populatedFormData[field.id] = assetValue;
            if (config.disablePopulatedFields) {
              disabledFields.push(field.id);
            }
          }
        });

        // Update wizard data with populated values
        setWizardData(prev => ({
          ...prev,
          globalFormData: {
            ...prev.globalFormData,
            ...populatedFormData
          },
          disabledFields: disabledFields
        }));

        console.log('[Wizard] Form populated with asset data:', populatedFormData);
        console.log('[Wizard] Disabled fields:', disabledFields);
      }
    } catch (error) {
      console.error('[Wizard] Error populating asset data:', error);
    }
  };

  // Helper function to get form field value
  const getFormFieldValue = useCallback((fieldId: string): any => {
    // First, check individual section formData
    if (wizardData?.sections) {
      for (const section of wizardData.sections) {
        if (section?.formData && section.formData[fieldId] !== undefined) {
          console.log(`[getFormFieldValue] Found ${fieldId} in section ${section.id}:`, section.formData[fieldId]);
          return section.formData[fieldId];
        }
      }
    }
    
    // CRITICAL FIX: Also check global formData from restored inspection
    if ((wizardData as any)?.globalFormData && (wizardData as any).globalFormData[fieldId] !== undefined) {
      console.log(`[getFormFieldValue] Found ${fieldId} in globalFormData:`, (wizardData as any).globalFormData[fieldId]);
      return (wizardData as any).globalFormData[fieldId];
    }
    
    console.log(`[getFormFieldValue] Field ${fieldId} not found anywhere:`, {
      sectionsCount: wizardData?.sections?.length || 0,
      hasGlobalFormData: !!((wizardData as any)?.globalFormData),
      globalFormDataKeys: (wizardData as any)?.globalFormData ? Object.keys((wizardData as any).globalFormData).slice(0, 5) : []
    });
    
    return undefined;
  }, [wizardData.sections, (wizardData as any)?.globalFormData]);

         // Update section data with loop prevention
         const updateSectionData = useCallback((sectionIndex: number, update: any) => {
           // Prevent infinite loops by checking if update is actually different
           setWizardData(prev => {
             const currentSection = (prev.sections || [])[sectionIndex];
             
             // Check if update would actually change anything
             if (currentSection && update) {
               const hasActualChanges = Object.keys(update).some(key => {
                 const currentValue = (currentSection as any)[key];
                 const newValue = (update as any)[key];
                 
                 // Deep comparison for arrays (like images)
                 if (Array.isArray(currentValue) && Array.isArray(newValue)) {
                   return JSON.stringify(currentValue) !== JSON.stringify(newValue);
                 }
                 
                 return currentValue !== newValue;
               });
               
               if (!hasActualChanges) {
                 console.log(`[updateSectionData] No changes detected for section ${sectionIndex}, skipping update`);
                 return prev; // Return same reference to prevent re-render
               }
             }
             
             const next = { ...prev };
             next.sections = [...(next.sections || [])];
             
             // Ensure we have a section at the index
             while (next.sections.length <= sectionIndex) {
               const newSectionIndex = next.sections.length;
               next.sections.push({
                 id: sections[newSectionIndex]?.id || `section_${newSectionIndex}`,
                 title: sections[newSectionIndex]?.title || `Section ${newSectionIndex}`,
                 formData: {}
               });
             }
             
             const base = next.sections[sectionIndex] || { 
               id: sections[sectionIndex]?.id || `section_${sectionIndex}`, 
               title: sections[sectionIndex]?.title || `Section ${sectionIndex}` 
             };
             
             next.sections[sectionIndex] = { ...base, ...update };
             
             return next;
           });
         }, [sections]);

         // Navigation handlers
         const handleStepChange = useCallback((step: number) => {
           setCurrentStep(step);
           setWizardData(prev => ({ ...prev, currentStep: step }));
         }, []);

  const handleDataUpdate = useCallback((data: Partial<AIAnalysisWizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  }, []);

  const goPrev = useCallback(() => {
    const prev = Math.max(0, currentStep - 1);
    handleStepChange(prev);
  }, [currentStep, handleStepChange]);

  // Fullscreen and navigation handlers
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    // Navigate back to previous screen with intelligent fallback
    console.log('[Wizard] Close requested - navigating back');
    
    // Get current URL to understand context
    const currentUrl = new URL(window.location.href);
    const currentWorkspace = currentUrl.searchParams.get('workspace');
    
    // Try to determine the appropriate back navigation
    let targetUrl = null;
    
    // If we're in a wizard workspace, try to navigate to the parent inspections list
    if (currentWorkspace && currentWorkspace.includes('wizard')) {
      // Extract the base workspace path (e.g., "intelliINSPECT/inspections" from "intelliINSPECT/pipework-inspection-wizard")
      const workspaceParts = currentWorkspace.split('/');
      if (workspaceParts.length >= 2) {
        // First try the inspections workspace, but if that doesn't exist, fall back to home
        const baseWorkspace = `${workspaceParts[0]}/inspections`;
        const homeWorkspace = `${workspaceParts[0]}/home`;
        
        // Check if inspections workspace exists by trying to fetch it
        const checkWorkspaceExists = async (workspace: string) => {
          try {
            const response = await fetch(`/data/workspaces/${workspace}.json`);
            return response.ok;
          } catch {
            return false;
          }
        };
        
        // Use async IIFE to handle the check
        (async () => {
          const inspectionsExists = await checkWorkspaceExists(baseWorkspace);
          const finalWorkspace = inspectionsExists ? baseWorkspace : homeWorkspace;
          const finalUrl = `${window.location.origin}/?workspace=${encodeURIComponent(finalWorkspace)}`;
          
          console.log(`[Wizard] Workspace check - inspections exists: ${inspectionsExists}, using: ${finalWorkspace}`);
          
          // Add a temporary flag to prevent the auto-default menu selection
          sessionStorage.setItem('wizard-close-navigation', 'true');
          
          // Navigate to the final workspace
          window.location.replace(finalUrl);
        })();
        
        return; // Exit early since we're handling navigation asynchronously
      }
    }
    
    // Fallback to referrer if no specific target determined
    if (!targetUrl) {
      const referrer = document.referrer;
      if (referrer && referrer !== window.location.href) {
        // Check if referrer is the home page, try to improve it
        const referrerUrl = new URL(referrer);
        const referrerWorkspace = referrerUrl.searchParams.get('workspace');
        
        if (referrerWorkspace && referrerWorkspace.endsWith('/home') && currentWorkspace) {
          // If referrer is home but we're in a specific module, go to that module's main page
          const workspaceParts = currentWorkspace.split('/');
          if (workspaceParts.length >= 2) {
            const moduleWorkspace = `${workspaceParts[0]}/inspections`;
            targetUrl = `${window.location.origin}/?workspace=${encodeURIComponent(moduleWorkspace)}`;
            console.log(`[Wizard] Improved navigation from home to: ${moduleWorkspace}`);
          }
        } else {
          targetUrl = referrer;
        }
      }
    }
    
    // Execute navigation with a flag to prevent auto-redirect
    if (targetUrl) {
      console.log(`[Wizard] Navigating to: ${targetUrl}`);
      
      // Add a temporary flag to prevent the auto-default menu selection
      sessionStorage.setItem('wizard-close-navigation', 'true');
      
      // Use window.location.replace instead of href to avoid history issues
      window.location.replace(targetUrl);
    } else if (window.history.length > 1) {
      // Use history.back() but force a page reload
      console.log('[Wizard] Using history.back() with reload');
      sessionStorage.setItem('wizard-close-navigation', 'true');
      window.history.back();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Final fallback: navigate to root
      console.log('[Wizard] Fallback to root');
      const rootPath = window.location.origin + '/';
      window.location.replace(rootPath);
    }
  }, []);

  // Helper function to get logged-in user's full name
  const getLoggedInUserName = useCallback(() => {
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user && user.email) {
      return user.email.split('@')[0];
    }
    return 'Unknown User';
  }, [user]);

         // Step completion handler with loop prevention
         const handleStepComplete = useCallback(async () => {
           // Prevent multiple simultaneous executions
           if ((window as any).__stepCompleting) {
             console.log('[Wizard] Step completion already in progress, skipping');
             return;
           }
           
           // Debounce rapid clicks
           const now = Date.now();
           if ((window as any).__lastStepCompleteTime && now - (window as any).__lastStepCompleteTime < 1000) {
             console.log('[Wizard] Step completion called too quickly, debouncing');
             return;
           }
           (window as any).__lastStepCompleteTime = now;
           
           (window as any).__stepCompleting = true;
           console.log('[Wizard] Step complete:', currentStep);
           
           try {
             // Save to inspection database
             const getInspectionTypeFromMetadata = () => {
        return (config as any)?.inspectionType || (config as any)?.equipmentType || 'inspection';
      };

      // Build complete form data from all sections
      const allFormData: any = {};
      wizardData.sections?.forEach((section: any) => {
        if (section?.formData) {
          Object.assign(allFormData, section.formData);
        }
      });
      
      console.log('[Wizard] Form data collected:', {
        allFormDataKeys: Object.keys(allFormData),
        inspection_type: allFormData.inspection_type,
        detected_equipment_type: allFormData.detected_equipment_type,
        inspection_date: allFormData.inspection_date,
        metadataInspectionType: getInspectionTypeFromMetadata()
      });

      // Map equipment type to human-readable format
      const getHumanReadableEquipmentType = (type: string) => {
        const typeMap: Record<string, string> = {
          'pressure_vessel': 'Pressure Vessel',
          'storage_tank': 'Storage Tank', 
          'heat_exchanger': 'Heat Exchanger',
          'piping': 'Piping System',
          'pump': 'Pump',
          'compressor': 'Compressor',
          'turbine': 'Turbine'
        };
        return typeMap[type] || type;
      };

      const finalFormData = {
        ...allFormData,
        // Fix equipment ID mapping - use asset name for display
        equipmentId: allFormData.equipment_id || allFormData.assetName || '',
        // Fix equipment type mapping with human-readable labels
        equipmentType: getHumanReadableEquipmentType(allFormData.detected_equipment_type || getInspectionTypeFromMetadata()),
        // Fix inspection date mapping - ensure proper field name
        inspectionDate: allFormData.inspection_date || new Date(),
        // Fix inspector name mapping
        inspectorName: allFormData.inspector_name || getLoggedInUserName(),
        location: allFormData.location || ''
      };

      // Get current section data only (prevents processing images from other sections)
      const currentSectionData = (wizardData.sections || [])[currentStep] || {};
      const currentSection = sections[currentStep];
      
      console.log(`[handleStepComplete] Preparing section data for ${currentSection?.id}:`, {
        sectionId: currentSection?.id,
        sectionIndex: currentStep,
        sectionType: (currentSection as any)?.sectionType,
        hasCurrentSectionData: !!currentSectionData,
        currentSectionKeys: Object.keys(currentSectionData),
        hasImages: !!(currentSectionData as any)?.images,
        imagesCount: ((currentSectionData as any)?.images || []).length,
        sampleImage: ((currentSectionData as any)?.images || [])[0] ? {
          name: ((currentSectionData as any).images)[0].name,
          url: ((currentSectionData as any).images)[0].url,
          hasGridfsId: !!((currentSectionData as any).images)[0].gridfsId
        } : null
      });
      
             // CRITICAL FIX: Filter out base64 images from current section before sending
             const cleanCurrentSectionData = currentSectionData ? {
               ...currentSectionData,
               images: (currentSectionData.images || []).filter((img: any) => {
                 const isBase64 = img?.url && (img.url.startsWith('data:') || img.url.includes('base64'));
                 const isGridFS = img?.url && img.url.startsWith('/api/uploads/image/');
                 const hasGridfsId = !!img?.gridfsId;
                 
                 console.log(`🔍 FRONTEND: Checking image in sectionData:`, {
                   name: img?.name,
                   urlStart: img?.url?.substring(0, 50),
                   isBase64,
                   isGridFS,
                   hasGridfsId,
                   willKeep: !isBase64 && (isGridFS || hasGridfsId)
                 });
                 
                 if (isBase64) {
                   console.log(`🚫 FRONTEND: Blocking base64 image from sectionData:`, {
                     name: img.name,
                     urlStart: img.url?.substring(0, 50) + '...'
                   });
                   return false;
                 }
                 
                 // Keep GridFS images
                 return isGridFS || hasGridfsId;
               })
             } : null;
             
             console.log(`🔍 FRONTEND: cleanCurrentSectionData result:`, {
               hasCurrentSectionData: !!currentSectionData,
               originalImagesCount: currentSectionData?.images?.length || 0,
               cleanedImagesCount: cleanCurrentSectionData?.images?.length || 0,
               cleanedImages: cleanCurrentSectionData?.images?.map((img: any) => ({
                 name: img?.name,
                 hasGridfsId: !!img?.gridfsId,
                 urlType: img?.url?.startsWith('/api/') ? 'gridfs' : 'unknown'
               })) || []
             });

             // CRITICAL FIX: Filter out base64 images from wizard sections before sending
             const cleanWizardSections = (wizardData.sections || []).map((s: any) => {
               if (!s) return null;
               
               const cleanImages = (s.images || []).filter((img: any) => {
                 const isBase64 = img?.url && (img.url.startsWith('data:') || img.url.includes('base64'));
                 const isGridFS = img?.url && img.url.startsWith('/api/uploads/image/');
                 const hasGridfsId = !!img?.gridfsId;
                 
                 console.log(`🔍 FRONTEND: Checking image in wizardState section ${s.id}:`, {
                   name: img?.name,
                   urlStart: img?.url?.substring(0, 50),
                   isBase64,
                   isGridFS,
                   hasGridfsId,
                   willKeep: !isBase64 && (isGridFS || hasGridfsId)
                 });
                 
                 if (isBase64) {
                   console.log(`🚫 FRONTEND: Blocking base64 image from wizardState section ${s.id}:`, {
                     name: img.name,
                     urlStart: img.url?.substring(0, 50) + '...'
                   });
                   return false;
                 }
                 
                 // Keep GridFS images
                 return isGridFS || hasGridfsId;
               });

               return {
                 id: s.id,
                 title: s.title,
                 // CRITICAL: Only include GridFS images, no base64
                 images: cleanImages,
                 imageAnalysis: s.imageAnalysis,
                 formData: s.formData || {},
                 textData: s.textData || '',
                 voiceData: s.voiceData || {}
               };
             });
             
             console.log(`🔍 FRONTEND: cleanWizardSections result:`, {
               sectionsCount: cleanWizardSections.length,
               sectionsWithImages: cleanWizardSections.filter((s: any) => s?.images?.length > 0).map((s: any) => ({
                 id: s.id,
                 imagesCount: s.images?.length || 0,
                 sampleImage: s.images?.[0] ? {
                   name: s.images[0].name,
                   hasGridfsId: !!s.images[0].gridfsId,
                   urlType: s.images[0].url?.startsWith('/api/') ? 'gridfs' : 'unknown'
                 } : null
               }))
             });

             const sectionData = {
               sectionId: currentSection?.id || `step_${currentStep}`,
               // CRITICAL FIX: Use form inspection_type value for top-level inspectionType
               inspectionType: allFormData.inspection_type || getInspectionTypeFromMetadata(),
               workspaceId: (config as any)?.id,
               isStepCompletion: true,
               formData: finalFormData,
               // CRITICAL FIX: Send cleaned current section (no base64 images)
               sections: cleanCurrentSectionData ? [cleanCurrentSectionData] : [],
               grids: {},
               aiAnalysis: {
                 voice: wizardData.voiceData || {},
                 images: (currentSection as any)?.sectionType === 'image' ? (wizardData.imageData || []).filter((img: any) => {
                   const isBase64 = img?.url && (img.url.startsWith('data:') || img.url.includes('base64'));
                   return !isBase64; // Only GridFS images in aiAnalysis
                 }) : [],
                 results: wizardData.analysisData?.analysisResults || [],
                 markdownReport: wizardData.analysisData?.markdownReport || 
                                // CRITICAL FIX: Also check section-specific imageAnalysis
                                (wizardData.sections || []).find((s: any) => s?.imageAnalysis?.overview)?.imageAnalysis?.overview || '',
                 transcription: wizardData.voiceData?.transcription || '',
                 previousResponseId: wizardData.analysisData?.previousResponseId || (window as any)?.__previousResponseId
               },
               // CRITICAL FIX: Only send GridFS attachments for image sections
               attachments: (currentSection as any)?.sectionType === 'image' ? (wizardData.imageData?.filter((img: any) => {
                 const isBase64 = img?.url && (img.url.startsWith('data:') || img.url.includes('base64'));
                 return !isBase64 && img.gridfsId; // Only GridFS images with gridfsId
               }).map((img: any) => ({
                 type: 'image',
                 url: img.url,
                 metadata: { uploadDate: new Date(), originalName: img.name },
                 gridfsId: img.gridfsId
               })) || []) : [],
               wizardState: {
                 currentStep,
                 completedSteps: wizardData.completedSteps || [],
                 // CRITICAL FIX: Send cleaned wizard sections (no base64 images)
                 sections: cleanWizardSections
               }
             };

             console.log(`🛡️ FRONTEND: Sending cleaned sectionData:`, {
               sectionId: sectionData.sectionId,
               sectionsCount: sectionData.sections?.length || 0,
               wizardSectionsCount: sectionData.wizardState?.sections?.length || 0,
               currentSectionImages: sectionData.sections?.[0]?.images?.length || 0,
               sampleCurrentSectionImage: sectionData.sections?.[0]?.images?.[0] ? {
                 hasGridfsId: !!(sectionData.sections[0].images[0] as any).gridfsId,
                 urlType: sectionData.sections[0].images[0].url?.startsWith('/api/') ? 'gridfs' : 'base64'
               } : null,
               wizardSectionWithImages: (() => {
                 const sectionWithImages = sectionData.wizardState?.sections?.find((s: any) => s?.images?.length > 0);
                 if (!sectionWithImages) return null;
                 
                 return {
                   id: sectionWithImages.id,
                   imagesCount: sectionWithImages.images?.length || 0,
                   sampleImage: sectionWithImages.images?.[0] ? {
                     hasGridfsId: !!(sectionWithImages.images[0] as any).gridfsId,
                     urlType: sectionWithImages.images[0].url?.startsWith('/api/') ? 'gridfs' : 'base64'
                   } : null
                 };
               })()
             });

             // CRITICAL FIX: Create wizard data with NO images at all
             const lightweightWizardData = {
               currentStep,
               completedSteps: wizardData.completedSteps || [],
               // CRITICAL: Completely exclude sections to prevent any image data
               sections: (wizardData.sections || []).map((s: any) => s ? {
                 id: s.id,
                 title: s.title,
                 // CRITICAL: Explicitly exclude all data that might contain images
               } : null),
               voiceData: wizardData.voiceData ? {
                 transcription: wizardData.voiceData.transcription
               } : {},
               // CRITICAL: Don't include imageData array at all
               analysisData: wizardData.analysisData ? {
                 previousResponseId: wizardData.analysisData.previousResponseId
               } : {}
             };
             
             console.log(`🚫 Lightweight wizard data (NO IMAGES):`, {
               sectionsCount: lightweightWizardData.sections?.length || 0,
               hasImageData: !!(wizardData as any)?.imageData,
               sampleSection: lightweightWizardData.sections?.[0] ? {
                 id: lightweightWizardData.sections[0].id,
                 hasImages: !!(lightweightWizardData.sections[0] as any)?.images,
                 keys: Object.keys(lightweightWizardData.sections[0])
               } : null
             });

      const saveResult = await saveSectionProgress(sectionData.sectionId, sectionData, lightweightWizardData);
      
      console.log(`[handleStepComplete] Save completed, updating wizard state with processed data:`, {
        hasSaveResult: !!saveResult,
        resultSections: saveResult?.sections?.length || 0,
        resultWizardState: !!saveResult?.wizardState
      });
      
      // CRITICAL FIX: Update wizard state with processed data from backend
      if (saveResult?.sections || saveResult?.wizardState?.sections) {
        setWizardData(prev => {
          const next = { ...prev };
          
          // CRITICAL FIX: Replace sections with processed data (GridFS references)
          if (saveResult.sections && Array.isArray(saveResult.sections)) {
            saveResult.sections.forEach((processedSection: any) => {
              if (processedSection?.id) {
                const sectionIndex = (next.sections || []).findIndex((s: any) => s?.id === processedSection.id);
                if (sectionIndex >= 0) {
                  next.sections = next.sections || [];
                  // CRITICAL: Completely replace section data, don't merge
                  next.sections[sectionIndex] = processedSection;
                  console.log(`🔄 Replaced frontend section ${processedSection.id} with processed data:`, {
                    hasImages: !!processedSection.images,
                    imagesCount: processedSection.images?.length || 0,
                    sampleImage: processedSection.images?.[0] ? {
                      hasGridfsId: !!processedSection.images[0].gridfsId,
                      urlType: processedSection.images[0].url?.startsWith('/api/') ? 'gridfs' : 'base64'
                    } : null
                  });
                }
              }
            });
          }
          
          // CRITICAL FIX: Replace global imageData with only processed GridFS references
          if (saveResult.sections?.some((s: any) => s?.images?.length > 0)) {
            const processedImages: any[] = [];
            saveResult.sections.forEach((s: any) => {
              if (s?.images) {
                // Only include images that have GridFS references
                const gridfsImages = s.images.filter((img: any) => img.gridfsId && img.type === 'gridfs');
                processedImages.push(...gridfsImages);
              }
            });
            
            if (processedImages.length > 0) {
              next.imageData = processedImages; // Replace, don't merge
              console.log(`🔄 Replaced global imageData with ${processedImages.length} GridFS images`);
            }
          }
          
          return next;
        });
      }
      
      // Move to next step
      const nextStep = currentStep + 1;
      const newCompletedSteps = [...(wizardData.completedSteps || [])];
      if (!newCompletedSteps.includes(currentStep)) {
        newCompletedSteps.push(currentStep);
      }
      
      setWizardData(prev => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: newCompletedSteps
      }));
      setCurrentStep(nextStep);
      
      // Auto-populate next step if it's a form section and not completed
      setTimeout(async () => {
        const nextSection = sections[nextStep];
        const isNextStepCompleted = newCompletedSteps.includes(nextStep);
        const hasAnalysisData = wizardData.analysisData || 
          wizardData.sections?.some((s: any) => s?.imageAnalysis || s?.analysisData);
        
        // Check for different types of promptRef (form sections vs grid sections)
        const formPromptRef = (nextSection as any)?.promptRef;
        const gridPromptRef = (nextSection as any)?.grid?.promptRef || (nextSection as any)?.grid?.populate?.promptRef;
        const hasAnyPromptRef = formPromptRef || gridPromptRef;
        const hasFormGroups = !!(nextSection as any)?.form?.groups;
        const hasGrid = !!(nextSection as any)?.grid;
        
        console.log(`🔍 Auto-populate check for step ${nextStep}:`, {
          hasNextSection: !!nextSection,
          nextSectionTitle: nextSection?.title,
          nextSectionId: nextSection?.id,
          isNextStepCompleted,
          hasFormPromptRef: !!formPromptRef,
          hasGridPromptRef: !!gridPromptRef,
          hasAnyPromptRef: !!hasAnyPromptRef,
          formPromptRef,
          gridPromptRef,
          hasAnalysisData,
          sectionType: (nextSection as any)?.sectionType,
          hasFormGroups,
          hasGrid
        });
        
        if (nextSection && 
            !isNextStepCompleted && 
            hasAnyPromptRef && 
            hasAnalysisData &&
            (nextSection as any)?.sectionType !== 'ai_analysis' &&
            (hasFormGroups || hasGrid)) {
          
          console.log(`🤖 Auto-populating next step: ${nextSection.title} (${nextSection.id})`);
          
          // Trigger AI populate for the next step
          const populateEvent = new CustomEvent('wizard-auto-populate', {
            detail: { 
              sectionIndex: nextStep,
              sectionId: nextSection.id,
              promptRef: formPromptRef || gridPromptRef,
              isGrid: !!hasGrid,
              isForm: !!hasFormGroups
            }
          });
          window.dispatchEvent(populateEvent);
        } else {
          console.log(`⏭️ Skipping auto-populate for step ${nextStep} - conditions not met`);
        }
      }, 500); // Small delay to ensure UI has updated
           } catch (error) {
             console.error('[Wizard] Error in step completion:', error);
           } finally {
             // Always clear the lock
             (window as any).__stepCompleting = false;
           }
}, [currentStep, wizardData, sections, config, saveSectionProgress, getLoggedInUserName]);

  // Conditional section logic
  const shouldShowSection = useCallback((section: any) => {
    if (!section.watchField || !section.showWhen) return true;
    
    let watchedValue = '';
    wizardData.sections?.forEach((sectionData: any) => {
      if (sectionData?.formData?.[section.watchField]) {
        watchedValue = sectionData.formData[section.watchField];
      }
    });
    
    return watchedValue === section.showWhen;
  }, [wizardData.sections]);

  const visibleSections = useMemo(() => {
    return sections.filter(shouldShowSection);
  }, [sections, shouldShowSection]);

  const isAtLast = useMemo((): boolean => {
    return (!config?.steps?.input && currentStep === visibleSections.length)
      || (Boolean(config?.steps?.input) && currentStep === visibleSections.length + 1);
  }, [currentStep, visibleSections.length, config?.steps?.input]);

  const stepItems = useMemo(() => {
    return getStepItems(config, visibleSections);
  }, [config, visibleSections]);

  // Show loading state until data is ready
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: 'hsl(var(--muted-foreground))'
      }}>
        Loading inspection data...
      </div>
    );
  }

  const menuItems = stepItems.map((step, index) => {
    const isActive = currentStep === index;
    const isDone = wizardData.completedSteps.includes(index);
    
    return {
      key: String(index),
      icon: (
        <div className={`sidebar-icon-wrapper ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
          {step.icon as any}
          {isDone && (
            <div className="sidebar-icon-check-overlay">
              <span>✓</span>
            </div>
          )}
        </div>
      ),
      label: (
        <div className="sidebar-menu-label">
          <div className="sidebar-menu-title">
            {step.title}
          </div>
          <div className="sidebar-menu-meta">
          </div>
        </div>
      ),
      className: `sidebar-menu-item ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`
    };
  });

  const renderBodyForCurrent = () => {
    const getSectionIndex = (step: number) => {
      const adjustedStep = config.steps.input ? step - 1 : step;
      if (adjustedStep < 0 || adjustedStep >= visibleSections.length) return -1;
      
      const visibleSection = visibleSections[adjustedStep];
      return sections.findIndex(s => s.id === visibleSection.id);
    };

    const sectionIndex = getSectionIndex(currentStep);

    return (
      <>
        {config.steps.input && currentStep === 0 && (
          <InputStep 
            config={config}
            wizardData={wizardData}
            handleDataUpdate={handleDataUpdate}
            handleStepComplete={handleStepComplete}
          />
        )}
        {sectionIndex >= 0 && (() => {
          const section = sections[sectionIndex];
          const currentSectionData = (wizardData.sections || [])[sectionIndex];
          
          // Only log once per section to prevent infinite loops
          if (!(window as any).__loggedSections) (window as any).__loggedSections = new Set();
          if (!(window as any).__loggedSections.has(`${section?.id}-${sectionIndex}`)) {
            (window as any).__loggedSections.add(`${section?.id}-${sectionIndex}`);
            console.log(`[GenericWizardRenderer] Rendering section ${section?.id}:`, {
              sectionIndex,
              sectionId: section?.id,
              sectionType: (section as any)?.sectionType,
              wizardDataSectionsCount: wizardData.sections?.length || 0,
              currentSectionData,
              currentSectionDataKeys: currentSectionData ? Object.keys(currentSectionData) : [],
              hasImages: !!(currentSectionData as any)?.images,
              imagesCount: (currentSectionData as any)?.images?.length || 0,
              sampleImage: (currentSectionData as any)?.images?.[0] ? {
                name: (currentSectionData as any).images[0].name,
                url: (currentSectionData as any).images[0].url,
                hasGridfsId: !!(currentSectionData as any).images[0].gridfsId
              } : null
            });
          }
          
          return (
            <SectionStep
              section={section}
              sectionIndex={sectionIndex}
              sections={sections}
              wizardData={wizardData}
              updateSectionData={updateSectionData}
              openAI={openAI}
              config={config}
              getFormFieldValue={getFormFieldValue}
              disabledFields={wizardData.disabledFields || []}
            />
          );
        })()}
        {(!config.steps.input && currentStep === visibleSections.length) && (
          <PDFStep 
            config={config}
            sections={sections}
            wizardData={wizardData}
          />
        )}
        {(config.steps.input && currentStep === visibleSections.length + 1) && (
          <PDFStep 
            config={config}
            sections={sections}
            wizardData={wizardData}
          />
        )}
      </>
    );
  };

  return (
    <div className={`ai-analysis-wizard ${isFullscreen ? 'fullscreen' : ''}`} style={{ height: '100%', minHeight: 0, padding: 0 }}>
      <WizardHeader 
        config={config}
        currentStep={currentStep}
        totalSteps={visibleSections.length}
        isFullscreen={isFullscreen}
        onClose={handleClose}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <div className="wizard-doc-layout">
        <WizardSidebar 
          menuItems={menuItems}
          currentStep={currentStep}
          handleStepChange={handleStepChange}
        />
        <main className="wizard-content" role="region" aria-label="Wizard content" style={{ height: '100%', minHeight: 0, overflow: 'auto' }}>
          {renderBodyForCurrent()}
        </main>
      </div>
      
      <WizardFooter 
        gadget={gadget}
        currentStep={currentStep}
        totalSteps={stepItems.length}
        isAtLast={isAtLast}
        goPrev={goPrev}
        handleStepComplete={handleStepComplete}
        wizardData={wizardData}
      />
    </div>
  );
};