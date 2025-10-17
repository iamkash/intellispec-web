import { Button, Card, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';
import { buildSummaryWidgets as buildGridSummaryWidgets, buildPromptText } from '../utils';

// Lazy-load heavy widgets to reduce initial bundle size
const EditableGridWidget = React.lazy(() => import('../../../../widgets/input').then(m => ({ default: m.EditableGridWidget }))) as React.LazyExoticComponent<React.ComponentType<any>>;

interface GridSectionProps {
  section: any;
  sectionIndex: number;
  sections: any[];
  wizardData: AIAnalysisWizardData;
  data: any;
  updateSectionData: (sectionIndex: number, update: any) => void;
  openAI: any;
  config: AIAnalysisWizardConfig;
  onUpdateResponseId?: (responseId?: string | null, patch?: Partial<AIAnalysisWizardData['analysisData']>) => void;
}

export const GridSection: React.FC<GridSectionProps> = ({
  section,
  sectionIndex,
  sections,
  wizardData,
  data,
  updateSectionData,
  openAI,
  config,
  onUpdateResponseId
}) => {
  const [populateLoading, setPopulateLoading] = useState(false);
  const handlePopulateRef = useRef<(() => Promise<void>) | null>(null);
  
  // Early return check - but hooks must come first
  const hasGrid = !!(section as any)?.grid;
  const gridCfg = hasGrid ? (section as any).grid as any : null;
  
  // Define handlePopulate with useCallback at the top level
  const handlePopulate = useCallback(async () => {
    if (!hasGrid || !gridCfg) return;
    
    try {
      // Build context automatically: transcript and best image overview
      const transcript = [
        wizardData.voiceData?.transcription || '',
        wizardData.textData || '',
        ...((wizardData.sections || []).flatMap(s => [s.voiceData?.transcription || '', (s as any)?.textData || '']))
      ].filter(Boolean).join('\n\n');
      
      const findAnalysisIdx = () => {
        const byId = (sections || []).findIndex(s => (s as any)?.id === 'image_analysis');
        if (byId >= 0) return byId;
        return (wizardData.sections || []).findIndex(s => Boolean((s as any)?.imageAnalysis?.overview));
      };
      
      const anaIdx = findAnalysisIdx();
      const src = ((wizardData.sections || [])[anaIdx] || {}) as any;
      const imageOverview = String(src?.imageAnalysis?.overview || '');
      const selected = (src.imageAnalysis?.selectedSuggestionIds || []).map((id: string) => (src.imageAnalysis?.suggestions || []).find((r: any) => String(r.id) === String(id))).filter(Boolean);
      const selectedRecommendations = selected.map((r: any) => ({ label: r.label, priority: r.priority, category: r.category }));
      
      const promptRef: string | undefined = gridCfg.promptRef || gridCfg?.populate?.promptRef;
      const deep = promptRef ? (config as any)?.prompts?.[promptRef] : undefined;
      if (!deep || !deep.promptConfig) { 
        message.warning('Grid prompt not configured'); 
        return; 
      }
      
      const template = String(deep.promptConfig.userPrompt || '');
      
      // Build schema dynamically from grid columns (structure only)
      const itemSchema: any = {};
      (gridCfg.columns || []).forEach((cm: any) => { itemSchema[cm.key] = 'string'; });
      const schemaFields = { rows: [itemSchema] };
      
      const autoGridBodyTemplate = () => {
        const cols = (gridCfg.columns || []).map((c: any) => String(c.key));
        const colConstraints = (gridCfg.columns || [])
          .filter((c: any) => c.type || c.options)
          .map((c: any) => {
            if (c.options && Array.isArray(c.options)) {
              return `${c.key}: must be one of ${JSON.stringify(c.options)}`;
            } else if (c.type === 'boolean' || c.type === 'yesno') {
              return `${c.key}: use "Yes" or "No"`;
            } else if (c.type === 'number') {
              return `${c.key}: use numeric values`;
            }
            return null;
          })
          .filter(Boolean)
          .join(', ');
        
        // Determine desired row count (can be provided from metadata, otherwise default)
        const desiredRows: number = Number((gridCfg as any)?.desiredRows) || 10;
        const maxRows: number = Math.max(desiredRows + 5, desiredRows);
        
        const generatedTemplate = [
          `Generate tabular data for columns: ${JSON.stringify(cols)}.`,
          colConstraints ? `Constraints: ${colConstraints}.` : '',
          `IMPORTANT: Return a JSON array of ${desiredRows}–${maxRows} objects (one object per row) using exactly those keys.`,
          `DO NOT return a single object - return an array like [{"key1": "value1"}, {"key2": "value2"}].`,
          'Prioritize diverse, realistic values across rows; avoid duplicates when possible.',
          'For unknowns, you may use "N/A" for strings and 0 for numbers.',
          `Example format: [{"${cols[0]}": "Value1", "${cols[1] || 'field2'}": "Value2"}, {"${cols[0]}": "Value3", "${cols[1] || 'field2'}": "Value4"}]`
        ].filter(Boolean).join(' ');
        
        return generatedTemplate;
      };
      
      const templateBodyUse = (!template || (deep as any)?.autoPrompt === true) ? autoGridBodyTemplate() : template;
      
      const filledUser = buildPromptText(templateBodyUse, {
        mapping: (deep as any)?.mapping,
        context: {
          selected_recommendations_json: selectedRecommendations,
          schema_fields_json: schemaFields,
          fill_unknown_with: 'N/A',
          image_analysis_overview: imageOverview,
          transcript_text: transcript
        }
      });
      
      const prevId = (wizardData as any)?.analysisData?.previousResponseId || (window as any)?.__previousResponseId;
      
      const response = await openAI.respond({
        text: filledUser,
        modelConfig: {
          ...((deep?.modelConfig as any) || {}),
          maxCompletionTokens: Math.max(((deep?.modelConfig as any)?.maxCompletionTokens ?? 0), 2500)
        },
        promptConfig: { systemPrompt: deep?.promptConfig?.systemPrompt || '', userPrompt: '{text}' },
        responseFormat: 'text' as const,
        store: true,
        previousResponseId: typeof prevId === 'string' ? prevId : undefined,
        reasoningEffort: 'low' as const
      });
      
      // Parse and process response (simplified version of the complex parsing logic)
      let result: any = response.data || {};
      if (typeof result === 'string') {
        try { result = JSON.parse(result); } catch {}
      }
      
      console.log('🔍 Grid populate - raw result:', result);
      
      // Normalize to an array for grid ingestion
      let list: any[] = [];
      
      if (Array.isArray(result)) {
        // Already an array
        list = result;
      } else if (result && typeof result === 'object') {
        // Check if it's an object with an array property first
        const keyFromMeta = gridCfg?.dataKey as string | undefined;
        if (keyFromMeta && Array.isArray((result as any)[keyFromMeta])) {
          list = (result as any)[keyFromMeta];
        } else {
          const firstArrayKey = Object.keys(result).find(k => Array.isArray((result as any)[k]));
          if (firstArrayKey) {
            list = (result as any)[firstArrayKey];
          } else {
            // Single object - convert to array with one item
            list = [result];
          }
        }
      }
      
      console.log('🔍 Grid populate - normalized list:', list);
      
      if (!Array.isArray(list) || list.length === 0) {
        message.warning('AI returned no rows to populate.');
        return;
      }
      
      // Generic row mapping based on columns - need to create setRows function
      const rowsMapped = (list as any[]).map((item: any, i: number) => {
        const row: any = { id: String((item as any).id || i) };
        (gridCfg.columns || []).forEach((cm: any) => { 
          const value = (item as any)[cm.key];
          row[cm.key] = Array.isArray(value) ? value.join(', ') : (value ?? '');
        });
        console.log(`🔍 Grid populate - mapped row ${i}:`, row);
        return row;
      });
      
      console.log('🔍 Grid populate - final rowsMapped:', rowsMapped);
      console.log('🔍 Grid populate - gridCfg.dataKey:', gridCfg.dataKey);
      
      // Update section data
      updateSectionData(sectionIndex, { 
        formData: { 
          ...((data as any).formData || {}), 
          [gridCfg.dataKey]: rowsMapped 
        } 
      });

      if (response.responseId) {
        try {
          (window as any).__previousResponseId = response.responseId;
        } catch {}
        onUpdateResponseId?.(response.responseId);
      }
      message.success(`Populated ${rowsMapped.length} row(s)`);
    } catch (error) {
      console.error('Error populating grid:', error);
      message.error('Failed to populate grid');
    }
  }, [hasGrid, gridCfg, wizardData, sections, config, openAI, sectionIndex, data, updateSectionData, onUpdateResponseId]);
  
  // Assign handlePopulate to ref for auto-populate access
  handlePopulateRef.current = handlePopulate;
  
  // Listen for auto-populate events from wizard navigation
  useEffect(() => {
    if (!hasGrid || !gridCfg) return;
    
    const handleAutoPopulate = (event: CustomEvent) => {
      const { sectionIndex: targetSectionIndex, sectionId, isGrid } = event.detail;
      
      console.log(`🎯 Grid section ${section.title} received auto-populate event:`, {
        targetSectionIndex,
        currentSectionIndex: sectionIndex,
        targetSectionId: sectionId,
        currentSectionId: section.id,
        isGrid,
        hasPromptRef: !!(gridCfg.promptRef || gridCfg?.populate?.promptRef),
        promptRef: gridCfg.promptRef || gridCfg?.populate?.promptRef
      });
      
      // Only respond if this is the target grid section
      if (targetSectionIndex === sectionIndex && 
          sectionId === section.id && 
          isGrid &&
          (gridCfg.promptRef || gridCfg?.populate?.promptRef)) {
        
        console.log(`🤖 Auto-populating grid section: ${section.title}`);
        setPopulateLoading(true);
        
        // Call the handlePopulate function if available
        if (handlePopulateRef.current) {
          handlePopulateRef.current().finally(() => {
            setPopulateLoading(false);
          });
        } else {
          console.error('❌ handlePopulateRef.current is null');
          setPopulateLoading(false);
        }
      } else {
        console.log(`⏭️ Grid section ${section.title} ignoring auto-populate event - conditions not met`);
      }
    };

    window.addEventListener('wizard-auto-populate', handleAutoPopulate as EventListener);
    
    return () => {
      window.removeEventListener('wizard-auto-populate', handleAutoPopulate as EventListener);
    };
  }, [sectionIndex, section, hasGrid, gridCfg]);
  
  if (!hasGrid) {
    return null;
  }
  
  // CRITICAL FIX: Get grid data from multiple sources
  let existingRows = ((data as any).formData?.[gridCfg.dataKey]) || [];
  
  // If no data in section, check global formData from restored inspection
  if (existingRows.length === 0 && (wizardData as any)?.globalFormData) {
    existingRows = (wizardData as any).globalFormData[gridCfg.dataKey] || [];
    console.log(`[GridSection] Found grid data in globalFormData for ${gridCfg.dataKey}:`, {
      dataKey: gridCfg.dataKey,
      rowsCount: existingRows.length,
      sampleRow: existingRows[0] ? {
        id: existingRows[0].id,
        item: existingRows[0].item,
        condition: existingRows[0].condition
      } : null
    });
  }
  
  console.log(`[GridSection] Rendering grid for ${section.id}:`, {
    sectionId: section.id,
    sectionIndex,
    gridTitle: gridCfg.title,
    dataKey: gridCfg.dataKey,
    existingRowsCount: existingRows.length,
    hasGridConfig: !!gridCfg,
    hasData: !!data,
    hasGlobalFormData: !!((wizardData as any)?.globalFormData),
    dataSource: existingRows.length > 0 ? (((data as any).formData?.[gridCfg.dataKey]) ? 'section' : 'global') : 'none'
  });
  
  // Optional default rows from another section (e.g., resources from image analysis)
  const defaultRows = (() => {
    try {
      const srcId = gridCfg.sourceSectionId as string | undefined;
      if (!srcId) return [];
      const srcIdx = (sections || []).findIndex(s => (s as any)?.id === srcId);
      if (srcIdx < 0) return [];
      const src = ((wizardData.sections || [])[srcIdx] || {}) as any;
      const recs = src?.imageAnalysis?.suggestions || [];
      const ids = src?.imageAnalysis?.selectedSuggestionIds || [];
      const picked = (ids.length > 0
        ? ids.map((id: string) => recs.find((r: any) => String(r.id) === String(id))).filter(Boolean)
        : recs);
      // Flatten resources (id, name, type, quantity, notes) when present
      const rows = picked.flatMap((r: any, i: number) => (Array.isArray(r.resources) ? r.resources : []).map((res: any, j: number) => ({
        id: String(res.id || `${i}-${j}`),
        name: String(res.name || ''),
        type: res.type ? String(res.type) : '',
        quantity: res.quantity ?? '',
        notes: res.notes ? String(res.notes) : ''
      })));
      return rows;
    } catch { return []; }
  })();
  
  const rows = (existingRows && existingRows.length > 0) ? existingRows : defaultRows;
  const setRows = (rowsNext: any[]) => updateSectionData(sectionIndex, { formData: { ...((data as any).formData || {}), [gridCfg.dataKey]: rowsNext } });
  
  
  // Smart summary based on column meta (disable by default for cleaner UI)
  const cols = Array.isArray(gridCfg.columns) ? gridCfg.columns : [];
  const buildSummaryWidgets = () => {
    // Only show summary widgets if explicitly enabled in grid config
    if (gridCfg.showSummary === true) {
      return buildGridSummaryWidgets(rows as any, cols as any);
    }
    return []; // Return empty array to hide summary widgets
  };
  
  const populateButton = (gridCfg.promptRef || gridCfg?.populate?.promptRef) ? (
    <Button 
      key="grid-populate" 
      size="small" 
      loading={openAI.loading || populateLoading} 
      onClick={handlePopulate}
      style={{ backgroundColor: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
    >
      {gridCfg.btnLabel || gridCfg.populateLabel || gridCfg.populate?.label || 'Populate from AI'}
    </Button>
  ) : null;
  
  return (
    <Card 
      className="glass-subcard" 
      size="small" 
      title={<span>{gridCfg.title || 'Grid'}</span>} 
      extra={populateButton} 
      headStyle={{ padding: '6px 10px' }} 
      bodyStyle={{ padding: 8 }}
    >
      {(() => {
        const widgets = buildSummaryWidgets();
        if (widgets.length === 0) return null;
        return (
          <div className="analysis-stats" style={{ marginBottom: 12 }}>
            {widgets.map((w, i) => (
              <div key={i} className="stat-card">
                <div className="stat-title">{w.title || ''}</div>
                <div className="stat-value">{String(w.value)}</div>
                {w.description && (<div className="stat-desc">{w.description}</div>)}
              </div>
            ))}
          </div>
        );
      })()}
      <React.Suspense fallback={null}>
        <EditableGridWidget
          rows={rows}
          onChange={setRows}
          columnsMeta={gridCfg.columns}
          features={gridCfg.features}
        />
      </React.Suspense>
    </Card>
  );
};
