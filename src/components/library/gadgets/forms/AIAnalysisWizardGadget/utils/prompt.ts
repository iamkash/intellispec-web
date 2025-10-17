/** Utilities for preparing LLM prompts in a safe, testable way. */

export function fillTemplate(template: string, vars: Record<string, unknown>): string {
  if (!template) return '';
  let out = String(template);
  for (const [key, value] of Object.entries(vars)) {
    const safe = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    const re = new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, 'g');
    out = out.replace(re, safe);
  }
  return out;
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Coerces values for form fields based on a simple type hint.
 * Supported: number, array (checkbox_group/multi-select), string (default), date passthrough.
 */
export function coerceFieldValue(type: string, value: unknown, allowedOptions?: string[]): unknown {
  const t = String(type || '').toLowerCase();
  if (t === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  if (t === 'checkbox_group' || t === 'multi-select') {
    const arr = Array.isArray(value) ? value : (value == null ? [] : [value]);
    return arr.map(v => String(v));
  }
  if (t === 'radio' || t === 'dropdown' || t === 'select') {
    // Handle object values from AI (e.g., {label: "API 510", value: "API 510"})
    let s: string;
    if (typeof value === 'object' && value !== null && (value as any).value) {
      s = String((value as any).value);
    } else {
      s = String(value ?? '');
    }
    
    if (!allowedOptions || allowedOptions.length === 0) return s;
    
    // Check if the value matches any of the allowed options (by value)
    const optionValues = allowedOptions.map((opt: any) => 
      typeof opt === 'object' && opt.value ? opt.value : opt
    );
    
    return optionValues.includes(s) ? s : undefined;
  }
  if (t === 'date') return String(value ?? '');
  return value == null ? '' : String(value);
}

/**
 * Common prompt builder: auto-populates {{var}} from metadata-provided mapping paths
 * or from the provided context object. Supports dotted paths in mapping values.
 */
export type PromptBuildOptions = {
  // Optional mapping from placeholder -> dotted path in context
  mapping?: Record<string, string>;
  // Context bag providing data to resolve variables (wizardData, sections, etc.)
  context: Record<string, any>;
  // Optional fallback resolvers for well-known vars
  resolvers?: Record<string, (ctx: Record<string, any>) => unknown>;
};

export function buildPromptText(template: string, opts: PromptBuildOptions): string {
  if (!template) return '';
  const vars = collectTemplateVars(template);
  const outVars: Record<string, unknown> = {};
  for (const key of vars) {
    const fromMap = opts.mapping?.[key];
    let value: unknown;
    if (fromMap) {
      value = getByPath(opts.context, fromMap);
    } else {
      // Try direct dotted/bracket path resolution from the placeholder itself
      const direct = getByPath(opts.context, key);
      if (direct !== undefined) {
        value = direct;
      } else if (key in opts.context) {
        value = opts.context[key];
      } else if (opts.resolvers && key in opts.resolvers) {
        value = opts.resolvers[key](opts.context);
      } else {
        value = '';
      }
    }
    outVars[key] = value;
  }
  return fillTemplate(template, outVars);
}

function collectTemplateVars(template: string): string[] {
  const regex = /\{\{\s*([-\\[\]a-zA-Z0-9_.'"]+)\s*\}\}/g;
  const keys = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(template))) keys.add(m[1]);
  return Array.from(keys);
}

function getByPath(obj: any, path: string | undefined): unknown {
  if (!obj || !path) return undefined;
  const parts = toPathParts(String(path));
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const isIndex = /^\d+$/.test(p);
    cur = isIndex ? cur[Number(p)] : cur[p];
  }
  return cur;
}

function toPathParts(path: string): string[] {
  // Convert bracket notation to dot notation: a[0].b['c'] => a.0.b.c
  const normalized = path
    .replace(/\[\s*(["'])(.*?)\1\s*\]/g, '.$2') // ['key'] or ["key"]
    .replace(/\[\s*(\d+)\s*\]/g, '.$1'); // [0]
  return normalized.split('.').filter(Boolean);
}
