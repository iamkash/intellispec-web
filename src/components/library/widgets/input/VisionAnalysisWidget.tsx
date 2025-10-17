import { Card, message } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useOpenAI } from '../../../../hooks/useOpenAI';
import { getOpenAIConfig } from '../../../../utils/config';
import { AnalysisHero } from '../display/AnalysisHero';
import { OverviewCard } from '../display/OverviewCard';
import { RecommendationsList } from '../display/RecommendationsList';

export interface VisionPromptConfig {
  title?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  modelConfig?: { model: string; temperature?: number; maxTokens?: number; topP?: number; frequencyPenalty?: number; presencePenalty?: number };
  promptConfig?: { systemPrompt?: string; userPrompt?: string };
}

export interface VisionAnalysisResult {
  overview?: string;
  suggestions: Array<any>;
  selectedSuggestionIds: string[];
}

export interface VisionAnalysisWidgetProps {
  id?: string;
  title?: string;
  images: Array<{ url: string; name?: string; drawingData?: string }>;
  text?: string;
  promptConfig?: VisionPromptConfig;
  initialSelection?: string[];
  initialResult?: VisionAnalysisResult; // allows pre-populating from saved plan
  compactDefault?: boolean;
  onResult?: (result: VisionAnalysisResult) => void;
  langGraphConfig?: {
    enabled?: boolean;
    workflowId?: string;
    agents?: string[];
    autoPopulateForms?: boolean;
    triggerOnAnalysis?: boolean;
  };
}

