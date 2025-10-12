/**
 * Data Service - Framework-level HTTP service for data fetching
 * 
 * Provides a centralized way for gadgets to fetch data from APIs with
 * caching, error handling, and data transformation capabilities.
 * 
 * Note: For authenticated requests, gadgets should use BaseGadget.makeAuthenticatedFetch()
 */

export interface DataServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number; // Cache Time To Live in milliseconds
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  transform?: (data: any) => any;
  path?: string; // JSON path to extract specific data
}

export interface DataResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cached: boolean;
  timestamp: number;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export class DataService {
  private static instance: DataService;
  private config: DataServiceConfig;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(config: DataServiceConfig = {}) {
    this.config = {
      baseUrl: '',
      timeout: 30000, // 30 seconds
      retries: 3,
      cache: true,
      cacheTTL: 300000, // 5 minutes
      ...config
    };
  }

  static getInstance(config?: DataServiceConfig): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService(config);
    }
    return DataService.instance;
  }

  /**
   * Fetch data from a URL with comprehensive error handling and caching
   */
  async fetchData<T = any>(url: string, options: FetchOptions = {}): Promise<DataResponse<T>> {
    //console.log(`[DataService] Starting fetch for: ${url}`, { options });
    const fullUrl = this.buildUrl(url);
    //console.log(`[DataService] Full URL: ${fullUrl}`);
    const cacheKey = this.getCacheKey(fullUrl, options);
    
    // Check cache first
    if (options.cache !== false && this.config.cache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          data: cached,
          status: 200,
          statusText: 'OK',
          headers: {},
          cached: true,
          timestamp: Date.now()
        };
      }
    }

    // Fetch data with retries
    const maxRetries = options.retries ?? this.config.retries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        //console.log(`[DataService] Attempt ${attempt + 1} for: ${fullUrl}`);
        const response = await this.makeRequest(fullUrl, options);
        //console.log(`[DataService] Response status: ${response.status} for: ${fullUrl}`);
        const data = await this.processResponse(response, options);
        //console.log(`[DataService] Successfully processed data for: ${fullUrl}`, data);

        // Cache successful response
        if (response.ok && (options.cache !== false && this.config.cache)) {
          this.setCache(cacheKey, data);
        }

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: this.extractHeaders(response),
          cached: false,
          timestamp: Date.now()
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`[DataService] Attempt ${attempt + 1} failed for: ${fullUrl}`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`Failed to fetch data after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Extract data using JSON path (e.g., "data.items" or "response.data")
   */
  extractPath(data: any, path?: string): any {
    if (!path) return data;
    
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, data);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private buildUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.config.baseUrl}${url}`;
  }

  private getCacheKey(url: string, options: FetchOptions): string {
    return `${url}:${JSON.stringify(options)}`;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL || 300000
    });
  }

  private async makeRequest(url: string, options: FetchOptions): Promise<Response> {
    const controller = new AbortController();
    const timeout = options.timeout ?? this.config.timeout ?? 30000;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async processResponse(response: Response, options: FetchOptions): Promise<any> {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    let data: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // Extract data using path if provided
    if (options.path) {
      data = this.extractPath(data, options.path);
    }

    // Apply transformation if provided
    if (options.transform) {
      data = options.transform(data);
    }

    return data;
  }

  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const dataService = DataService.getInstance();

// Utility function for simple data fetching
export async function fetchData<T = any>(url: string, options?: FetchOptions): Promise<T> {
  const response = await dataService.fetchData<T>(url, options);
  return response.data;
} 