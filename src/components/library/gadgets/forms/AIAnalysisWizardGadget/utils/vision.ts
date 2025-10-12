/**
 * Utilities related to AI Vision prompt normalization.
 * These helpers are framework-agnostic and safe to unit test.
 */

export type VisionPromptConfig = {
  title?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  modelConfig: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  promptConfig: {
    systemPrompt?: string;
    userPrompt?: string;
  };
  streaming?: {
    enabled?: boolean;
    showProgress?: boolean;
    updateInterval?: number;
  };
};

/**
 * Normalizes heterogeneous prompt metadata shapes into a stable VisionPromptConfig.
 * Accepts multiple naming conventions (snake_case, camelCase, and flat roots).
 */
export function normalizeVisionPromptConfig(input: unknown): VisionPromptConfig | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const src = input as Record<string, unknown>;

  const pick = (o: Record<string, unknown>, ...keys: string[]) => {
    const key = keys.find(k => Object.prototype.hasOwnProperty.call(o, k));
    return key ? o[key] : undefined;
  };

  const modelRoot = pick(src, 'modelConfig', 'model_config', 'model');
  const promptRoot = pick(src, 'promptConfig', 'prompt_config');
  const title = pick(src, 'title');
  const heroTitle = pick(src, 'heroTitle', 'hero_title');
  const heroSubtitle = pick(src, 'heroSubtitle', 'hero_subtitle');
  const streamingRoot = pick(src, 'streaming');

  const modelConfigSrc = (typeof modelRoot === 'object' && modelRoot !== null)
    ? (modelRoot as Record<string, unknown>)
    : { model: String(modelRoot || '') };

  const coerceModel = (m: Record<string, unknown>) => ({
    model: String(pick(m, 'model') || ''),
    temperature: toNum(pick(m, 'temperature')),
    maxTokens: toNum(pick(m, 'maxTokens', 'max_tokens')),
    topP: toNum(pick(m, 'topP', 'top_p')),
    frequencyPenalty: toNum(pick(m, 'frequencyPenalty', 'frequency_penalty')),
    presencePenalty: toNum(pick(m, 'presencePenalty', 'presence_penalty')),
  });

  const prompts = (typeof promptRoot === 'object' && promptRoot !== null)
    ? (promptRoot as Record<string, unknown>)
    : src;

  const promptConfig = {
    systemPrompt: String(pick(prompts, 'systemPrompt', 'system_prompt') || ''),
    userPrompt: String(pick(prompts, 'userPrompt', 'user_prompt') || ''),
  };

  const streamingConfig = (typeof streamingRoot === 'object' && streamingRoot !== null)
    ? {
        enabled: Boolean(pick(streamingRoot as Record<string, unknown>, 'enabled')),
        showProgress: Boolean(pick(streamingRoot as Record<string, unknown>, 'showProgress', 'show_progress')),
        updateInterval: toNum(pick(streamingRoot as Record<string, unknown>, 'updateInterval', 'update_interval')),
      }
    : undefined;

  const finalModel = coerceModel(modelConfigSrc);
  if (!finalModel.model) {
    const direct = pick(src, 'model');
    if (direct) finalModel.model = String(direct);
  }

  return {
    title: title ? String(title) : undefined,
    heroTitle: heroTitle ? String(heroTitle) : undefined,
    heroSubtitle: heroSubtitle ? String(heroSubtitle) : undefined,
    modelConfig: finalModel,
    promptConfig,
    streaming: streamingConfig,
  };
}

function toNum(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}