export const VisionAnalysisWidget: React.FC<VisionAnalysisWidgetProps> = React.memo(({ id, title, images, text, promptConfig, initialSelection, initialResult, compactDefault, onResult, langGraphConfig }) => {
  const visionAI = useOpenAI(getOpenAIConfig());
  const { analyzeVision } = visionAI;
  const [analyzing, setAnalyzing] = useState(false);
  const [overview, setOverview] = useState<string | undefined>(initialResult?.overview);
  const [suggestions, setSuggestions] = useState<any[]>(initialResult?.suggestions || []);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialResult?.selectedSuggestionIds || initialSelection || []);
  const [search, setSearch] = useState<string>('');
  const [sortMode, setSortMode] = useState<'natural' | 'priority' | 'label'>('priority');
  const [compact, setCompact] = useState<boolean>(!!compactDefault);

  // Ensure analyzing state is properly reset
  React.useEffect(() => {
    if (analyzing) {
      setAnalyzing(false);
    }
  }, [images, analyzing]); // Reset when images change

  // Sync from external initialResult when it changes (e.g., opening a saved plan)
  React.useEffect(() => {
    if (!initialResult) return;
    const normalizeNumber = (value: any): number | undefined => {
      if (Number.isFinite(value)) return value as number;
      const n = Number(value);
      if (Number.isFinite(n)) return n;
      const m = String(value ?? '').match(/\d+(?:\.\d+)?/);
      return m ? Number(m[0]) : undefined;
    };
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const normalizeItems = (arr: any[]): any[] => {
      return (arr || []).map((it: any, idx: number) => {
        const rsRaw = (it?.riskScore ?? it?.risk?.score);
        const rs = normalizeNumber(rsRaw);
        const riskScore = Number.isFinite(rs) ? clamp(rs as number, 0, 100) : undefined;
        const riskText = it?.riskText ?? (it?.risk?.text ? String(it.risk.text) : undefined);
        const id = String(it?.id ?? `s-${idx}`);
        const label = String(it?.label ?? '');
        const priority = ['high','medium','low'].includes(String(it?.priority)) ? String(it?.priority) : 'medium';
        const tags = Array.isArray(it?.tags) ? it.tags.map((t: any) => String(t)) : [];
        const steps = Array.isArray(it?.steps) ? it.steps.map((t: any) => String(t)) : [];
        const actions = Array.isArray(it?.actions) ? it.actions.map((a: any) => String(a)) : [];
        const resources = Array.isArray(it?.resources) ? it.resources.map((r: any, i: number) => ({
          id: String(r?.id ?? i),
          name: String(r?.name ?? r?.item ?? ''),
          type: r?.type ? String(r.type) : undefined,
          quantity: Number.isFinite(r?.quantity) ? Number(r.quantity) : (typeof r?.quantity === 'string' ? r.quantity : undefined),
          notes: r?.notes ? String(r.notes) : undefined,
          source: r?.source ? String(r.source) : undefined
        })) : [];
        const personnel = Array.isArray((it as any)?.personnel) ? (it as any).personnel.map((p: any, i: number) => ({
          id: String(p?.id ?? i),
          role: String(p?.role ?? ''),
          name: String(p?.name ?? ''),
          notes: p?.notes ? String(p.notes) : undefined
        })) : [];
        const summary = it?.summary ? String(it.summary) : undefined;
        return { ...it, id, label, priority, tags, steps, actions, resources, personnel, summary, riskScore, riskText };
      }).filter((x: any) => x.label);
    };
    setOverview(initialResult.overview || undefined);
    setSuggestions(normalizeItems(initialResult.suggestions || []));
    setSelectedIds(initialResult.selectedSuggestionIds || []);
  }, [initialResult]);

  const orderedSuggestions = useMemo(() => {
    const weight = (p: string) => (p === 'high' ? 0 : p === 'medium' ? 1 : 2);
    let base = [...suggestions];
    if (sortMode === 'priority') base.sort((a: any, b: any) => weight(String(a?.priority || 'medium')) - weight(String(b?.priority || 'medium')));
    if (sortMode === 'label') base.sort((a: any, b: any) => String(a?.label || '').localeCompare(String(b?.label || '')));
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((s: any) => `${s.label}\n${s.rationale || ''}\n${(s as any).justification || ''}`.toLowerCase().includes(q));
  }, [suggestions, sortMode, search]);

  const onAnalyze = useCallback(async () => {
    const imageUrls = (images || []).map(i => i.url).filter(Boolean);
    if (imageUrls.length === 0) {
      message.warning('Please add images first');
      return;
    }
    try {
      setAnalyzing(true);

      // Use LangGraph if configured
      if (langGraphConfig?.enabled && langGraphConfig?.workflowId) {
// Prepare LangGraph input with voice transcript and image data
        const langGraphInput = {
          workflowId: langGraphConfig.workflowId,
          input: {
            images: imageUrls,
            voiceTranscript: text || '', // Voice transcription from Step 1
            imageUrls: imageUrls,
            prompt: promptConfig?.promptConfig?.userPrompt || '',
            systemPrompt: promptConfig?.promptConfig?.systemPrompt || '',
            agents: langGraphConfig.agents || ['VisualInspectionAgent'],
            // Include metadata for agent memory
            stepContext: {
              step: 'image_analysis',
              hasVoiceData: !!(text || ''),
              hasImages: imageUrls.length > 0,
              timestamp: new Date().toISOString()
            }
          }
        };

        // Call workflow execution API (existing architecture)
        const response = await fetch(`/api/workflows/${langGraphConfig.workflowId}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(langGraphInput)
        });

        if (!response.ok) {
          throw new Error(`LangGraph API error: ${response.status} ${response.statusText}`);
        }

        const langGraphResult = await response.json();
        // Convert LangGraph result to VisionAnalysisResult format
        const result: VisionAnalysisResult = {
          overview: langGraphResult.analysis?.overview || langGraphResult.summary || '',
          suggestions: langGraphResult.analysis?.recommendations || langGraphResult.findings || [],
          selectedSuggestionIds: []
        };

        setOverview(result.overview);
        setSuggestions(result.suggestions);
        setSelectedIds(result.selectedSuggestionIds);

        onResult?.(result);
        return;
      }

      // Fallback to direct OpenAI call
      if (!promptConfig?.modelConfig || !promptConfig?.promptConfig) {
        message.warning('Image analysis not configured');
        return;
      }
      const strictSystem = `${promptConfig.promptConfig.systemPrompt || ''}`;
      const strictUser = `${promptConfig.promptConfig.userPrompt || ''}`;
      const response = await analyzeVision({ imageUrls, text: text || '', modelConfig: promptConfig.modelConfig as any, promptConfig: { systemPrompt: strictSystem, userPrompt: strictUser } });
      let parsed: any = {};
      try {
        let raw = typeof response.data === 'string' ? response.data : JSON.stringify(response.data ?? {});
        raw = raw.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```([\s\S]*?)```/g, '$1');
        const first = raw.indexOf('{');
        const last = raw.lastIndexOf('}');
        if (first !== -1 && last !== -1) raw = raw.slice(first, last + 1);
        parsed = JSON.parse(raw);
      } catch { parsed = {}; }
      const items = Array.isArray(parsed?.recommendations) ? parsed.recommendations : (Array.isArray((parsed as any)?.suggestions) ? (parsed as any).suggestions : []);
      const ov = typeof parsed?.overview === 'string' ? parsed.overview : '';
      const toInt = (n: any, def: number) => { const v = Number(n); return Number.isFinite(v) ? v : def; };
      const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
      const asArray = (a: any): string[] => Array.isArray(a) ? a.map(String) : [];
      const mapped = items.map((it: any, idx: number) => ({
        id: String(it?.id ?? `s-${idx}`),
        label: String(it?.label ?? ''),
        summary: it?.summary ? String(it.summary) : undefined,
        rationale: it?.rationale ? String(it.rationale) : undefined,
        justification: it?.justification ? String(it.justification) : undefined,
        priority: ['high','medium','low'].includes(String(it?.priority)) ? String(it?.priority) as 'high'|'medium'|'low' : 'medium',
        category: it?.category ? String(it.category) : undefined,
        tags: asArray(it?.tags),
        riskScore: clamp(toInt(it?.risk?.score ?? it?.risk_score ?? it?.riskScore, 50), 0, 100),
        riskText: it?.risk?.text ? String(it.risk.text) : (it?.riskText ? String(it.riskText) : undefined),
        effort: ['low','medium','high'].includes(String(it?.effort)) ? String(it?.effort) as 'low'|'medium'|'high' : undefined,
        timeEstimateMinutes: toInt(it?.timeEstimateMinutes ?? it?.time_minutes ?? it?.timeEstimate?.minutes, NaN),
        confidence: (() => { const c = Number(it?.confidence); return Number.isFinite(c) ? clamp(c, 0, 1) : undefined; })(),
        steps: asArray(it?.steps),
        actions: asArray((it as any)?.actions),
        resources: Array.isArray((it as any)?.resources) ? (it as any).resources : [],
        dependencies: asArray(it?.dependencies)
      })).filter((s: any) => s.label);
      setOverview(ov);
      setSuggestions(mapped);
      const preselect = mapped.filter((s: any) => s.priority === 'high').map((s: any) => s.id);
      const nextSelected = Array.from(new Set([...(initialSelection || []), ...preselect]));
      setSelectedIds(nextSelected);
      onResult?.({ overview: ov, suggestions: mapped, selectedSuggestionIds: nextSelected });
      message.success(`Image analysis complete (${mapped.length} recommendations).`);
    } catch (e: any) {
      message.error(e?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [images, text, promptConfig, analyzeVision, initialSelection, onResult, langGraphConfig?.enabled, langGraphConfig?.workflowId, langGraphConfig?.agents]);

  return (
    <Card size="small" title={title || promptConfig?.title || 'AI Vision Analysis'} className="ai-vision-card" style={{ marginTop: 8 }}>
      <AnalysisHero
        title={promptConfig?.heroTitle || 'AI-Powered Image Intelligence'}
        subtitle={promptConfig?.heroSubtitle || 'Upload images, then generate a prioritized plan with rationale and justification.'}
        onAnalyze={onAnalyze}
        analyzing={analyzing}
      />
      {overview && (
        <div className="analysis-overview">
          <OverviewCard title={promptConfig?.title || 'Overview'} text={overview} />
        </div>
      )}
      {/* Stats row below overview */}
      {suggestions.length > 0 && (
        <div className="analysis-stats">
          {(() => {
            const base = (selectedIds && selectedIds.length > 0)
              ? suggestions.filter((s: any) => selectedIds.includes(String(s.id)))
              : suggestions;
            const total = base.length;
            const high = base.filter((s: any) => String(s?.priority || '').toLowerCase() === 'high').length;
            const nums = base
              .map((s: any) => (Number.isFinite(s?.riskScore) ? Number(s.riskScore) : (Number.isFinite(s?.risk?.score) ? Number(s.risk.score) : undefined)))
              .filter((n: any) => Number.isFinite(n)) as number[];
            const avgRisk = nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
            const totalMinutes = base
              .map((s: any) => (Number.isFinite(s?.timeEstimateMinutes) ? Number(s.timeEstimateMinutes) : (Number.isFinite(s?.time_minutes) ? Number(s.time_minutes) : (Number.isFinite(s?.timeEstimate?.minutes) ? Number(s.timeEstimate.minutes) : 0))))
              .reduce((a: number, b: number) => a + b, 0);
            return (
              <>
                <Card className="stat-card" size="small">
                  <div className="stat-title">Total Recommendations</div>
                  <div className="stat-value">{total}</div>
                  <div className="stat-desc">{selectedIds.length > 0 ? 'Currently selected' : 'All items'}</div>
                </Card>
                <Card className="stat-card" size="small">
                  <div className="stat-title">High Priority</div>
                  <div className="stat-value">{high}</div>
                  <div className="stat-desc">Items marked critical</div>
                </Card>
                <Card className="stat-card" size="small">
                  <div className="stat-title">Average Risk Score</div>
                  <div className="stat-value">{avgRisk}</div>
                  <div className="stat-desc">0 to 100 scale</div>
                </Card>
                <Card className="stat-card" size="small">
                  <div className="stat-title">Total Time</div>
                  <div className="stat-value">{`${totalMinutes}m`}</div>
                  <div className="stat-desc">Estimated effort to execute</div>
                </Card>
              </>
            );
          })()}
        </div>
      )}
      {suggestions.length > 0 && (
        <RecommendationsList
          items={orderedSuggestions as any}
          selectedIds={selectedIds}
          compact={compact}
          onCompactChange={setCompact}
          search={search}
          onSearchChange={setSearch}
          sortMode={sortMode}
          onSortModeChange={setSortMode as any}
          onEdit={(updated: any) => {
            setSuggestions(prev => {
              const next = prev.map(s => String(s.id) === String(updated.id) ? { ...s, ...updated } : s);
              onResult?.({ overview: overview || '', suggestions: next, selectedSuggestionIds: selectedIds });
              return next;
            });
          }}
          onAdd={(item: any) => {
            const withId = item.id ? item : { ...item, id: `custom-${Date.now()}` };
            setSuggestions(prev => {
              const next = [...prev, withId];
              onResult?.({ overview: overview || '', suggestions: next, selectedSuggestionIds: selectedIds });
              return next;
            });
          }}
          onToggle={(id, isSelected) => {
            const next = isSelected ? [...selectedIds, id] : selectedIds.filter(x => x !== id);
            setSelectedIds(next);
            onResult?.({ overview: overview, suggestions, selectedSuggestionIds: next });
          }}
          onCopySelection={async (picked) => {
            try {
              const textOut = picked.map((s: any, i: number) => `${i + 1}. [${String(s.priority).toUpperCase()}] ${s.label}\n- Rationale: ${s.rationale || ''}\n- Justification: ${(s as any).justification || ''}`).join('\n\n');
              await navigator.clipboard.writeText(textOut || '');
              message.success('Copied selected recommendations');
            } catch {
              message.success('Ready to copy');
            }
          }}
        />
      )}
    </Card>
  );
});

VisionAnalysisWidget.displayName = 'VisionAnalysisWidget';

