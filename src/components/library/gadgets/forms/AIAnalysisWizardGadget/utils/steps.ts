import type { AIAnalysisWizardConfig } from '../AIAnalysisWizardGadget.types';
import { normalizeVisionPromptConfig } from './vision';

/**
 * Build steps from flat metadata shapes (sections/groups/fields arrays).
 * Keeps defaults minimal and avoids UI responsibilities.
 */
export function buildStepsFromFlat(raw: any): AIAnalysisWizardConfig['steps'] {
  // Strict mapping: use only the keys defined in rescue-preplan.json
  const sections = (raw?.sections || []) as Array<any>;
  const groups = (raw?.groups || []) as Array<any>;
  const fields = (raw?.fields || []) as Array<any>;
  const pdfTemplates = (raw?.pdf_templates || []) as Array<any>;
  const pdfConfig = (raw?.pdf_config || []) as Array<any>;

  console.log('[buildStepsFromFlat] Input data:', {
    sectionsCount: sections.length,
    groupsCount: groups.length,
    fieldsCount: fields.length,
    sampleSection: sections[5] ? { id: sections[5].id, title: sections[5].title } : null,
    sampleGroup: groups[0] ? { id: groups[0].id, sectionId: groups[0].sectionId, title: groups[0].title } : null,
    sampleField: fields[0] ? { id: fields[0].id, groupId: fields[0].groupId, label: fields[0].label, type: fields[0].type } : null
  });

  const sectionIdToGroups = new Map<string, any[]>();
  for (const g of groups) {
    if (!sectionIdToGroups.has(g.sectionId)) sectionIdToGroups.set(g.sectionId, []);
    sectionIdToGroups.get(g.sectionId)!.push(g);
  }

  const groupIdToFields = new Map<string, any[]>();
  for (const f of fields) {
    if (!groupIdToFields.has(f.groupId)) groupIdToFields.set(f.groupId, []);
    groupIdToFields.get(f.groupId)!.push(f);
  }

  // No legacy prompt pools; prompts are referenced by name from raw.prompts via section.promptRef/imageAnalysisPromptRef

  const builtSections = sections.map((s: any) => {
    const sGroups = (sectionIdToGroups.get(s.id) || []).map((g: any) => ({
      id: g.id,
      title: g.title,
      lgSpan: g.lgSpan,
      fields: (groupIdToFields.get(g.id) || []).map((f: any) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options,
        required: !!f.required,
        showWhen: f.showWhen,
        watchField: f.watchField,
        showOnMatch: f.showOnMatch,
        lgSpan: f.lgSpan,
        // Add missing properties for dynamic options loading
        optionsUrl: f.optionsUrl,
        dependsOn: f.dependsOn,
        labelField: f.labelField,
        valueField: f.valueField,
        placeholder: f.placeholder,
        description: f.description,
        defaultValue: f.defaultValue,
        disabled: f.disabled,
        readOnly: f.readOnly,
        props: f.props,
        calculated: f.calculated,
        formula: f.formula,
      })),
    }));

    // Debug section building
    if (s.id === 'inspection_scope' || s.id === 'general_information' || s.id.includes('observations')) {
      console.log(`[buildStepsFromFlat] Building section ${s.id}:`, {
        originalSection: { id: s.id, title: s.title, hasGrid: !!s.grid },
        groupsForSection: sectionIdToGroups.get(s.id)?.length || 0,
        builtGroupsCount: sGroups.length,
        totalFieldsBuilt: sGroups.reduce((count, g) => count + g.fields.length, 0),
        sampleGroup: sGroups[0] ? { id: sGroups[0].id, fieldsCount: sGroups[0].fields.length } : null
      });
    }

    const rawPrompts: any = (raw as any)?.prompts || {};
    // Use section.imageAnalysisPrompt if provided, else resolve by section.promptRef exactly
    const directPrompt = (s as any).imageAnalysisPrompt;
    // Strict: only honor imageAnalysisPromptRef for analysis prompts
    const refName: string | undefined = (s as any).imageAnalysisPromptRef;
    const refPrompt = refName ? rawPrompts[refName] : undefined;
    const imageAnalysisPrompt = normalizeVisionPromptConfig(directPrompt ?? refPrompt);

    const sectionType: string | undefined = (s as any).sectionType;
    const defaultVoice = { enabled: true, maxDuration: 300, showVisualization: true, transcriptionModel: 'whisper-1' } as const;
    const defaultText = { enabled: true, maxLength: 6000, placeholder: 'Transcription appears here...' } as const;
    const defaultImages = { enabled: true, maxCount: 20, maxSize: 20 * 1024 * 1024, drawingEnabled: true, drawingTools: ['pen', 'line', 'circle', 'rectangle', 'text', 'arrow'] } as const;

    const voice = sectionType === 'voice' ? defaultVoice : undefined;
    const text = sectionType === 'voice' ? defaultText : undefined;
    const images = sectionType === 'image' ? defaultImages : undefined;

    return {
      id: s.id,
      title: s.title,
      description: s.description,
      includeInPdf: (s as any).includeInPdf,
      sectionType,
      voice,
      images,
      text,
      grid: (s as any).grid,
      form: sGroups.length > 0 ? { groups: sGroups } : undefined,
      imageAnalysisPrompt,
      analysisWidget: (s as any).analysisWidget, // Add missing analysisWidget field
      mockDataUrl: (s as any).mockDataUrl, // Add missing mockDataUrl field
      // Add conditional display properties
      watchField: (s as any).watchField,
      showWhen: (s as any).showWhen,
      showOnMatch: (s as any).showOnMatch,
      // No voiceExtraction/recommendationMappings in strict schema
      resourcesGrid: s.resourcesGrid,
      resourcesGridTitle: s.resourcesGridTitle,
      resourcesFromSectionId: s.resourcesFromSectionId,
      imageSourceSectionId: s.imageSourceSectionId,
      pdfLayout: (s as any).pdfLayout,
      hideHeaderInPdf: (s as any).hideHeaderInPdf,
      pdf: (s as any).pdf,
      promptRef: (s as any).promptRef,
      promptSourceIds: (s as any).promptSourceIds,
      btnLabel: (s as any).btnLabel,
      // strict: no alternate keys
    } as any;
  });

  const pdfCfg = pdfConfig[0] || {};
  // Support top-level pdfStyling for modern metadata (no pdf_config block)
  const mergedPdfStyling = raw?.pdfStyling ? raw.pdfStyling : pdfCfg.pdfStyling;
  const steps: AIAnalysisWizardConfig['steps'] = {
    input: undefined,
    sections: builtSections as any,
    pdf: {
      id: pdfCfg.id,
      enabled: pdfCfg.enabled !== false,
      title: pdfCfg.title || raw?.title || 'Generate PDF',
      description: pdfCfg.description || '',
      reportConfig: {
        value: pdfCfg.value,
        includeSections: (pdfCfg.includeSections || builtSections.map((s: any) => s.id)) as any,
        pdfStyling: mergedPdfStyling,
        templates: pdfTemplates.map((t: any) => ({ id: t.id, name: t.name, description: t.description, sections: t.sections })),
        defaultTemplateId: pdfCfg.defaultTemplateId || (pdfTemplates[0]?.id),
      },
    },
  };

  console.log('[buildStepsFromFlat] Final steps result:', {
    sectionsBuilt: steps.sections.length,
    sectionsWithForms: steps.sections.filter(s => !!s.form).length,
    sectionsWithGrids: steps.sections.filter(s => !!(s as any).grid).length,
    sampleFormSection: steps.sections.find(s => !!s.form) ? {
      id: steps.sections.find(s => !!s.form)?.id,
      formGroupsCount: steps.sections.find(s => !!s.form)?.form?.groups?.length
    } : null,
    sampleGridSection: steps.sections.find(s => !!(s as any).grid) ? {
      id: steps.sections.find(s => !!(s as any).grid)?.id,
      gridTitle: (steps.sections.find(s => !!(s as any).grid) as any)?.grid?.title
    } : null
  });

  return steps;
}


