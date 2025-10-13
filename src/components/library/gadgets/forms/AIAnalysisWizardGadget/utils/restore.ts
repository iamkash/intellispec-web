import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';

/** Determine a stable id from URL params if present. */
export function getStableRestoreIdFromUrl(paramKeys: string[] = ['restoreId', 'id', 'planId', 'recordId', 'inspectionId']): string | null {
  try {
    const url = new URL(window.location.href);
    for (const k of paramKeys) {
      const v = url.searchParams.get(k);
      if (v) return v;
    }
  } catch {
    // ignore
  }
  return null;
}

// Removed localStorage reading - all data should come from the database via API

export async function tryFetchRecordFromApi(id: string): Promise<any | null> {
  const tryFetch = async (base: string, endpoint: string) => {
    // Get auth headers from BaseGadget
    const { BaseGadget } = await import('../../../base');
    const res = await BaseGadget.makeAuthenticatedFetch(`${base}${endpoint}`);
    if (!res.ok) throw new Error(String(res.status));
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('Invalid content-type');
    return res.json();
  };

  // Determine if this is an inspection ID or wizard progress ID
  // Inspection IDs typically start with 'inspection-' and contain timestamps
  const isInspectionId = id.startsWith('inspection-');

  const endpoint = isInspectionId
    ? `/api/inspections/${encodeURIComponent(id)}`
    : `/api/wizard/${encodeURIComponent(id)}`;

  try {
    return await tryFetch('', endpoint);
  } catch {
    const origin = `${window.location.protocol}//localhost:4000`;
    try {
      return await tryFetch(origin, endpoint);
    } catch {
      return null;
    }
  }
}

