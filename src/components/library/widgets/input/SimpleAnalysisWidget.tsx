import React from 'react';
import { Card, Button, message } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useOpenAI } from '../../../../hooks/useOpenAI';
import { getOpenAIConfig } from '../../../../utils/config';

export interface SimplePromptConfig {
  modelConfig?: { model: string; temperature?: number; maxCompletionTokens?: number };
  promptConfig?: { systemPrompt?: string; userPrompt?: string };
  streaming?: { 
    enabled?: boolean; 
    showProgress?: boolean; 
    updateInterval?: number; 
  };
}

export interface SimpleAnalysisResult {
  overview?: string;
}

interface Props {
  id?: string;
  title?: string;
  images: Array<{ url: string; name?: string }>;
  text?: string;
  promptConfig?: SimplePromptConfig;
  initialResult?: SimpleAnalysisResult;
  initialSelection?: string[];
  previousResponseId?: string | null;
  onResult?: (result: SimpleAnalysisResult) => void;
}

export const SimpleAnalysisWidget: React.FC<Props> = ({ title, images, text, promptConfig, initialResult, previousResponseId, onResult }) => {
  const openai = useOpenAI(getOpenAIConfig());
  const [loading, setLoading] = React.useState(false);
  const [overview, setOverview] = React.useState<string>(initialResult?.overview || '');
  const [streamingProgress, setStreamingProgress] = React.useState<string>('');
  const [sections, setSections] = React.useState<Array<{ id: string; title: string; content: string }>>([]);
  const [isEditingSections, setIsEditingSections] = React.useState<boolean>(false);
  const [reasoningText, setReasoningText] = React.useState<string>('');
  const [showReasoning, setShowReasoning] = React.useState<boolean>(false);
  const lastAnalysisRef = React.useRef<string>(''); // Prevent duplicate calls
  const [retryCount, setRetryCount] = React.useState(0); // Track retry attempts

  const normalize = (raw: any): SimpleAnalysisResult => ({ overview: typeof raw === 'string' ? raw : (typeof raw?.overview === 'string' ? raw.overview : '') });

// Remove duplicate markdown sections and handle full content duplication
const removeDuplicateSections = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
  // First, check for complete content duplication (common with streaming issues)
  const halfLength = Math.floor(text.length / 2);
  if (halfLength > 100) { // Only check if content is substantial
    const firstHalf = text.substring(0, halfLength);
    const secondHalf = text.substring(halfLength);
    
    if (firstHalf === secondHalf) {
text = firstHalf;
    }
  }
  
  // Find all markdown headers (# and ##)
  const headerRegex = /^(#{1,2})\s+(.+)$/gm;
  const headers: Array<{level: number, title: string, index: number}> = [];
  let match;
  
  while ((match = headerRegex.exec(text)) !== null) {
    headers.push({
      level: match[1].length,
      title: match[2].trim(),
      index: match.index
    });
  }
  
  // Find duplicate section titles
  const seenTitles = new Set<string>();
  const duplicateIndices = new Set<number>();
  
  headers.forEach(header => {
    const normalizedTitle = header.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (seenTitles.has(normalizedTitle)) {
      duplicateIndices.add(header.index);
    } else {
      seenTitles.add(normalizedTitle);
    }
  });
  
  if (duplicateIndices.size === 0) return text;
  
  // Remove duplicate sections
  const lines = text.split('\n');
  const linesToRemove = new Set<number>();
  
  duplicateIndices.forEach(duplicateIndex => {
    const lineIndex = text.substring(0, duplicateIndex).split('\n').length - 1;
    const duplicateHeader = headers.find(h => h.index === duplicateIndex);
    
    if (duplicateHeader) {
      // Mark this line and subsequent lines until next header of same or higher level
      linesToRemove.add(lineIndex);
      
      for (let i = lineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const headerMatch = line.match(/^(#{1,2})\s+/);
        
        if (headerMatch && headerMatch[1].length <= duplicateHeader.level) {
          break; // Stop at next header of same or higher level
        }
        linesToRemove.add(i);
      }
    }
  });
  
  const filteredLines = lines.filter((_, index) => !linesToRemove.has(index));
  const result = filteredLines.join('\n').trim();
  
  if (duplicateIndices.size > 0) {
    console.debug('[SimpleAnalysisWidget] Removed duplicate sections:', {
      duplicatesFound: duplicateIndices.size,
      originalLength: text.length,
      filteredLength: result.length
    });
  }
  
  return result;
};

  const analyze = async (isRetry: boolean = false) => {
    if (!promptConfig?.modelConfig || !promptConfig?.promptConfig) {
      message.warning('Analysis not configured');
      return;
    }
    if ((images || []).length === 0) {
      message.warning('Please add images first');
      return;
    }
    
    // Prevent duplicate calls (common in React StrictMode during development)
    const analysisKey = JSON.stringify({ images: images.map(i => i.url), text, promptConfig, retryCount });
    if (loading || (!isRetry && lastAnalysisRef.current === analysisKey)) {
return;
    }
    lastAnalysisRef.current = analysisKey;
    
    try {
      setLoading(true);
      
      // Clear previous results before starting new analysis
      setOverview('');
      setStreamingProgress('');
      setReasoningText('');
      setSections([]);
      
      // Responses API for stateful conversations
      const prevId = (initialResult as any)?.responseId || previousResponseId || (initialResult as any)?.previousResponseId || (window as any)?.__previousResponseId || undefined;
      
      const isStreamingEnabled = promptConfig?.streaming?.enabled === true;
      
      try {
        console.debug('[SimpleAnalysisWidget] analyze start', {
          imagesCount: (images || []).length,
          imageUrls: (images || []).map(img => img.url?.slice(0, 50) + '...'),
          model: promptConfig?.modelConfig?.model,
          hasPrevId: Boolean(prevId),
          textLength: (text || '').length,
          streamingEnabled: isStreamingEnabled
        });
      } catch {}
      
      const sys = (promptConfig.promptConfig.systemPrompt || '') + '\nOutput: Return ONLY markdown text in the response body.';
      
      if (isStreamingEnabled) {
        // Use streaming request for real-time updates
        let accumulatedText = '';
        
        console.debug('[SimpleAnalysisWidget] Starting analysis with config:', {
          model: promptConfig.modelConfig.model,
          maxCompletionTokens: promptConfig.modelConfig.maxCompletionTokens,
          streamingEnabled: true
        });
        
        const streamResp = await openai.respondStream({
          modelConfig: { ...promptConfig.modelConfig },
          promptConfig: { systemPrompt: sys, userPrompt: (promptConfig.promptConfig.userPrompt || '') },
          images: images.map(i => ({ url: i.url })),
          text: text || '',
          store: true,
          previousResponseId: typeof prevId === 'string' ? prevId : undefined,
          reasoningEffort: 'medium',
          onTextDelta: (delta: string) => {
            accumulatedText += delta;
setStreamingProgress(accumulatedText);
            // Don't update overview during streaming to avoid duplication
          }
          ,
          onReasoningDelta: (delta: string) => {
            try {
              setReasoningText(prev => (prev + (delta || '')));
            } catch {}
          }
        } as any);
        
        // Set final result when streaming completes
        const dedupedText = removeDuplicateSections(accumulatedText);
        setOverview(dedupedText);
        setSections(splitMarkdownIntoSections(dedupedText));
        setIsEditingSections(true);
        
        try {
          console.debug('[SimpleAnalysisWidget] streaming analyze complete', {
            responseId: (streamResp as any)?.responseId,
            finalTextLength: accumulatedText.length
          });
          
          // Check if response appears to be incomplete (ends abruptly)
          if (accumulatedText.length > 0 && !accumulatedText.trim().endsWith('.') && !accumulatedText.trim().endsWith('\n')) {
            console.warn('[SimpleAnalysisWidget] Response may be incomplete - ends abruptly');
            message.warning('Analysis may be incomplete. Consider increasing token limit or simplifying the request.');
          }
        } catch {}
        
        // Pass deduplicated text to callback
        onResult?.({ overview: dedupedText });
        
        try { 
          const newResponseId = (streamResp as any)?.responseId;
          if (newResponseId) {
            (window as any).__previousResponseId = newResponseId;
} else {
            console.warn('[SimpleAnalysisWidget] Streaming: No response ID in streaming response');
          }
        } catch {}
        
      } else {
        // Use non-streaming request with optimized settings for image analysis speed
        const streamResp = await openai.respond({
          modelConfig: { ...promptConfig.modelConfig },
          promptConfig: { systemPrompt: sys, userPrompt: (promptConfig.promptConfig.userPrompt || '') },
          images: images.map(i => ({ url: i.url })),
          text: text || '',
          store: true,
          previousResponseId: typeof prevId === 'string' ? prevId : undefined,
          responseFormat: 'text',
          reasoningEffort: 'medium'
        } as any);
        
        // Extract text from response object
        let responseText = '';
        try {
          const responseData = streamResp?.data;
          if (typeof responseData === 'string') {
            responseText = responseData;
          } else if (responseData && typeof responseData === 'object') {
            // Handle GPT-5 Responses API format
            responseText = responseData.output_text || 
                          responseData.text || 
                          responseData.content || 
                          (responseData.output && Array.isArray(responseData.output) 
                            ? responseData.output.map((item: any) => 
                                item.content || item.text || ''
                              ).join('') 
                            : '') ||
                          JSON.stringify(responseData); // Last resort for debugging
          }
        } catch (err) {
          console.error('[SimpleAnalysisWidget] Failed to extract text from response:', err);
          responseText = 'Failed to extract response text';
        }
        
        // Apply deduplication to clean up response
        const dedupedText = removeDuplicateSections(responseText);
        setOverview(dedupedText);
        setSections(splitMarkdownIntoSections(dedupedText));
        setIsEditingSections(true);

        // Attempt to extract reasoning from raw output for non-streaming
        try {
          const raw = (streamResp as any)?.raw;
          let collected: string[] = [];
          if (Array.isArray(raw?.output)) {
            raw.output.forEach((msg: any) => {
              if (msg?.type === 'reasoning') {
                if (Array.isArray(msg.summary)) collected.push(msg.summary.join(' '));
                if (typeof msg.text === 'string') collected.push(msg.text);
                if (Array.isArray(msg.content)) {
                  msg.content.forEach((p: any) => { if (typeof p?.text === 'string') collected.push(p.text); });
                }
              }
            });
          }
          const combined = collected.join('\n').trim();
          if (combined) setReasoningText(combined);
        } catch {}
        
        try {
          console.debug('[SimpleAnalysisWidget] non-streaming analyze complete', {
            responseId: (streamResp as any)?.responseId,
            receivedChars: String(streamResp?.data || '').length
          });
        } catch {}
        
        try { 
          const newResponseId = (streamResp as any)?.responseId;
          if (newResponseId) {
            (window as any).__previousResponseId = newResponseId;
} else {
            console.warn('[SimpleAnalysisWidget] Non-streaming: No response ID in response');
          }
        } catch {}
        
        // Use deduplicated response for the callback
        onResult?.({ overview: dedupedText });
      }
      
      // Reset retry count on success
      setRetryCount(0);
      message.success('Analysis complete');
    } catch (e: any) {
      console.error('[SimpleAnalysisWidget] Analysis failed:', e);
      
      // Reset the analysis key on error so retry is possible
      lastAnalysisRef.current = '';
      
      // Handle different types of errors
      let errorMessage = 'Analysis failed';
      let shouldRetry = false;
      
      if (e?.message?.includes('network error') || e?.message?.includes('ERR_QUIC_PROTOCOL_ERROR')) {
        errorMessage = 'Network error during analysis';
        shouldRetry = true;
      } else if (e?.message?.includes('timeout')) {
        errorMessage = 'Analysis timed out';
        shouldRetry = true;
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      // Auto-retry for network errors (max 2 retries)
      if (shouldRetry && retryCount < 2) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        message.warning(`${errorMessage}. Retrying... (${newRetryCount}/2)`);
        
        // Wait a moment before retrying
        setTimeout(() => {
          analyze(true);
        }, 1000);
        return;
      }
      
      // Reset retry count after all attempts
      setRetryCount(0);
      message.error(`${errorMessage}. Please try again.`);
    } finally { 
      setLoading(false); 
    }
  };



  const isStreaming = promptConfig?.streaming?.enabled === true;
  const showProgress = promptConfig?.streaming?.showProgress === true;

  const splitMarkdownIntoSections = (md: string): Array<{ id: string; title: string; content: string }> => {
    if (!md) return [];
    const lines = md.split('\n');
    const result: Array<{ id: string; title: string; content: string }> = [];
    let currentTitle = 'Overview';
    let buffer: string[] = [];
    const push = () => {
      if (buffer.length === 0) return;
      const id = currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      result.push({ id, title: currentTitle, content: buffer.join('\n').trim() });
      buffer = [];
    };
    for (const line of lines) {
      const h1 = line.match(/^#\s+(.+)/);
      const h2 = line.match(/^##\s+(.+)/);
      if (h1) {
        push();
        currentTitle = h1[1].trim();
      } else if (h2) {
        push();
        currentTitle = h2[1].trim();
      } else {
        buffer.push(line);
      }
    }
    push();
    const filtered = result.filter(s => s.content && s.content.trim().length > 0);
    if (filtered.length === 0 && (md || '').trim().length > 0) {
      return [{ id: 'report', title: 'Report', content: md.trim() }];
    }
    return filtered;
  };

  const updateSectionContent = (id: string, content: string) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, content } : s)));
  };

  const recombineSections = (secs: Array<{ id: string; title: string; content: string }>): string => {
    return secs.map(s => {
      const prefix = s.title.startsWith('#') ? '' : (s.title.split(' ').length > 3 ? '## ' : '## ');
      return `${prefix}${s.title}\n\n${s.content}`.trim();
    }).join('\n\n');
  };
  
  return (
    <Card 
      size="small" 
      title={
        <span>
          {title || 'AI Analysis'}
          {loading && isStreaming && showProgress && <span style={{ marginLeft: 8, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>● Streaming...</span>}
        </span>
      } 
      extra={<div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => analyze(false)} loading={loading} type="primary">
          {loading && retryCount > 0 ? `Retrying... (${retryCount}/2)` : (isStreaming ? 'Analyze (Stream)' : 'Analyze')}
        </Button>
        <Button onClick={() => setIsEditingSections((v: boolean) => !v)} disabled={sections.length === 0}>
          {isEditingSections ? 'Hide Edit' : 'Edit Sections'}
        </Button>
      </div>} 
      style={{ marginTop: 8 }}
    >
      {(overview || streamingProgress) && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Overview</div>
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'hsl(var(--muted))', 
            borderRadius: 'var(--radius)', 
            border: '1px solid hsl(var(--border))'
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({children}) => <h1 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>{children}</h1>,
                h2: ({children}) => <h2 style={{ margin: '12px 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>{children}</h2>,
                h3: ({children}) => <h3 style={{ margin: '8px 0 6px 0', fontSize: '14px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>{children}</h3>,
                p: ({children}) => <p style={{ margin: '6px 0', lineHeight: '1.5', color: 'hsl(var(--foreground))' }}>{children}</p>,
                ul: ({children}) => <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>{children}</ul>,
                ol: ({children}) => <ol style={{ margin: '6px 0', paddingLeft: '20px' }}>{children}</ol>,
                li: ({children}) => <li style={{ margin: '2px 0', color: 'hsl(var(--foreground))' }}>{children}</li>,
                strong: ({children}) => <strong style={{ fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>{children}</strong>,
                em: ({children}) => <em style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>{children}</em>,
                code: ({children}) => <code style={{ 
                  backgroundColor: 'hsl(var(--accent))', 
                  padding: '2px 4px', 
                  borderRadius: '3px', 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'hsl(var(--accent-foreground))'
                }}>{children}</code>,
                table: ({children}) => (
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', color: 'hsl(var(--foreground))' }}>{children}</table>
                ),
                thead: ({children}) => (
                  <thead style={{ backgroundColor: 'hsl(var(--muted))' }}>{children}</thead>
                ),
                tbody: ({children}) => <tbody>{children}</tbody>,
                tr: ({children}) => <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>{children}</tr>,
                th: ({children}) => (
                  <th style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid hsl(var(--border))', fontWeight: 600 }}>{children}</th>
                ),
                td: ({children}) => (
                  <td style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid hsl(var(--border))' }}>{children}</td>
                )
              }}
                               >
                     {loading && isStreaming ? streamingProgress : overview}
                   </ReactMarkdown>
          </div>
        </div>
      )}
      {sections.length > 0 && isEditingSections && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, margin: '8px 0' }}>Editable Sections</div>
          {sections.map(sec => (
            <div key={sec.id} style={{ marginBottom: 12, border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '8px 12px', fontWeight: 600 }}>{sec.title}</div>
              <textarea
                value={sec.content}
                onChange={(e) => updateSectionContent(sec.id, e.target.value)}
                rows={6}
                style={{ width: '100%', padding: 12, border: 'none', borderTop: '1px solid hsl(var(--border))', outline: 'none', background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', resize: 'vertical' }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setOverview(recombineSections(sections))} type="primary">Save Sections</Button>
            <Button onClick={() => setSections(splitMarkdownIntoSections(overview))}>Reset Changes</Button>
          </div>
        </div>
      )}
      {Boolean(reasoningText) && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>Reasoning</div>
            <button
              type="button"
              onClick={() => setShowReasoning(v => !v)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'hsl(var(--primary))',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {showReasoning ? 'Hide' : 'Show'}
            </button>
          </div>
          {showReasoning && (
            <div style={{ 
              marginTop: 6,
              padding: '12px', 
              backgroundColor: 'hsl(var(--muted))', 
              borderRadius: 'var(--radius)', 
              border: '1px solid hsl(var(--border))'
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoningText}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
      
    </Card>
  );
};

export default SimpleAnalysisWidget;


