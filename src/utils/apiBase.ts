/**
 * DEPRECATED: Use apiConfig from @/config/api.config.ts instead
 * 
 * This function is kept for backward compatibility but will be removed in a future version.
 * 
 * @deprecated Import { getApiBaseUrl } from '@/config/api.config' instead
 */
export const getApiBase = (): string => {
  console.warn('[apiBase.ts] DEPRECATED: Use apiConfig from @/config/api.config.ts instead');
  
  const envBase = (process.env.REACT_APP_API_BASE || '').trim();
  if (envBase) return envBase.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
};


