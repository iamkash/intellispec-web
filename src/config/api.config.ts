/**
 * Centralized API Configuration
 * 
 * Single source of truth for all API endpoints and base URLs.
 * This prevents port mismatch issues and configuration drift.
 * 
 * Usage:
 *   import { apiConfig } from '@/config/api.config';
 *   const response = await fetch(apiConfig.getFullUrl('/api/inspections'));
 */

interface ApiConfig {
  baseUrl: string;
  port: number;
  protocol: string;
  timeout: number;
}

class ApiConfigManager {
  private config: ApiConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
    this.logConfiguration();
  }

  /**
   * Load API configuration from multiple sources (priority order):
   * 1. Environment variables (build-time)
   * 2. Runtime detection (development)
   * 3. Fallback defaults
   */
  private loadConfig(): ApiConfig {
    // Priority 1: Check environment variables (from .env or build process)
    const envApiUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL;
    
    if (envApiUrl) {
      try {
        const url = new URL(envApiUrl);
        return {
          baseUrl: envApiUrl.replace(/\/$/, ''), // Remove trailing slash
          port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
          protocol: url.protocol.replace(':', ''),
          timeout: 30000
        };
      } catch (e) {
        console.warn('[API Config] Invalid REACT_APP_API_BASE, falling back to defaults');
      }
    }

    // Priority 2: Runtime detection for development
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
      
      if (isDevelopment) {
        // Development: API runs on port 4000
        return {
          baseUrl: `http://localhost:4000`,
          port: 4000,
          protocol: 'http',
          timeout: 30000
        };
      }
      
      // Production: API is on same domain (reverse proxy)
      return {
        baseUrl: window.location.origin,
        port: parseInt(window.location.port) || 443,
        protocol: window.location.protocol.replace(':', ''),
        timeout: 30000
      };
    }

    // Priority 3: SSR/build-time fallback
    return {
      baseUrl: 'http://localhost:4000',
      port: 4000,
      protocol: 'http',
      timeout: 30000
    };
  }

  /**
   * Validate configuration and warn about potential issues
   */
  private validateConfig(): void {
    const { baseUrl, port } = this.config;

    // Check for common misconfigurations
    if (port === 4001) {
      console.error(
        '[API Config] ⚠️  WARNING: API port is 4001, but the server typically runs on 4000. ' +
        'Check your .env file or proxy configuration.'
      );
    }

    if (baseUrl.includes('4001')) {
      console.error(
        '[API Config] ⚠️  ERROR: API base URL contains port 4001. This is incorrect! ' +
        'The API server runs on port 4000. Update REACT_APP_API_BASE in your .env file.'
      );
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch (e) {
      console.error(`[API Config] ⚠️  Invalid base URL: ${baseUrl}`);
    }

    this.initialized = true;
  }

  /**
   * Log configuration on initialization (development only)
   */
  private logConfiguration(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Config] ✅ API Configuration loaded:', {
        baseUrl: this.config.baseUrl,
        port: this.config.port,
        protocol: this.config.protocol,
        source: process.env.REACT_APP_API_BASE ? 'environment' : 'auto-detected'
      });
    }
  }

  /**
   * Get the base URL for API requests
   */
  public getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get the full URL for a given path
   * Handles both relative paths (/api/...) and absolute URLs
   * 
   * IMPORTANT: Only API paths (/api/*) are converted to absolute URLs.
   * Other paths (like /data/*) remain relative to serve from frontend.
   */
  public getFullUrl(path: string): string {
    // Handle absolute URLs - check if they point to frontend origin
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const url = new URL(path);
        
        // If it's pointing to the frontend dev server (e.g., http://localhost:3000/api/*)
        // and it's an API path, redirect to API server instead
        if (typeof window !== 'undefined' && url.origin === window.location.origin) {
          const pathname = url.pathname;
          if (pathname.startsWith('/api/')) {
            // Extract the path and reconstruct with API server
            const apiUrl = new URL(pathname + url.search, this.config.baseUrl);
            return apiUrl.toString();
          }
        }
        
        // Otherwise, return absolute URL as-is
        return path;
      } catch (e) {
        // Invalid URL, treat as relative path
        console.warn('[API Config] Invalid URL:', path);
      }
    }

    // Check if this is an API path that should point to API server
    const isApiPath = path.startsWith('/api/') || path.startsWith('api/');
    
    // For API paths, convert to absolute URL pointing to API server
    if (isApiPath) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${this.config.baseUrl}${cleanPath}`;
    }

    // For non-API paths (like /data/*, /images/*, etc.), keep them relative
    // These will be served by the frontend dev server or CDN
    return path;
  }

  /**
   * Get the API port
   */
  public getPort(): number {
    return this.config.port;
  }

  /**
   * Get the request timeout
   */
  public getTimeout(): number {
    return this.config.timeout;
  }

  /**
   * Test if the API is reachable
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.getFullUrl('/api/health'), {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.error('[API Config] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get configuration for debugging
   */
  public getDebugInfo(): object {
    return {
      initialized: this.initialized,
      config: this.config,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        REACT_APP_API_BASE: process.env.REACT_APP_API_BASE,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL
      },
      window: typeof window !== 'undefined' ? {
        origin: window.location.origin,
        hostname: window.location.hostname,
        port: window.location.port
      } : 'N/A (SSR)'
    };
  }
}

// Export singleton instance
export const apiConfig = new ApiConfigManager();

// Export helper functions for convenience
export const getApiBaseUrl = () => apiConfig.getBaseUrl();
export const getApiFullUrl = (path: string) => apiConfig.getFullUrl(path);
export const getApiPort = () => apiConfig.getPort();

// Development helper: expose to window for debugging
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__API_CONFIG__ = apiConfig;
  console.log('[API Config] Debug info available at: window.__API_CONFIG__.getDebugInfo()');
}

