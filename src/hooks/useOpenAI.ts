/**
 * useOpenAI - Reusable hook for OpenAI API interactions
 * 
 * Provides a unified interface for making OpenAI API calls including:
 * - Text completion (GPT models)
 * - Vision analysis (GPT-4 Vision)
 * - Audio transcription (Whisper)
 * 
 * All configuration comes from metadata for flexibility and reusability.
 */

import { useCallback, useMemo, useState } from 'react';

  // Helper function to check if a model supports vision
  const isVisionModel = (model: string): boolean => {
    return (
      model.includes('vision') ||
      model === 'gpt-4o' ||
      model.startsWith('gpt-4o-') ||
      model === 'gpt-5' ||
      model.startsWith('gpt-5-')
    );
  };

export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface OpenAIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  /** Some models (e.g., gpt-5) expect max_completion_tokens instead of max_tokens */
  maxCompletionTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface OpenAIPromptConfig {
  systemPrompt?: string;
  userPrompt?: string;
  context?: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
}

export interface TextAnalysisRequest {
  text: string;
  modelConfig: OpenAIModelConfig;
  promptConfig: OpenAIPromptConfig;
  outputFormat?: 'json' | 'text' | 'structured';
  schema?: Record<string, any>; // For structured output
}

export interface VisionAnalysisRequest {
  imageUrls?: string[]; // HTTP URLs
  text?: string;
  modelConfig: OpenAIModelConfig;
  promptConfig: OpenAIPromptConfig;
  outputFormat?: 'json' | 'text' | 'structured';
  schema?: Record<string, any>;
}

export interface ResponsesRequest {
  modelConfig: OpenAIModelConfig;
  promptConfig: OpenAIPromptConfig;
  images?: Array<{ url: string }>; // ⚠️ IMPORTANT: Must be HTTP/HTTPS URLs accessible by OpenAI, NOT base64 data URLs or localhost URLs
  text?: string;
  store?: boolean; // default true
  previousResponseId?: string | null;
  responseFormat?: 'json' | 'text';
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export interface AudioTranscriptionRequest {
  audioBlob: Blob;
  modelConfig?: OpenAIModelConfig;
  language?: string;
  responseFormat?: 'json' | 'text' | 'verbose_json' | 'vtt' | 'srt';
}

export interface OpenAIResponse<T = any> {
  data: T;
  raw?: any;
  rawText?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
  responseId?: string;
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface UseOpenAIReturn {
  // State
  loading: boolean;
  error: string | null;
  lastResponse: OpenAIResponse | null;
  
  // Actions
  analyzeText: (request: TextAnalysisRequest) => Promise<OpenAIResponse>;
  analyzeVision: (request: VisionAnalysisRequest) => Promise<OpenAIResponse>;
  respond: (request: ResponsesRequest) => Promise<OpenAIResponse>;
  respondStream: (request: ResponsesRequest & {
    onTextDelta?: (delta: string) => void;
    onReasoningDelta?: (delta: string) => void;
  }) => Promise<OpenAIResponse>;
  transcribeAudio: (request: AudioTranscriptionRequest) => Promise<OpenAIResponse>;
  resetError: () => void;
  clearResponse: () => void;
  
  // Monitoring
  logUsageSummary: () => void;
  apiUsage: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    requestsByModel: Record<string, number>;
    tokensByModel: Record<string, number>;
  };
}

export const useOpenAI = (config: OpenAIConfig): UseOpenAIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<OpenAIResponse | null>(null);

  // API usage tracking
  const [apiUsage, setApiUsage] = useState({
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    requestsByModel: {} as Record<string, number>,
    tokensByModel: {} as Record<string, number>
  });

  // Log API usage summary
  const logUsageSummary = useCallback(() => {
    console.group('📊 [OpenAI API] Usage Summary');
console.log('🎯 Total Tokens:', apiUsage.totalTokens);
console.log('🤖 Requests by Model:', apiUsage.requestsByModel);
console.groupEnd();
  }, [apiUsage]);

