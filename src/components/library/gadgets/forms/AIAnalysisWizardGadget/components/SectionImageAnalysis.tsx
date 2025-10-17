import React from 'react';
import type { AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';

// Lazy-load heavy widgets to reduce initial bundle size
const VisionAnalysisWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.VisionAnalysisWidget })));
const SimpleAnalysisWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.SimpleAnalysisWidget })));

const EMPTY_IMAGE_LIST: any[] = [];

interface SectionImageAnalysisProps {
  sectionIndex: number;
  sections: any[];
  wizardData: AIAnalysisWizardData;
  updateSectionData: (sectionIndex: number, update: any) => void;
  gadget: any;
  triggerRerender: () => void;
  onUpdateResponseId?: (responseId?: string | null, patch?: Partial<AIAnalysisWizardData['analysisData']>) => void;
}

export const SectionImageAnalysis: React.FC<SectionImageAnalysisProps> = React.memo(({
  sectionIndex,
  sections,
  wizardData,
  updateSectionData,
  gadget,
  triggerRerender,
  onUpdateResponseId
}) => {
  const section = sections[sectionIndex];
  const sectionData = React.useMemo(() => (wizardData.sections || [])[sectionIndex] || {}, [wizardData.sections, sectionIndex]);

  // CRITICAL FIX: Check both section-specific and global AI analysis data
  let analysisData = (sectionData as any)?.imageAnalysis;
  
  // If no section-specific analysis, check multiple global sources
  if (!analysisData) {
    // Source 1: Global analysisData
    if (wizardData.analysisData) {
      analysisData = {
        overview: wizardData.analysisData.markdownReport,
        suggestions: wizardData.analysisData.analysisResults || [],
        selectedSuggestionIds: []
      };
      console.log(`[SectionImageAnalysis] Using global analysisData for ${section?.id}:`, {
        hasMarkdownReport: !!wizardData.analysisData.markdownReport,
        markdownLength: wizardData.analysisData.markdownReport?.length || 0,
        hasAnalysisResults: !!wizardData.analysisData.analysisResults,
        resultsCount: wizardData.analysisData.analysisResults?.length || 0
      });
    }
    
    // Source 2: Build analysis from populated form fields
    if ((!analysisData?.overview || analysisData.overview.length === 0) && (wizardData as any)?.globalFormData) {
      const globalFormData = (wizardData as any).globalFormData;
      
      // Build comprehensive analysis from form fields
      const analysisFields = [
        'equipment_description',
        'fitness_service_results', 
        'code_compliance',
        'service_suitability',
        'scope_description',
        'inspection_preparation'
      ];
      
      let overview = '';
      analysisFields.forEach(fieldId => {
        const value = globalFormData[fieldId];
        if (value && typeof value === 'string' && value.length > 10) {
          const fieldLabel = fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          overview += `## ${fieldLabel}\n${value}\n\n`;
        }
      });
      
      if (overview.length > 100) {
        analysisData = {
          overview: overview.trim(),
          suggestions: [],
          selectedSuggestionIds: []
        };
        
        console.log(`[SectionImageAnalysis] Built analysis from form fields:`, {
          fieldsUsed: analysisFields.filter(f => globalFormData[f]),
          overviewLength: overview.length,
          preview: overview.substring(0, 200) + '...'
        });
      } else {
        console.log(`[SectionImageAnalysis] No suitable analysis data found in globalFormData:`, {
          hasGlobalFormData: !!globalFormData,
          totalKeys: Object.keys(globalFormData).length,
          analysisFields: analysisFields.map(f => ({ field: f, hasValue: !!globalFormData[f], length: globalFormData[f]?.length || 0 })),
          sampleKeys: Object.keys(globalFormData).slice(0, 10)
        });
      }
    }
  }
  
  console.log(`[SectionImageAnalysis] Rendering AI analysis for ${section?.id}:`, {
    sectionId: section?.id,
    sectionIndex,
    hasData: !!sectionData,
    hasSectionImageAnalysis: !!(sectionData as any)?.imageAnalysis,
    hasGlobalAnalysisData: !!wizardData.analysisData,
    finalAnalysisData: !!analysisData,
    hasOverview: !!(analysisData?.overview),
    overviewLength: (analysisData?.overview)?.length || 0,
    hasSuggestions: !!(analysisData?.suggestions),
    suggestionsCount: (analysisData?.suggestions)?.length || 0
  });
  
  const sourceImages = React.useMemo(() => {
    const currentSectionData = sectionData || {};
    let resolved = ((currentSectionData as any).images || []) as any[];

    try {
      const promptSourceIds = Array.isArray((section as any)?.promptSourceIds)
        ? ((section as any).promptSourceIds as string[])
        : [];

      if ((resolved == null || resolved.length === 0) && promptSourceIds.length > 0) {
        for (const sid of promptSourceIds) {
          const idx = (sections || []).findIndex((s) => (s as any)?.id === sid);
          if (idx >= 0) {
            const srcData = (wizardData.sections || [])[idx] || {};
            const imgs = ((srcData as any).images || []) as any[];
            if (imgs && imgs.length > 0) {
              resolved = imgs;
              break;
            }
          }
        }
      }
    } catch {}

    if ((!resolved || resolved.length === 0) && wizardData.imageData && wizardData.imageData.length > 0) {
      console.log(`[SectionImageAnalysis] Using global imageData:`, {
        globalImageCount: wizardData.imageData.length,
        sampleImage: wizardData.imageData[0] ? {
          name: wizardData.imageData[0].name,
          url: wizardData.imageData[0].url,
          uid: wizardData.imageData[0].uid
        } : null
      });
      resolved = wizardData.imageData;
    }

    return resolved && resolved.length > 0 ? resolved : EMPTY_IMAGE_LIST;
  }, [section, sectionData, sections, wizardData.sections, wizardData.imageData]);
  
  // ADDITIONAL DEBUG: Check what imageData is available
  console.log(`[SectionImageAnalysis] Image sources check:`, {
    sectionImages: ((sectionData as any).images || []).length,
    globalImageData: (wizardData.imageData || []).length,
    hasGlobalImageData: !!(wizardData.imageData && wizardData.imageData.length > 0),
    wizardDataKeys: Object.keys(wizardData),
    globalFormDataHasImages: (wizardData as any)?.globalFormData ? 
      Object.keys((wizardData as any).globalFormData).filter(k => k.includes('image')).length : 0
  });

  // CRITICAL FIX: Convert GridFS URLs to base64 data URLs for OpenAI compatibility
  const [convertedImages, setConvertedImages] = React.useState<any[]>([]);
  const [imagesConverting, setImagesConverting] = React.useState(false);

  React.useEffect(() => {
    let isCancelled = false;

    const convertImagesToBase64 = async () => {
      if (!sourceImages || sourceImages.length === 0) {
        setImagesConverting(prev => (prev ? false : prev));
        setConvertedImages(prev => (prev.length === 0 ? prev : []));
        return;
      }

      setImagesConverting(prev => (prev ? prev : true));
      const converted: any[] = [];

      const authToken = (typeof window !== 'undefined')
        ? (localStorage.getItem('authToken') || localStorage.getItem('token'))
        : null;

      for (const img of sourceImages) {
        try {
          let imageUrl = img.url;

          // If it's already a data URL, use it directly
          if (img.drawingData && img.drawingData.startsWith('data:')) {
            imageUrl = img.drawingData;
          } 
          // If it's a GridFS URL, convert to base64
          else if (img.url && img.url.startsWith('/api/uploads/image/')) {
            console.log(`[SectionImageAnalysis] Converting GridFS image to base64: ${img.name}`);
            
            try {
              const response = await fetch(img.url, authToken ? {
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              } : undefined);
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                
                // Determine image MIME type from file extension or default to PNG
                let mimeType = 'image/png';
                if (img.name) {
                  const ext = img.name.toLowerCase().split('.').pop();
                  if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                  else if (ext === 'gif') mimeType = 'image/gif';
                  else if (ext === 'webp') mimeType = 'image/webp';
                }
                
                // Convert to base64 with correct MIME type
                const uint8Array = new Uint8Array(arrayBuffer);
                let binaryString = '';
                for (let i = 0; i < uint8Array.length; i++) {
                  binaryString += String.fromCharCode(uint8Array[i]);
                }
                const base64String = btoa(binaryString);
                imageUrl = `data:${mimeType};base64,${base64String}`;
                
                console.log(`[SectionImageAnalysis] ✅ Converted ${img.name} to base64:`, {
                  mimeType,
                  base64Length: base64String.length,
                  totalLength: imageUrl.length
                });
              } else {
                console.warn(`[SectionImageAnalysis] ❌ Failed to fetch ${img.url}: ${response.status}`);
                continue; // Skip this image
              }
            } catch (error) {
              console.error(`[SectionImageAnalysis] ❌ Error converting ${img.name}:`, error);
              continue; // Skip this image
            }
          }

          if (!isCancelled) {
            converted.push({
              url: imageUrl,
              name: img.name,
              drawingData: img.drawingData
            });
          }
        } catch (error) {
          console.error(`[SectionImageAnalysis] Error processing image ${img.name}:`, error);
        }
      }

      if (isCancelled) {
        return;
      }

      setConvertedImages(prev => {
        const sameLength = prev.length === converted.length;
        const sameUrls = sameLength && prev.every((item, idx) => item.url === converted[idx]?.url);
        return sameLength && sameUrls ? prev : converted;
      });
      setImagesConverting(prev => (prev ? false : prev));
      
      console.log(`[SectionImageAnalysis] Image conversion complete:`, {
        originalCount: sourceImages.length,
        convertedCount: converted.length,
        sampleConversion: converted[0] ? {
          name: converted[0].name,
          isBase64: converted[0].url.startsWith('data:'),
          urlLength: converted[0].url.length
        } : null
      });
    };

    convertImagesToBase64();

    return () => {
      isCancelled = true;
    };
  }, [sourceImages]);

  const images = convertedImages;
  
  console.log(`[SectionImageAnalysis] Converted image URLs for OpenAI:`, {
    originalImages: sourceImages?.length || 0,
    convertedImages: images.length,
    sampleUrls: images.slice(0, 2).map(img => ({
      name: img.name,
      urlType: img.url.startsWith('data:') ? 'base64' : img.url.startsWith('http') ? 'absolute' : 'relative',
      urlPreview: img.url.substring(0, 80) + '...'
    }))
  });

  const hasImages = (images || []).length > 0;
  
  // Debug: Log image information
  try {
    console.debug('[SectionImageAnalysis] Images debug:', {
      sectionId: section?.id,
      promptSourceIds: (section as any)?.promptSourceIds,
      sourceImagesCount: sourceImages?.length || 0,
      finalImagesCount: images?.length || 0,
      imageUrls: images?.map((img: any) => img.url?.slice(0, 50) + '...') || []
    });

    // Additional guidance for OpenAI image usage
    if (images?.length > 0) {
      console.info(`📸 [SectionImageAnalysis] Found ${images.length} images, will be converted to base64 for OpenAI`);
    }
  } catch {}

  // Build a combined transcript/text context from voice + notes across the wizard
  const recordDetailsText = (() => {
    try {
      const details = (wizardData as any)?.globalFormData || {};
      if (!details || Object.keys(details).length === 0) return '';
      return `Record Data (from metadata and prefill):\n${JSON.stringify(details, null, 2)}`;
    } catch {
      return '';
    }
  })();

  const recordContextSummary = React.useMemo(() => {
    const context = (wizardData as any)?.recordContext;
    if (!context || typeof context !== 'object') {
      return '';
    }

    const rows: Array<{ path: string; value: string }> = [];

    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (value instanceof Date) return value.toISOString();
      return JSON.stringify(value);
    };

    const walk = (value: any, path: string[]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          walk(item, [...path, `${path.length === 0 ? '' : ''}[${index}]`]);
        });
        return;
      }

      if (typeof value === 'object') {
        Object.entries(value).forEach(([key, child]) => {
          walk(child, [...path, key]);
        });
        return;
      }

      const keyPath = path
        .filter(Boolean)
        .map(segment => segment.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()))
        .join(' > ');

      const formattedValue = formatValue(value);
      if (!keyPath || !formattedValue) {
        return;
      }

      rows.push({
        path: keyPath,
        value: formattedValue
      });
    };

    walk(context, []);

    if (rows.length === 0) {
      return '';
    }

    const uniqueRows = rows.reduce<Array<{ path: string; value: string }>>((acc, row) => {
      if (!acc.some(existing => existing.path === row.path && existing.value === row.value)) {
        acc.push(row);
      }
      return acc;
    }, []);

    const tableRows = uniqueRows
      .map(row => {
        const safeValue = row.value.replace(/\s+/g, ' ').trim();
        return `| ${row.path} | ${safeValue} |`;
      })
      .filter(line => line.length > 0);

    if (tableRows.length === 0) {
      return '';
    }

    return [
      '## Asset Record Details',
      '| Field | Value |',
      '|-------|-------|',
      ...tableRows
    ].join('\n');
  }, [wizardData]);

  const combinedText = (() => {
    try {
      const primaryRecordDetails = recordContextSummary || recordDetailsText;

      const textFragments = [
        (wizardData as any)?.voiceData?.transcription || '',
        (wizardData as any)?.textData || '',
        ...((wizardData.sections || []).flatMap(s => [
          ((s as any)?.voiceData?.transcription) || '',
          ((s as any)?.textData) || ''
        ])),
        primaryRecordDetails
      ].filter(Boolean);

      return textFragments.join('\n\n');
    } catch {
      const fallback = (sectionData as any).textData || '';
      const extras = [recordContextSummary || recordDetailsText].filter(Boolean).join('\n\n');
      return extras ? [fallback, extras].filter(Boolean).join('\n\n') : fallback;
    }
  })();

  const analysisWidgetType = String((section as any)?.analysisWidget || 'vision');
  
  // Debug logging to help diagnose widget selection
  try {
    console.debug('[SectionImageAnalysis] Widget selection debug:', {
      sectionId: section?.id,
      sectionTitle: section?.title,
      analysisWidgetFromSection: (section as any)?.analysisWidget,
      finalAnalysisWidgetType: analysisWidgetType,
      sectionKeys: Object.keys(section || {})
    });
  } catch {}

  const handleResult = (res: any) => {
    console.log(`[SectionImageAnalysis] handleResult called for ${section?.id}:`, {
      hasOverview: !!res.overview,
      overviewLength: res.overview?.length || 0,
      hasSuggestions: !!((res as any).items || (res as any).suggestions),
      suggestionsCount: ((res as any).items || (res as any).suggestions || []).length,
      responseKeys: Object.keys(res || {}),
      overviewPreview: res.overview?.substring(0, 200) + '...'
    });
    
    const next: any = { 
      imagesCollapsed: true, 
      imageAnalysis: { 
        overview: res.overview, 
        suggestions: (res as any).items || (res as any).suggestions || [], 
        selectedSuggestionIds: res.selectedIds || [] 
      } 
    };
    
    console.log(`[SectionImageAnalysis] Saving analysis data to section ${sectionIndex}:`, {
      sectionIndex,
      hasImageAnalysis: !!next.imageAnalysis,
      overviewLength: next.imageAnalysis.overview?.length || 0,
      suggestionsCount: next.imageAnalysis.suggestions?.length || 0
    });
    
    // Extract equipment type from analysis text and auto-populate the field
    try {
      const analysisText = (res.overview || '').toLowerCase();
      let detectedType = 'other';
      
      console.debug('[Equipment Type Detection] Analysis text:', {
        fullText: res.overview,
        lowercaseText: analysisText,
        textLength: analysisText.length,
        // Pressure vessel keywords
        containsPressureVessel: analysisText.includes('pressure vessel'),
        containsPressureTank: analysisText.includes('pressure tank'),
        containsVessel: analysisText.includes('vessel'),
        containsReactor: analysisText.includes('reactor'),
        containsBoiler: analysisText.includes('boiler'),
        // Storage tank keywords
        containsStorageTank: analysisText.includes('storage tank'),
        containsAtmosphericTank: analysisText.includes('atmospheric tank'),
        containsTank: analysisText.includes('tank'),
        // Piping keywords
        containsPiping: analysisText.includes('piping'),
        containsPipe: analysisText.includes('pipe'),
        containsPipeline: analysisText.includes('pipeline'),
        containsPipingSystem: analysisText.includes('piping system'),
        // Relief device keywords
        containsRelief: analysisText.includes('relief'),
        containsSafetyValve: analysisText.includes('safety valve'),
        containsPrv: analysisText.includes('prv')
      });
      
      // More specific patterns first, then general patterns
      if (analysisText.includes('pressure vessel') || analysisText.includes('pressure tank') || analysisText.includes('reactor') || analysisText.includes('boiler')) {
        detectedType = 'pressure_vessel';
      } else if (analysisText.includes('storage tank') || analysisText.includes('atmospheric tank') || analysisText.includes('silo')) {
        detectedType = 'storage_tank';
      } else if (analysisText.includes('piping') || analysisText.includes('pipe') || analysisText.includes('pipeline') || analysisText.includes('piping system')) {
        detectedType = 'piping';
      } else if (analysisText.includes('relief') || analysisText.includes('safety valve') || analysisText.includes('rupture disc') || analysisText.includes('prv')) {
        detectedType = 'relief_device';
      } else if (analysisText.includes('heat exchanger') || analysisText.includes('exchanger')) {
        detectedType = 'heat_exchanger';
      } else if (analysisText.includes('vessel') || analysisText.includes('tank')) {
        // Generic fallback for vessels/tanks - default to pressure vessel if no specific type found
        detectedType = 'pressure_vessel';
      }
      
      // Find the general information section and update the detected equipment type
      const generalInfoSectionIndex = sections.findIndex(s => s.id === 'general_information');
      if (generalInfoSectionIndex >= 0) {
        const generalInfoData = wizardData.sections?.[generalInfoSectionIndex]?.formData || {};
        updateSectionData(generalInfoSectionIndex, {
          formData: {
            ...generalInfoData,
            detected_equipment_type: detectedType
          }
        });
        
        console.debug('[Equipment Type Detection]', {
          detectedType,
          sectionIndex: generalInfoSectionIndex,
          previousValue: generalInfoData.detected_equipment_type,
          updatedFormData: {
            ...generalInfoData,
            detected_equipment_type: detectedType
          },
          triggerType: 'AI_ANALYSIS'
        });
        
        // Force wizard data update to trigger conditional section refresh
        setTimeout(() => {
          triggerRerender();
        }, 100);
      }
    } catch (err) {
      console.error('[Equipment Type Detection] Failed:', err);
    }
    
    try {
      if (res.responseId) {
        try {
          (window as any).__previousResponseId = res.responseId;
        } catch {}
        gadget.updateWizardData({ analysisData: { ...((wizardData as any).analysisData || {}), previousResponseId: res.responseId } });
        triggerRerender();
      }
    } catch {}
    // CRITICAL FIX: Also save to global analysisData for proper restoration
    const currentAnalysisData = (wizardData as any).analysisData || {};
    const globalUpdate = {
      analysisData: {
        ...currentAnalysisData,
        markdownReport: res.overview || '',
        analysisResults: (res as any).items || (res as any).suggestions || [],
        previousResponseId: res.responseId || currentAnalysisData.previousResponseId
      }
    };
    
    console.log(`[SectionImageAnalysis] Updating global analysisData:`, {
      markdownLength: globalUpdate.analysisData.markdownReport?.length || 0,
      resultsCount: globalUpdate.analysisData.analysisResults?.length || 0,
      hasResponseId: !!globalUpdate.analysisData.previousResponseId
    });
    
    // Update both section-specific and global data
    updateSectionData(sectionIndex, { ...next, ...globalUpdate });

    onUpdateResponseId?.(res.responseId || currentAnalysisData.previousResponseId, globalUpdate.analysisData);
  };

  // Show loading state while converting images
  if (imagesConverting) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
        Converting images for AI analysis...
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div style={{ padding: 8, color: 'hsl(var(--muted-foreground))' }}>Loading analysis...</div>}>
      {analysisWidgetType === 'simple'
        ? React.createElement(SimpleAnalysisWidget as any, {
            title: (section as any).imageAnalysisPrompt?.title || section.title || 'AI Analysis',
            images,
            text: combinedText,
            promptConfig: (section as any).imageAnalysisPrompt as any,
            mockDataUrl: (section as any)?.mockDataUrl,
            initialResult: analysisData as any,
            initialSelection: analysisData?.selectedSuggestionIds || [],
            previousResponseId: (wizardData.analysisData as any)?.previousResponseId || null,
            onResult: handleResult
          })
        : (
        <VisionAnalysisWidget
          id={`vision-${sectionIndex}`}
          title={(section as any).imageAnalysisPrompt?.title || section.title || 'AI Vision Analysis'}
          images={images}
          text={combinedText}
          promptConfig={(section as any).imageAnalysisPrompt as any}
          initialResult={analysisData as any}
          initialSelection={analysisData?.selectedSuggestionIds || []}
          compactDefault={false}
          onResult={(res: any) => { updateSectionData(sectionIndex, { imagesCollapsed: true, imageAnalysis: { overview: res.overview, suggestions: res.suggestions as any, selectedSuggestionIds: res.selectedSuggestionIds } }); }}
        />
      )}
      {!hasImages && (
        <div style={{ marginTop: 8, color: 'hsl(var(--muted-foreground))' }}>No images detected for analysis. Please upload images in the Image Capture step.</div>
      )}
    </React.Suspense>
  );
});
