import React from 'react';
import { notification } from 'antd';
import { useOpenAI } from '../../../../hooks/useOpenAI';
import { getOpenAIConfig } from '../../../../utils/config';

export interface FieldMeta {
  id: string;
  label?: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'radio' | 'checkbox_group' | 'multi-select' | 'textarea' | 'file' | 'static_checklist' | string;
  options?: Array<string>;
}

export interface GroupMeta {
  id?: string;
  title?: string;
  fields?: FieldMeta[];
}

export interface SectionMeta {
  id: string;
  title?: string;
  form?: { groups?: GroupMeta[] };
}

export interface DeepPromptConfig {
  modelConfig?: { model: string; temperature?: number; maxTokens?: number; topP?: number; frequencyPenalty?: number; presencePenalty?: number };
  promptConfig?: { systemPrompt?: string; userPrompt?: string; context?: any };
}

export interface AutoFillFromTranscriptWidgetProps {
  sectionsMeta: SectionMeta[];
  transcription: string;
  selectedRecommendations?: Array<{ label: string; priority?: 'high' | 'medium' | 'low' }>;
  deepPrompt?: DeepPromptConfig;
  autoRun?: boolean;
  onUpdateSection: (sectionIndex: number, updates: { formData?: Record<string, any>; textData?: string }) => void;
}

/**
 * AutoFillFromTranscriptWidget
 * - Self-contained logic to turn transcript + selected recommendations into structured form updates
 * - Uses model/prompt config from metadata (deepPrompt)
 * - Computes a schema_fields_json from sections metadata to guide the model
 * - Emits normalized per-section updates via onUpdateSection
 */
export const AutoFillFromTranscriptWidget: React.FC<AutoFillFromTranscriptWidgetProps> = React.memo(({ sectionsMeta, transcription, selectedRecommendations, deepPrompt, autoRun = true, onUpdateSection }) => {
  const { analyzeText } = useOpenAI(getOpenAIConfig());
  const lastProcessedRef = React.useRef<string>('');

  const buildSchemaFieldsJson = React.useCallback((): Record<string, any> => {
    const result: Record<string, any> = {};
    try {
      const toExample = (field: FieldMeta): any => {
        const ftype = String(field.type);
        if (ftype === 'number') return 0;
        if (ftype === 'date') return 'YYYY-MM-DD';
        if (ftype === 'radio' || ftype === 'dropdown') return Array.isArray(field.options) ? field.options : [];
        if (ftype === 'checkbox_group' || ftype === 'multi-select') return Array.isArray(field.options) ? field.options : [];
        if (ftype === 'file' || ftype === 'static_checklist') return undefined;
        return 'string';
      };
      for (const s of (sectionsMeta || [])) {
        for (const g of (s.form?.groups || [])) {
          for (const f of (g.fields || [])) {
            const example = toExample(f as FieldMeta);
            if (example !== undefined && f.id) result[f.id] = example;
          }
        }
      }
    } catch {}
    return result;
  }, [sectionsMeta]);

  const normalizeValueForField = (field: FieldMeta, incoming: any): any => {
    const type = String(field.type);
    if (type === 'radio' || type === 'dropdown') {
      if (Array.isArray(incoming)) return incoming[0] ?? undefined;
      if (typeof incoming === 'string' && (field.options || []).length > 0 && !(field.options as any).includes(incoming)) {
        return undefined;
      }
      return incoming;
    }
    if (type === 'checkbox_group' || type === 'multi-select') {
      const allowed = new Set((field.options || []) as string[]);
      return Array.isArray(incoming) ? incoming.filter((x: any) => allowed.has(String(x))) : [];
    }
    if (type === 'number') {
      const num = Number(incoming);
      return Number.isFinite(num) ? num : undefined;
    }
    if (type === 'date') {
      return typeof incoming === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(incoming) ? incoming : undefined;
    }
    if (type === 'textarea' || type === 'text') {
      return typeof incoming === 'string' ? incoming : undefined;
    }
    return incoming;
  };

  const applyParsedToSections = React.useCallback((parsed: Record<string, any>) => {
    try {
      for (let si = 0; si < sectionsMeta.length; si++) {
        const s = sectionsMeta[si];
        const fields = (s.form?.groups || []).flatMap(g => g.fields || []);
        const updates: Record<string, any> = {};
        for (const field of fields) {
          if (!field?.id) continue;
          if (Object.prototype.hasOwnProperty.call(parsed, field.id)) {
            const incoming = parsed[field.id];
            const value = normalizeValueForField(field as FieldMeta, incoming);
            updates[field.id] = value;
          }
        }
        if (Object.keys(updates).length > 0) {
          onUpdateSection(si, { formData: updates });
        }
      }
    } catch {}
  }, [onUpdateSection, sectionsMeta]);

  React.useEffect(() => {
    if (!autoRun) return;
    const run = async () => {
      const transcript = transcription || '';
      if (!transcript || transcript === lastProcessedRef.current) return;
      if (!deepPrompt?.modelConfig || !deepPrompt?.promptConfig) return;
      try {
        // Notify gadget to sync the text notes for current section if desired (caller can pass a wrapper callback)
        // Build schema + prompt
        const schemaFieldsJson = buildSchemaFieldsJson();
        const system = (deepPrompt.promptConfig?.systemPrompt || '');
        const userTemplate = (deepPrompt.promptConfig?.userPrompt || '');
        const userResolved = userTemplate
          .replace(/\{\{transcript\}\}/g, transcript)
          .replace(/\{\{selected_recommendations_json\}\}/g, JSON.stringify((selectedRecommendations || []).map(r => ({ label: r.label, priority: r.priority })), null, 2))
          .replace(/\{\{schema_fields_json\}\}/g, JSON.stringify(((deepPrompt.promptConfig as any)?.context?.schema_fields_json) || schemaFieldsJson, null, 2));

        const text = `${system}\n\n${userResolved}`;
        const resp = await analyzeText({ text, modelConfig: deepPrompt.modelConfig as any, promptConfig: { ...deepPrompt.promptConfig, userPrompt: undefined, context: undefined } as any });
        let parsed: Record<string, any> = {};
        try {
          let raw = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data ?? {});
          raw = raw.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```([\s\S]*?)```/g, '$1');
          const first = raw.indexOf('{');
          const last = raw.lastIndexOf('}');
          if (first !== -1 && last !== -1) raw = raw.slice(first, last + 1);
          parsed = JSON.parse(raw);
        } catch {}
        applyParsedToSections(parsed || {});
        notification.success({ message: 'Form auto-filled', description: 'Extracted values from transcription.' });
        lastProcessedRef.current = transcript;
      } catch (e: any) {
        notification.error({ message: 'Auto-fill failed', description: e?.message || 'Unknown error' });
      }
    };
    run();
  }, [autoRun, transcription, deepPrompt, selectedRecommendations, analyzeText, buildSchemaFieldsJson, applyParsedToSections]);

  return null;
});

AutoFillFromTranscriptWidget.displayName = 'AutoFillFromTranscriptWidget';