/** Convert record data to wizard data format */
export function convertRecordToWizardData(recordData: any): Partial<AIAnalysisWizardData> {
  console.log('[convertInspectionToWizardData] Starting conversion with:', {
    hasInspectionData: !!recordData,
    inspectionKeys: recordData ? Object.keys(recordData) : [],
    hasFormData: !!recordData?.formData,
    hasSections: !!recordData?.sections,
    hasWizardState: !!recordData?.wizardState
  });

  const wizardData: Partial<AIAnalysisWizardData> = {
    currentStep: 0,
    completedSteps: [],
    sections: [],
    voiceData: {},
    imageData: [],
    analysisData: {},
    grids: {}
  };

  if (!recordData) {
    console.log('[convertInspectionToWizardData] No inspection data provided');
    return wizardData;
  }

  const restoreGrids = (sourceGrids: Record<string, any> | undefined, sectionId?: string) => {
    if (!sourceGrids || typeof sourceGrids !== 'object') return;
    wizardData.grids = wizardData.grids || {};
    (wizardData as any).globalFormData = (wizardData as any).globalFormData || {};

    Object.entries(sourceGrids).forEach(([key, value]) => {
      if (!Array.isArray(value)) return;

      wizardData.grids![key] = value;
      (wizardData as any).globalFormData[key] = value;

      if (Array.isArray(wizardData.sections)) {
        const targetIndex = sectionId
          ? wizardData.sections.findIndex((s: any) => s?.id === sectionId)
          : wizardData.sections.findIndex((s: any) => (s?.formData || {})[key] !== undefined);

        if (targetIndex >= 0 && wizardData.sections[targetIndex]) {
          const sectionFormData = (wizardData.sections[targetIndex] as any).formData || {};
          (wizardData.sections as any)[targetIndex] = {
            ...(wizardData.sections as any)[targetIndex],
            formData: {
              ...sectionFormData,
              [key]: value
            }
          };
        } else {
          wizardData.sections.push({
            id: sectionId || key,
            title: sectionId || key,
            formData: { [key]: value },
            textData: '',
            voiceData: {},
            images: [],
            imageAnalysis: undefined
          });
        }
      }
    });
  };

  // CRITICAL FIX: Handle both section-based data AND top-level formData
  
  // First, try to restore sections from the sections array
  if (recordData.sections && Array.isArray(recordData.sections)) {
    console.log('[convertInspectionToWizardData] Converting sections:', {
      sectionsCount: recordData.sections.length,
      sectionsData: recordData.sections.map((s: any, i: number) => ({ 
        index: i, 
        isNull: s === null, 
        id: s?.id, 
        hasFormData: !!s?.formData,
        formDataKeys: s?.formData ? Object.keys(s.formData) : []
      }))
    });

    wizardData.sections = recordData.sections
      .map((section: any) => {
        if (section === null) {
          // Preserve null sections to maintain indexing
          return null;
        }
        const restoredSection = {
          id: section.id,
          title: section.title || section.id,
          formData: section.formData || section.fields || {},  // Try formData first, then fields
          textData: section.textData || '',
          voiceData: section.voiceData || {},
          images: section.images || [],
          imageAnalysis: section.imageAnalysis || undefined
        };

        if (section.grids && typeof section.grids === 'object') {
          restoredSection.formData = {
            ...restoredSection.formData,
            ...section.grids
          };
          restoreGrids(section.grids, section.id);
        }
        
        // Debug image restoration for image sections
        if (section.id === 'image_capture' && section.images?.length > 0) {
          console.log(`[convertInspectionToWizardData] Restoring images for ${section.id}:`, {
            imagesCount: section.images.length,
            sampleImages: section.images.slice(0, 2).map((img: any) => ({
              name: img.name,
              url: img.url,
              gridfsId: img.gridfsId,
              type: img.type,
              hasMetadata: !!img.metadata
            }))
          });
        }
        
        // Debug AI analysis restoration
        if (section.id === 'ai_analysis' || section.id === 'section_2') {
          console.log(`[convertInspectionToWizardData] Restoring AI analysis for ${section.id}:`, {
            hasImageAnalysis: !!section.imageAnalysis,
            imageAnalysisKeys: section.imageAnalysis ? Object.keys(section.imageAnalysis) : [],
            hasOverview: !!section.imageAnalysis?.overview,
            overviewLength: section.imageAnalysis?.overview?.length || 0,
            hasSuggestions: !!section.imageAnalysis?.suggestions,
            suggestionsCount: section.imageAnalysis?.suggestions?.length || 0
          });
        }
        
        return restoredSection;
      });
    
    console.log('[convertInspectionToWizardData] Converted sections:', {
      originalCount: recordData.sections.length,
      restoredCount: wizardData.sections?.length || 0,
      convertedSections: wizardData.sections?.map((s: any, i: number) => ({ 
        index: i,
        isNull: s === null,
        id: s?.id,
        hasFormData: !!s?.formData,
        formDataKeys: s?.formData ? Object.keys(s.formData) : []
      })) || []
    });
  }

  // CRITICAL FIX: Store top-level formData as globalFormData for field value lookup
  if (recordData.formData && Object.keys(recordData.formData).length > 0) {
    (wizardData as any).globalFormData = recordData.formData;
    
    console.log('[convertInspectionToWizardData] Stored global formData for field lookup:', {
      formDataKeys: Object.keys(recordData.formData),
      sampleData: {
        company_id: recordData.formData.company_id,
        companyName: recordData.formData.companyName,
        detected_equipment_type: recordData.formData.detected_equipment_type,
        inspection_type: recordData.formData.inspection_type,
        equipment_description: recordData.formData.equipment_description?.substring(0, 50) + '...'
      }
    });
  }

  // CRITICAL FIX: Handle AI analysis data that might be stored in wizardState.sections
  // Look for AI analysis data in wizardState sections (with both old and new IDs)
  if (recordData.wizardState?.sections && Array.isArray(recordData.wizardState.sections)) {
    const aiAnalysisSection = recordData.wizardState.sections.find((s: any) => 
      s?.id === 'ai_analysis' || s?.id === 'section_2'
    );
    
    if (aiAnalysisSection?.imageAnalysis) {
      console.log('[convertInspectionToWizardData] Found AI analysis data in wizardState:', {
        sectionId: aiAnalysisSection.id,
        hasOverview: !!aiAnalysisSection.imageAnalysis.overview,
        overviewLength: aiAnalysisSection.imageAnalysis.overview?.length || 0,
        hasSuggestions: !!aiAnalysisSection.imageAnalysis.suggestions,
        suggestionsCount: aiAnalysisSection.imageAnalysis.suggestions?.length || 0
      });
      
      // Ensure we have a sections array
      if (!wizardData.sections) {
        wizardData.sections = [];
      }
      
      // Find or create the ai_analysis section and add the imageAnalysis data
      let aiSectionIndex = wizardData.sections.findIndex((s: any) => s?.id === 'ai_analysis');
      if (aiSectionIndex === -1) {
        // Create the ai_analysis section if it doesn't exist
        wizardData.sections[2] = {
          id: 'ai_analysis',
          title: 'AI Equipment Analysis',
          formData: {},
          textData: '',
          voiceData: {},
          images: [],
          imageAnalysis: undefined
        };
        aiSectionIndex = 2;
      }
      
      // Add the imageAnalysis data to the correct section
      if (wizardData.sections[aiSectionIndex]) {
        (wizardData.sections[aiSectionIndex] as any).imageAnalysis = aiAnalysisSection.imageAnalysis;
        console.log(`[convertInspectionToWizardData] Restored AI analysis data to section index ${aiSectionIndex}`);
      }
  }
}

  const documentSummary = recordData.documentSummary || {};
  const normalizedInspectionType = documentSummary.inspectionType
    || recordData.inspectionType
    || recordData.sectionData?.inspectionType
    || recordData.formData?.inspectionType
    || recordData.wizardState?.inspectionType;

  if (normalizedInspectionType) {
    (wizardData as any).inspectionType = normalizedInspectionType;
  }

  const inspectionTypeLabel = documentSummary.inspectionTypeLabel
    || recordData.inspectionTypeLabel
    || recordData.sectionData?.inspectionTypeLabel
    || recordData.formData?.inspectionTypeLabel
    || recordData.wizardState?.inspectionTypeLabel;

  if (inspectionTypeLabel) {
    (wizardData as any).inspectionTypeLabel = inspectionTypeLabel;
  }

  const detectedEquipmentType = documentSummary.detectedEquipmentType
    || recordData.detectedEquipmentType
    || recordData.sectionData?.detectedEquipmentType
    || recordData.formData?.detectedEquipmentType
    || recordData.wizardState?.detectedEquipmentType;

  if (detectedEquipmentType) {
    (wizardData as any).detectedEquipmentType = detectedEquipmentType;
  }

  (wizardData as any).recordContext = recordData.recordContext || recordData.formData || wizardData.recordContext;

  // Fallback: single section snapshot stored in sectionData
  if (recordData.sectionData && recordData.sectionData.sectionId) {
    const sectionId = recordData.sectionData.sectionId;
    const baseSection = {
      id: sectionId,
      title: recordData.sectionData.title || sectionId,
      formData: recordData.sectionData.formData || {},
      textData: recordData.sectionData.textData || '',
      voiceData: recordData.sectionData.voiceData || {},
      images: recordData.sectionData.images || [],
      imageAnalysis: recordData.sectionData.imageAnalysis
    };

    if (!wizardData.sections) {
      wizardData.sections = [];
    }

    const existingIndex = wizardData.sections.findIndex((s: any) => s?.id === sectionId);
    if (existingIndex >= 0 && wizardData.sections[existingIndex]) {
      wizardData.sections[existingIndex] = {
        ...wizardData.sections[existingIndex],
        ...baseSection,
        formData: {
          ...(wizardData.sections[existingIndex] as any).formData,
          ...baseSection.formData
        }
      };
    } else {
      wizardData.sections.push(baseSection);
    }
  }

  wizardData.currentStep = recordData.currentStep
    || recordData.sectionData?.currentStep
    || recordData.wizardState?.currentStep
    || wizardData.currentStep;

  wizardData.completedSteps = recordData.completedSteps
    || recordData.wizardState?.completedSteps
    || wizardData.completedSteps;

  restoreGrids(recordData.grids);
  restoreGrids(recordData.sectionData?.grids, recordData.sectionData?.sectionId);
  restoreGrids(recordData.wizardState?.grids);

  if (recordData.sectionData?.formData && typeof recordData.sectionData.formData === 'object') {
    const sectionFormData = recordData.sectionData.formData;
    (wizardData as any).globalFormData = {
      ...((wizardData as any).globalFormData || {}),
      ...sectionFormData
    };

    const targetIndex = Array.isArray(wizardData.sections)
      ? wizardData.sections.findIndex((s: any) => s?.id === recordData.sectionData.sectionId)
      : -1;

    if (targetIndex >= 0 && wizardData.sections) {
      const existingFormData = (wizardData.sections[targetIndex] as any).formData || {};
      (wizardData.sections as any)[targetIndex] = {
        ...(wizardData.sections as any)[targetIndex],
        formData: {
          ...existingFormData,
          ...sectionFormData
        }
      };
    }
  }

  // Convert voice data
  if (recordData.aiAnalysis && recordData.aiAnalysis.voice) {
    wizardData.voiceData = recordData.aiAnalysis.voice;
  }

  // Convert image data from multiple sources
  const allImages: any[] = [];
  
  // Source 1: attachments array
  if (recordData.attachments && Array.isArray(recordData.attachments)) {
    const attachmentImages = recordData.attachments
      .filter((att: any) => att.type === 'image')
      .map((att: any) => ({
        url: att.url,
        name: att.metadata?.originalName || 'uploaded-image',
        type: 'existing',
        gridfsId: att.gridfsId || att.url?.split('/').pop()
      }));
    allImages.push(...attachmentImages);
  }
  
  // Source 2: sections[].images arrays  
  if (recordData.sections && Array.isArray(recordData.sections)) {
    recordData.sections.forEach((section: any) => {
      if (section?.images && Array.isArray(section.images)) {
        const sectionImages = section.images.map((img: any) => ({
          url: img.url,
          name: img.name || 'uploaded-image',
          type: img.type || 'existing',
          gridfsId: img.gridfsId,
          uid: img.uid,
          metadata: img.metadata
        }));
        allImages.push(...sectionImages);
      }
    });
  }
  
  // Source 3: wizardState.sections[].images arrays
  if (recordData.wizardState?.sections && Array.isArray(recordData.wizardState.sections)) {
    recordData.wizardState.sections.forEach((section: any, index: number) => {
      if (section?.images && Array.isArray(section.images)) {
        console.log(`[convertInspectionToWizardData] Found images in wizardState section ${index} (${section.id}):`, {
          imagesCount: section.images.length,
          sampleImage: section.images[0] ? {
            name: section.images[0].name,
            url: section.images[0].url,
            gridfsId: section.images[0].gridfsId
          } : null
        });
        
        const sectionImages = section.images.map((img: any) => ({
          url: img.url,
          name: img.name || 'uploaded-image', 
          type: img.type || 'existing',
          gridfsId: img.gridfsId,
          uid: img.uid,
          metadata: img.metadata
        }));
        allImages.push(...sectionImages);
      }
    });
  }
  
  // Deduplicate images by gridfsId or URL
  const uniqueImages = allImages.filter((img, index, arr) => {
    const identifier = img.gridfsId || img.url;
    return arr.findIndex(other => (other.gridfsId || other.url) === identifier) === index;
  });
  
  wizardData.imageData = uniqueImages;
  
  // CRITICAL FIX: Also restore images to the image_capture section if they exist
  if (uniqueImages.length > 0) {
    // Ensure we have a sections array
    if (!wizardData.sections) {
      wizardData.sections = [];
    }

    let imageSectionIndex = wizardData.sections.findIndex((s: any) => s?.id === 'image_capture');

    if (imageSectionIndex === -1) {
      imageSectionIndex = 1;
      if (wizardData.sections.length <= imageSectionIndex) {
        wizardData.sections.length = imageSectionIndex + 1;
      }
      wizardData.sections[imageSectionIndex] = {
        id: 'image_capture',
        title: 'Equipment Images',
        formData: {},
        textData: '',
        voiceData: {},
        images: [],
        imageAnalysis: undefined
      };
    }

    (wizardData.sections as any)[imageSectionIndex] = {
      ...(wizardData.sections as any)[imageSectionIndex],
      images: uniqueImages
    };

    console.log(`[convertInspectionToWizardData] Restored images to image_capture section:`, {
      sectionIndex: imageSectionIndex,
      sectionId: (wizardData.sections as any)[imageSectionIndex]?.id,
      imagesCount: uniqueImages.length
    });
  }
  
  console.log('[convertInspectionToWizardData] Image restoration:', {
    attachmentImages: recordData.attachments?.filter((att: any) => att.type === 'image')?.length || 0,
    sectionImages: recordData.sections?.reduce((count: number, s: any) => count + (s?.images?.length || 0), 0) || 0,
    wizardStateImages: recordData.wizardState?.sections?.reduce((count: number, s: any) => count + (s?.images?.length || 0), 0) || 0,
    totalUniqueImages: uniqueImages.length,
    restoredToSection: uniqueImages.length > 0 ? 'image_capture (index 1)' : 'none',
    sampleImage: uniqueImages[0] ? {
      name: uniqueImages[0].name,
      url: uniqueImages[0].url,
      hasGridfsId: !!uniqueImages[0].gridfsId,
      type: uniqueImages[0].type
    } : null
  });

  // Convert analysis data
  if (recordData.aiAnalysis) {
    console.log('[convertInspectionToWizardData] Converting aiAnalysis data:', {
      hasAiAnalysis: !!recordData.aiAnalysis,
      aiAnalysisKeys: Object.keys(recordData.aiAnalysis),
      hasResults: !!recordData.aiAnalysis.results,
      resultsLength: recordData.aiAnalysis.results?.length || 0,
      hasMarkdownReport: !!recordData.aiAnalysis.markdownReport,
      markdownLength: recordData.aiAnalysis.markdownReport?.length || 0,
      hasPreviousResponseId: !!recordData.aiAnalysis.previousResponseId
    });
    
    wizardData.analysisData = {
      analysisResults: recordData.aiAnalysis.results || [],
      markdownReport: recordData.aiAnalysis.markdownReport || '',
      previousResponseId: recordData.aiAnalysis.previousResponseId
    };

    // Convert transcription to voiceData
    if (recordData.aiAnalysis.transcription) {
      wizardData.voiceData = {
        ...wizardData.voiceData,
        transcription: recordData.aiAnalysis.transcription
      };
    }
    
    // Restore response ID to window for immediate use
    if (recordData.aiAnalysis.previousResponseId) {
      (window as any).__previousResponseId = recordData.aiAnalysis.previousResponseId;
      console.log(`🔄 Restored response ID for conversation continuity: ${recordData.aiAnalysis.previousResponseId}`);
    }
  }
  
  // ADDITIONAL FIX: Look for analysis data in section imageAnalysis (alternative storage location)
  if ((!wizardData.analysisData?.markdownReport || wizardData.analysisData.markdownReport.length === 0) && 
      wizardData.sections) {
    for (const section of wizardData.sections) {
      if (section?.imageAnalysis?.overview && section.imageAnalysis.overview.length > 0) {
        console.log(`[convertInspectionToWizardData] Found analysis data in section ${section.id}:`, {
          overviewLength: section.imageAnalysis.overview.length,
          hasSuggestions: !!section.imageAnalysis.suggestions
        });
        
        // Use section imageAnalysis as the global analysisData
        wizardData.analysisData = {
          ...wizardData.analysisData,
          markdownReport: section.imageAnalysis.overview,
          analysisResults: section.imageAnalysis.suggestions || []
        };
        break;
      }
    }
  }

  // Convert wizard state
  if (recordData.wizardState) {
    wizardData.currentStep = recordData.wizardState.currentStep || 0;
    wizardData.completedSteps = recordData.wizardState.completedSteps || [];
    console.log('[convertInspectionToWizardData] Restored wizard state:', {
      currentStep: wizardData.currentStep,
      completedSteps: wizardData.completedSteps
    });
  } else {
    // CRITICAL FIX: Infer current step for existing inspections without wizardState
    // If we have sections with data, assume we're at the end of the wizard
    const sectionsWithData = wizardData.sections?.filter(s => s && s.formData && Object.keys(s.formData).length > 0) || [];
    
    if (sectionsWithData.length > 0) {
      // If we have form data in sections, assume we're at the last step (PDF generation)
      const totalSections = wizardData.sections?.length || 0;
      
      // Calculate total steps the same way as the progress calculation
      // This should match the calculation in getStepProgress()
      // Note: We can't access config here, so we assume no input step for existing inspections
      const hasInputStep = false; // Most existing inspections don't have input step
      const totalSteps = totalSections + 1 + (hasInputStep ? 1 : 0);
      
      // Set current step to the last step (PDF generation step)
      wizardData.currentStep = totalSteps - 1; // Last step index (0-indexed)
      
      // Mark all steps as completed except the current one
      wizardData.completedSteps = Array.from({ length: totalSteps - 1 }, (_, i) => i);
      
      console.log('[convertInspectionToWizardData] Inferred wizard state for existing inspection:', {
        sectionsWithDataCount: sectionsWithData.length,
        totalSections,
        totalSteps,
        inferredCurrentStep: wizardData.currentStep,
        inferredCompletedStepsCount: wizardData.completedSteps.length,
        inferredCompletedSteps: wizardData.completedSteps
      });
    }
  }

  console.log('[convertInspectionToWizardData] Conversion complete:', {
    finalCurrentStep: wizardData.currentStep,
    finalCompletedSteps: wizardData.completedSteps,
    finalSectionsCount: wizardData.sections?.length || 0,
    finalSections: wizardData.sections?.map((s: any, i: number) => ({ 
      index: i,
      isNull: s === null,
      id: s?.id, 
      formDataKeys: s?.formData ? Object.keys(s.formData) : []
    }))
  });

  return wizardData;
}

// Legacy export retained for compatibility
export const convertInspectionToWizardData = convertRecordToWizardData;

export function normalizeRestoredSections(config: AIAnalysisWizardConfig, savedSections: Array<any> | undefined): NonNullable<AIAnalysisWizardData['sections']> {
  const cfgSections = (config.steps.sections || []).map(s => ({ id: s.id, title: s.title }));
  const savedById = new Map<string, any>();
  for (const s of (savedSections || [])) { if (s && typeof s.id === 'string') savedById.set(s.id, s); }
  let normalizedSections = cfgSections.map(({ id, title }) => {
    const saved = savedById.get(id) || {};
    return { id, title, formData: saved.formData || {}, textData: saved.textData || '', voiceData: saved.voiceData || {}, images: saved.images || [], imageAnalysis: saved.imageAnalysis || undefined };
  });
  return normalizedSections;
}

export function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
export function uniq<T>(arr: T[]) { return Array.from(new Set(arr)); }