  // Update usage tracking
  const updateUsage = useCallback((model: string, usage?: any) => {
    setApiUsage(prev => {
      const newUsage = { ...prev };
      newUsage.totalRequests += 1;
      newUsage.requestsByModel[model] = (newUsage.requestsByModel[model] || 0) + 1;
      
      if (usage) {
        const tokens = usage.total_tokens || 0;
        newUsage.totalTokens += tokens;
        newUsage.tokensByModel[model] = (newUsage.tokensByModel[model] || 0) + tokens;
        
        // Rough cost estimation (these are approximate rates)
        let costPerToken = 0.00002; // Default GPT-4 rate
        if (model.includes('gpt-3.5')) costPerToken = 0.000002;
        if (model.includes('whisper')) costPerToken = 0.000006;
        
        newUsage.totalCost += tokens * costPerToken;
      }
      
      return newUsage;
    });
  }, []);

  // Default configuration
  const defaultConfig = useMemo(() => ({
    baseUrl: 'https://api.openai.com/v1',
    timeout: 30000,
    retries: 3,
    ...config
  }), [config]);

  // Generic API call function with comprehensive logging
  const makeAPICall = useCallback(async <T>(endpoint: string, options: RequestInit): Promise<T> => {
    const url = `${defaultConfig.baseUrl}${endpoint}`;
    const timestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    // Log request
    console.group(`🚀 [OpenAI API] Request ${requestId} - ${timestamp}`);
console.log('🔗 Full URL:', url);
const isFormData = options.body instanceof FormData;
    const baseHeaders = {
      'Authorization': `Bearer ${defaultConfig.apiKey}`,
    };
    if (!isFormData) {
      (baseHeaders as any)['Content-Type'] = 'application/json';
    }
    const headers = {
      ...baseHeaders,
      ...options.headers,
    };
if (options.body && !isFormData) {
      try {
        const bodyData = JSON.parse(options.body as string);
console.log('🤖 Model:', bodyData.model);
        if (bodyData.messages) {
console.log('💬 Messages:', bodyData.messages);
        }
        if (bodyData.response_format) {
}
      } catch (e) {
}
    } else if (isFormData) {
// Log FormData entries
      const formData = options.body as FormData;
      const entries = Array.from(formData.entries());
      entries.forEach(([key, value]) => {
        if (value instanceof File) {
} else {
}
      });
    }
    console.groupEnd();

    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Log response
      console.group(`📥 [OpenAI API] Response ${requestId} - ${new Date().toISOString()}`);
console.log('📊 Status:', response.status, response.statusText);
console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
console.log('⏱ Duration (ms):', duration);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error Response Body:', errorText);
        console.groupEnd();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Handle different response types
      let responseData: T;
      if (endpoint === '/audio/transcriptions') {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/plain')) {
          const text = await response.text();
responseData = { data: text, model: 'whisper-1' } as T;
        } else {
          const rawResponse = await response.json();
// Process audio transcription response
          responseData = {
            data: rawResponse.text || '',
            usage: rawResponse.usage ? {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0
            } : undefined,
            model: 'whisper-1',
            finishReason: 'stop'
          } as T;
        }
      } else {
        const rawResponse = await response.json();
// Log specific OpenAI response details
        if (rawResponse.choices) {
rawResponse.choices.forEach((choice: any, index: number) => {
            console.log(`💭 Choice ${index}:`, {
              role: choice.message?.role,
              content: choice.message?.content?.substring(0, 200) + (choice.message?.content?.length > 200 ? '...' : ''),
              finish_reason: choice.finish_reason
            });
          });
        }
        if (rawResponse.usage) {
console.log('💰 Estimated Cost:', {
            prompt_tokens: rawResponse.usage.prompt_tokens,
            completion_tokens: rawResponse.usage.completion_tokens,
            total_tokens: rawResponse.usage.total_tokens
          });
        }
        if (rawResponse.model) {
}
        
        // Process the response based on endpoint
        if (endpoint === '/chat/completions') {
          // Extract content from chat completion response
          const content = rawResponse.choices?.[0]?.message?.content || '';
          responseData = {
            data: content,
            usage: rawResponse.usage ? {
              promptTokens: rawResponse.usage.prompt_tokens,
              completionTokens: rawResponse.usage.completion_tokens,
              totalTokens: rawResponse.usage.total_tokens
            } : undefined,
            model: rawResponse.model,
            finishReason: rawResponse.choices?.[0]?.finish_reason
          } as T;
        } else {
          // For other endpoints, return the raw response
          responseData = rawResponse as T;
        }
      }

      console.groupEnd();
      return responseData;
    } catch (error: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.group(`❌ [OpenAI API] Error ${requestId} - ${new Date().toISOString()}`);
console.log('🔗 URL:', url);
console.error('❌ Error:', error);
console.error('⏱ Duration (ms):', duration);
      console.error('❌ Error Message:', error.message);
      console.error('❌ Error Stack:', error.stack);
      console.groupEnd();
      
      throw error;
    }
  }, [defaultConfig]);

  // Text analysis using GPT models with usage tracking
  const analyzeText = useCallback(async (request: TextAnalysisRequest): Promise<OpenAIResponse> => {
    setLoading(true);
    setError(null);

    try {
      const messages = [];
      
      // Add system prompt if provided
      if (request.promptConfig.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.promptConfig.systemPrompt
        });
      }

      // Build user content: prefer explicit template only if it contains {text}
      let userContent: string;
      if (request.promptConfig.userPrompt && request.promptConfig.userPrompt.includes('{text}')) {
        userContent = request.promptConfig.userPrompt.replace('{text}', request.text);
      } else if (request.promptConfig.context) {
        userContent = `Context: ${request.promptConfig.context}\n\nText: ${request.text}`;
      } else {
        userContent = request.text;
      }

      messages.push({
        role: 'user',
        content: userContent
      });

      const requestBody: any = {
        model: request.modelConfig.model,
        messages,
        top_p: request.modelConfig.topP,
        frequency_penalty: request.modelConfig.frequencyPenalty,
        presence_penalty: request.modelConfig.presencePenalty,
      };

      // Temperature: some models (e.g., gpt-5) only support default (1) and reject overrides
      if (!request.modelConfig.model.startsWith('gpt-5')) {
        requestBody.temperature = request.modelConfig.temperature ?? 0.7;
      }

      // Handle token limit naming differences (gpt-5 uses max_completion_tokens)
      const desiredMax = request.modelConfig.maxTokens ?? request.modelConfig.maxCompletionTokens;
      if (desiredMax !== undefined) {
        if (request.modelConfig.model.startsWith('gpt-5')) {
          requestBody.max_completion_tokens = desiredMax;
        } else {
          requestBody.max_tokens = desiredMax;
        }
      }

      // Add response format for structured output (only for text models, not vision)
      if ((request.outputFormat === 'json' || request.schema) && !isVisionModel(request.modelConfig.model)) {
requestBody.response_format = { type: 'json_object' };
        if (request.schema) {
          const schemaPrompt = `Please respond with a JSON object following this schema: ${JSON.stringify(request.schema)}`;
          if (messages[0]?.role === 'system') {
            messages[0].content += `\n\n${schemaPrompt}`;
          } else {
            messages.unshift({ role: 'system', content: schemaPrompt });
          }
        }
      } else {
}

      // Debug: log messages payload
      try {
} catch {}

      const response = await makeAPICall<OpenAIResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Track usage
      updateUsage(request.modelConfig.model, response.data?.usage);

      setLastResponse(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze text';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeAPICall, updateUsage]);

  // Vision analysis using Responses API (multimodal) with usage tracking
  const analyzeVision = useCallback(async (request: VisionAnalysisRequest): Promise<OpenAIResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Helpers for client-side/local usage
      const isImageDataUrl = (u: string) => /^data:image\//i.test(u);
      const compressDataUrl = async (dataUrl: string, maxDim = 1536, quality = 0.8): Promise<string> => {
        try {
          // Create image
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = dataUrl;
          });
          const longest = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
          const scale = longest > maxDim ? maxDim / longest : 1;
          const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
          const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return dataUrl;
          ctx.drawImage(img, 0, 0, width, height);
          // Always output JPEG for compactness
          return canvas.toDataURL('image/jpeg', quality);
        } catch {
          // Fallback to original if compression fails
          return dataUrl;
        }
      };

      // Limit images per call to keep payload small (allow at least 10 as requested)
      const MAX_IMAGES = 10;
      const imageUrlsRaw = Array.isArray(request.imageUrls) ? request.imageUrls.slice(0, MAX_IMAGES) : [];
      const imageUrls: string[] = [];
      for (const url of imageUrlsRaw) {
        if (typeof url === 'string' && isImageDataUrl(url)) {
          imageUrls.push(await compressDataUrl(url));
        } else if (typeof url === 'string') {
          imageUrls.push(url);
        }
      }

      const input: any[] = [];
      if (request.promptConfig.systemPrompt) {
        input.push({ role: 'system', content: [{ type: 'input_text', text: request.promptConfig.systemPrompt }] });
      }

      const userContent: any[] = [];
      // Add user text
      if (request.text) {
        // Truncate excessive text to avoid token blowups
        const txt = request.text.length > 4000 ? (request.text.slice(0, 4000) + '… [truncated]') : request.text;
        const textPayload = request.promptConfig.userPrompt
          ? request.promptConfig.userPrompt.replace('{text}', txt)
          : txt;
        userContent.push({ type: 'input_text', text: textPayload });
      }
      // Add images as data URLs (base64 or regular URLs)
      imageUrls.forEach((url) => {
        userContent.push({ type: 'input_image', image_url: url });
      });
      if (userContent.length > 0) input.push({ role: 'user', content: userContent });

      const body: any = {
        model: request.modelConfig.model,
        input,
        store: true,
      };

      // Default to medium reasoning effort for vision analysis
      body.reasoning = { effort: 'medium' };

      const desiredMax = request.modelConfig.maxTokens ?? request.modelConfig.maxCompletionTokens;
      if (desiredMax !== undefined) body.max_output_tokens = desiredMax;

      // Removed strict text format enforcement to allow the model to choose the best format

      // Continue thread if a previous stored response id exists
      try {
        const prev = (window as any)?.__previousResponseId;
        if (typeof prev === 'string' && prev) body.previous_response_id = prev;
      } catch {}

      const raw = await makeAPICall<any>('/responses', { method: 'POST', body: JSON.stringify(body) });

      let outputText = '';
      try {
        if (typeof raw?.output_text === 'string') outputText = raw.output_text;
        else if (Array.isArray(raw?.output)) {
          const parts: string[] = [];
          raw.output.forEach((msg: any) => (msg?.content || []).forEach((p: any) => { if (typeof p?.text === 'string') parts.push(p.text); }));
          outputText = parts.join('\n').trim();
        }
      } catch {}

      const resp: OpenAIResponse = { data: outputText || raw, usage: undefined, model: request.modelConfig.model, finishReason: undefined, responseId: raw?.id };
      try { if (raw?.id) (window as any).__previousResponseId = raw.id; } catch {}
      updateUsage(request.modelConfig.model);
      setLastResponse(resp);
      return resp;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze images';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeAPICall, updateUsage]);

  // Responses API (stateful conversations)
  const respond = useCallback(async (request: ResponsesRequest): Promise<OpenAIResponse> => {
    setLoading(true);
    setError(null);
    try {
      const input: any[] = [];
      if (request.promptConfig.systemPrompt) {
        input.push({ role: 'system', content: [{ type: 'input_text', text: request.promptConfig.systemPrompt }] });
      }
      const userContent: any[] = [];
      const textPayload = request.promptConfig.userPrompt ? request.promptConfig.userPrompt.replace('{text}', request.text || '') : (request.text || '');
      if (textPayload) userContent.push({ type: 'input_text', text: textPayload });
      (request.images || []).forEach(img => userContent.push({ type: 'input_image', image_url: img.url }));
      if (userContent.length > 0) input.push({ role: 'user', content: userContent });

      const body: any = {
        model: request.modelConfig.model,
        input,
        store: request.store !== false,
      };
      const desiredMax = request.modelConfig.maxTokens ?? request.modelConfig.maxCompletionTokens;
      if (desiredMax !== undefined) body.max_output_tokens = desiredMax;
      if (request.previousResponseId) body.previous_response_id = request.previousResponseId;
      if (request.responseFormat === 'json') {
        body.text = { format: { type: 'json_object' } } as any;
        (body as any).tool_choice = 'none';
        body.reasoning = { effort: request.reasoningEffort || 'low' };
      } else {
        body.text = { format: { type: 'text' }, verbosity: 'high' } as any;
        (body as any).tool_choice = 'none';
        body.reasoning = { effort: request.reasoningEffort || 'low' };
      }

      // Debug: Log the request body structure  
      console.debug('[Responses API] Request body:', {
        model: body.model,
        inputLength: body.input?.length || 0,
        hasImages: body.input?.some((msg: any) => 
          msg?.content?.some((c: any) => c?.type === 'input_image')
        ) || false,
        imageCount: body.input?.reduce((count: number, msg: any) => 
          count + (msg?.content?.filter((c: any) => c?.type === 'input_image')?.length || 0), 0
        ) || 0,
        store: body.store,
        stream: body.stream,
        textFormat: body.text
      });

      const raw = await makeAPICall<any>('/responses', { method: 'POST', body: JSON.stringify(body) });
      
      // Debug: Log the complete response structure
let outputText = '';
      try {
        // Try multiple possible locations for the text content
        if (typeof raw?.output_text === 'string') {
          outputText = raw.output_text;
        } else if (typeof raw?.text === 'string') {
          outputText = raw.text;
        } else if (typeof raw?.content === 'string') {
          outputText = raw.content;
        } else if (Array.isArray(raw?.output)) {
          const textParts: string[] = [];
          const reasoningParts: string[] = [];
          
          raw.output.forEach((msg: any) => {
            if (typeof msg === 'string') {
              textParts.push(msg);
            } else if (msg?.type === 'output_text' && typeof msg.text === 'string') {
              textParts.push(msg.text);
            } else if (msg?.type === 'reasoning') {
              // Extract reasoning summary if no text output available
              if (Array.isArray(msg.summary) && msg.summary.length > 0) {
                reasoningParts.push(msg.summary.join(' '));
              }
            } else if (msg?.content) {
              if (typeof msg.content === 'string') {
                textParts.push(msg.content);
              } else if (Array.isArray(msg.content)) {
                msg.content.forEach((p: any) => {
                  if (typeof p?.text === 'string') textParts.push(p.text);
                  if (typeof p === 'string') textParts.push(p);
                });
              }
            } else if (msg?.text) {
              textParts.push(msg.text);
            }
          });
          
          // Prefer text output, fall back to reasoning if no text available
          if (textParts.length > 0) {
            outputText = textParts.join('\n').trim();
          } else if (reasoningParts.length > 0) {
            outputText = reasoningParts.join('\n').trim();
            console.warn('[Responses API] No text output found, using reasoning content');
          }
        }
} catch (err) {
        console.error('[Responses API] Text extraction error:', err);
      }
      const resp: OpenAIResponse = { data: outputText || (typeof raw === 'string' ? raw : JSON.stringify(raw)), raw, rawText: outputText, usage: undefined, model: request.modelConfig.model, finishReason: undefined, responseId: raw?.id };
      try { if (raw?.id) (window as any).__previousResponseId = raw.id; } catch {}
      updateUsage(request.modelConfig.model);
      setLastResponse(resp);
      return resp;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to call Responses API';
      setError(errorMessage);
      throw err;
    } finally { setLoading(false); }
  }, [makeAPICall, updateUsage]);

  // Responses API (streaming)
  const respondStream = useCallback(async (request: ResponsesRequest & { onTextDelta?: (delta: string) => void; onReasoningDelta?: (delta: string) => void; }): Promise<OpenAIResponse> => {
    setLoading(true);
    setError(null);
    try {
      const input: any[] = [];
      if (request.promptConfig.systemPrompt) {
        input.push({ role: 'system', content: [{ type: 'input_text', text: request.promptConfig.systemPrompt }] });
      }
      const userContent: any[] = [];
      const textPayload = request.promptConfig.userPrompt ? request.promptConfig.userPrompt.replace('{text}', request.text || '') : (request.text || '');
      if (textPayload) userContent.push({ type: 'input_text', text: textPayload });
      (request.images || []).forEach(img => userContent.push({ type: 'input_image', image_url: img.url }));
      if (userContent.length > 0) input.push({ role: 'user', content: userContent });

      // Auto-switch to a vision-capable model if images are present
      const requestedModel = request.modelConfig.model;
      const hasImages = (request.images || []).length > 0;
      const model = hasImages && !isVisionModel(requestedModel) ? 'gpt-4o-mini' : requestedModel;

      const body: any = {
        model,
        input,
        store: request.store !== false,
        stream: true,
      };
      
      // Temperature: GPT-5 may not support custom temperature
      if (!request.modelConfig.model.startsWith('gpt-5') && request.modelConfig.temperature !== undefined) {
        body.temperature = request.modelConfig.temperature;
      }
      
      const desiredMax = request.modelConfig.maxTokens ?? request.modelConfig.maxCompletionTokens;
      if (desiredMax !== undefined) body.max_output_tokens = desiredMax;
      if (request.previousResponseId) body.previous_response_id = request.previousResponseId;
      if (request.responseFormat === 'json') {
        body.text = { format: { type: 'json_object' } } as any;
        (body as any).tool_choice = 'none';
        body.reasoning = { effort: request.reasoningEffort || 'low' };
      } else {
        body.text = { format: { type: 'text' } } as any;
        (body as any).tool_choice = 'none';
        body.reasoning = { effort: request.reasoningEffort || 'low' };
      }

      const url = `${defaultConfig.baseUrl}/responses`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${defaultConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok || !response.body) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffered = '';
      let accumulatedText = '';
      let responseId: string | undefined = undefined;
      for (;;) {
        try {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffered += chunk;
        } catch (readError: any) {
          console.warn('[SSE] Stream read error:', readError);
          // If we have accumulated text, return it rather than failing completely
          if (accumulatedText.length > 0) {
break;
          }
          throw new Error(`network error: ${readError.message}`);
        }
        // Basic SSE-style parsing: split on newlines, process complete lines
        const lines = buffered.split(/\r?\n/);
        buffered = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          // Handle proper SSE format: "event: type" and "data: {...}"
          if (trimmed.startsWith('event:')) {
            // Skip event type lines, we'll get the data in the next line
            continue;
          }
          
          // Extract JSON from data: lines
          const dataIdx = trimmed.indexOf('data:');
          if (dataIdx !== 0) continue; // Skip non-data lines
          
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue; // Skip empty or done signals
          
          try {
            const evt = JSON.parse(jsonStr);
            
            // Proactive error handling for rate limits or generic errors from the stream
            const evtType = String(evt?.type || '').toLowerCase();
            const evtErrorType = String(evt?.error?.type || '').toLowerCase();
            const evtMessage = String(evt?.error?.message || evt?.message || '');
            if (evtType.includes('error') || evtErrorType || evtMessage.toLowerCase().includes('rate limit')) {
              const isRateLimit = evtType.includes('rate_limit') || evtErrorType.includes('rate_limit') || evtMessage.toLowerCase().includes('rate limit');
              const friendly = isRateLimit
                ? 'Rate limit exceeded. Please wait a few seconds and try again.'
                : (evtMessage || 'An error occurred while streaming the response.');
              console.warn('[SSE] Stream error event:', { evtType, evtErrorType, evtMessage });
              setError(friendly);
              // Stop processing further stream data
              reader.cancel().catch(() => {});
              throw new Error(friendly);
            }

            // Capture response ID from response.created events
            if (evt.type === 'response.created' && evt.response?.id && !responseId) {
              responseId = evt.response.id;
}
            
            // Also try to get ID directly from event
            if (evt.id && !responseId) {
              responseId = evt.id;
}
            
            // Debug: log the actual event structure
// Handle different GPT-5 event types
            let deltaText = '';
            
            // Handle response.output_text.delta events (most common for streaming text)
            if (evt.type === 'response.output_text.delta' && evt.delta) {
              deltaText = evt.delta;
}
            // Skip other event types that might contain full content to avoid duplication
            else if (evt.type === 'response.output_text.done' || 
                     evt.type === 'response.content_part.done' || 
                     evt.type === 'response.output_item.done') {
              // These events often contain full content, not deltas - skip to avoid duplication
}
            // Handle incomplete responses
            else if (evt.type === 'response.incomplete') {
              console.warn('[SSE] Response was incomplete - may have hit token limit or been truncated');
              // Continue processing but log the issue
            }
            // Handle response.output_item.added events
            else if (evt.type === 'response.output_item.added' && evt.item?.content) {
              if (typeof evt.item.content === 'string') {
                deltaText = evt.item.content;
              } else if (Array.isArray(evt.item.content)) {
                // Handle array of content parts
                const textParts: string[] = [];
                evt.item.content.forEach((part: any) => {
                  if (part?.type === 'output_text' && typeof part.text === 'string') {
                    textParts.push(part.text);
                  }
                });
                deltaText = textParts.join('');
              }
            }
            // Fallback checks for other possible text locations
            else if (evt.output_text) {
              deltaText = evt.output_text;
            } else if (evt.delta && typeof evt.delta === 'string') {
              deltaText = evt.delta;
            } else if (evt.content && typeof evt.content === 'string') {
              deltaText = evt.content;
            } else if (evt.text && typeof evt.text === 'string') {
              deltaText = evt.text;
            } else if (Array.isArray(evt.output)) {
              // Handle array-based output format
              const parts: string[] = [];
              evt.output.forEach((msg: any) => (msg?.content || []).forEach((p: any) => {
                if (p?.type === 'output_text' && typeof p.text === 'string') parts.push(p.text);
                if (p?.type === 'reasoning' && Array.isArray(p.summary)) {
                  const reason = p.summary.join(' ');
                  if (reason && request.onReasoningDelta) request.onReasoningDelta(reason);
                }
              }));
              deltaText = parts.join('');
            }
            
            if (deltaText) {
              accumulatedText += deltaText;
              if (request.onTextDelta) request.onTextDelta(deltaText);
            }
          } catch (parseErr) {
            // Don't log as error for expected non-JSON lines like "event:" prefixes
            if (!trimmed.startsWith('event:') && !trimmed.startsWith('id:') && !trimmed.startsWith('retry:')) {
}
            // Skip unparseable lines instead of treating as text
          }
        }
      }

      const finalResp: OpenAIResponse = { data: accumulatedText, rawText: accumulatedText, usage: undefined, model: request.modelConfig.model, finishReason: undefined, responseId };
      console.debug('[SSE] Final streaming response:', {
        responseId,
        dataLength: accumulatedText.length,
        hasResponseId: Boolean(responseId)
      });
      updateUsage(request.modelConfig.model);
      setLastResponse(finalResp);
      return finalResp;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to stream Responses API';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [defaultConfig, updateUsage]);

  // Audio transcription using Whisper with usage tracking
  const transcribeAudio = useCallback(async (request: AudioTranscriptionRequest): Promise<OpenAIResponse> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Determine appropriate filename based on MIME type
      let filename = 'audio.webm';
      if (request.audioBlob.type.includes('mp4')) {
        filename = 'audio.m4a';
      } else if (request.audioBlob.type.includes('wav')) {
        filename = 'audio.wav';
      } else if (request.audioBlob.type.includes('mp3')) {
        filename = 'audio.mp3';
      }
      
      formData.append('file', request.audioBlob, filename);
      formData.append('model', request.modelConfig?.model || 'whisper-1');
      
      if (request.language) {
        formData.append('language', request.language);
      }
      
      if (request.responseFormat) {
        formData.append('response_format', request.responseFormat);
      }

      const response = await makeAPICall<OpenAIResponse>('/audio/transcriptions', {
        method: 'POST',
        body: formData,
      });

      // Track usage (Whisper doesn't return token usage, estimate based on audio duration)
      const modelUsed = request.modelConfig?.model || 'whisper-1';
      updateUsage(modelUsed);

      setLastResponse(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to transcribe audio';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeAPICall, updateUsage]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return {
    loading,
    error,
    lastResponse,
    analyzeText,
    analyzeVision,
    respond,
    respondStream,
    transcribeAudio,
    resetError,
    clearResponse,
    logUsageSummary,
    apiUsage
  };
};

// Global monitoring functions for external access
declare global {
  interface Window {
    openaiMonitor: {
      logAllUsage: () => void;
      resetUsage: () => void;
      getUsageReport: () => string;
    };
  }
}

// Expose monitoring functions globally
if (typeof window !== 'undefined') {
  window.openaiMonitor = {
    logAllUsage: () => {
      console.group('🌍 [Global OpenAI Monitor] All API Usage');
console.groupEnd();
    },
    resetUsage: () => {
},
    getUsageReport: () => {
      return `
📊 OpenAI API Monitoring Report
==============================
⏰ Generated: ${new Date().toISOString()}
📝 Note: This shows combined usage across all active useOpenAI instances
🔍 For detailed per-instance logs, check browser console
💡 Use individual hook.logUsageSummary() for specific instance data
      `;
    }
  };

  // Log usage every 5 minutes (optional - can be disabled)
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
}, 5 * 60 * 1000); // 5 minutes
  }
} 
