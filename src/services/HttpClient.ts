/**
 * HTTP Client Service
 * 
 * Centralized HTTP client for all API calls with automatic:
 * - JWT authentication injection
 * - Tenant ID header injection
 * - API URL resolution (relative to absolute)
 * - Error handling
 * - Request/response logging
 * 
 * Architecture Patterns:
 * - Singleton Pattern: Single instance shared across app
 * - Interceptor Pattern: Automatic header injection
 * - Factory Pattern: Different request methods (get, post, put, delete)
 * - Strategy Pattern: Different auth strategies (JWT, API key, etc.)
 * 
 * Usage:
 * ```typescript
 * import { httpClient } from '@/services/HttpClient';
 * 
 * // GET request
 * const response = await httpClient.get('/api/documents?type=company');
 * const data = await response.json();
 * 
 * // POST request
 * const response = await httpClient.post('/api/documents', {
 *   type: 'company',
 *   name: 'Acme Corp'
 * });
 * 
 * // PUT request
 * const response = await httpClient.put('/api/documents/123', {
 *   name: 'Updated Name'
 * });
 * 
 * // DELETE request
 * const response = await httpClient.delete('/api/documents/123?type=company');
 * ```
 */

import { getApiFullUrl } from '../config/api.config';

/**
 * HTTP request options
 */
export interface HttpClientOptions extends RequestInit {
  skipAuth?: boolean;        // Skip authentication headers
  skipTenantId?: boolean;    // Skip tenant ID header
  skipUserId?: boolean;      // Skip user ID header
  rawResponse?: boolean;     // Return raw Response instead of parsed data
}

/**
 * Authentication strategy interface
 */
interface AuthStrategy {
  getHeaders(): Record<string, string>;
}

/**
 * JWT Authentication Strategy
 */
class JWTAuthStrategy implements AuthStrategy {
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
}

/**
 * Tenant Context Strategy
 */
class TenantContextStrategy {
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Get tenant ID from user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const tenantId = user.tenantId || user.tenant_id || user.tenantSlug;
        if (tenantId) {
          headers['x-tenant-id'] = tenantId;
        }
        
        // Add user ID
        const userId = user.userId || user.id || user.sub;
        if (userId) {
          headers['x-user-id'] = userId;
        }
      } catch (error) {
        console.warn('[HttpClient] Failed to parse user data:', error);
      }
    }
    
    return headers;
  }
}

/**
 * HTTP Client Service (Singleton)
 */
class HttpClientService {
  private static instance: HttpClientService;
  private authStrategy: AuthStrategy;
  private tenantStrategy: TenantContextStrategy;
  
  private constructor() {
    this.authStrategy = new JWTAuthStrategy();
    this.tenantStrategy = new TenantContextStrategy();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): HttpClientService {
    if (!HttpClientService.instance) {
      HttpClientService.instance = new HttpClientService();
    }
    return HttpClientService.instance;
  }
  
  /**
   * Build headers with authentication and context
   */
  private buildHeaders(options: HttpClientOptions = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    
    // Add Content-Type for requests with body
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add authentication headers (unless skipped)
    if (!options.skipAuth) {
      Object.assign(headers, this.authStrategy.getHeaders());
    }
    
    // Add tenant and user context (unless skipped)
    if (!options.skipTenantId || !options.skipUserId) {
      Object.assign(headers, this.tenantStrategy.getHeaders());
    }
    
    return headers;
  }
  
  /**
   * Make HTTP request with automatic authentication
   */
  private async makeRequest(
    url: string,
    options: HttpClientOptions = {}
  ): Promise<Response> {
    // Resolve relative URLs to absolute using centralized config
    const resolvedUrl = getApiFullUrl(url);
    
    // Build headers with auth
    const headers = this.buildHeaders(options);
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HttpClient] ${options.method || 'GET'} ${resolvedUrl}`, {
        hasAuth: !!headers['Authorization'],
        hasTenantId: !!headers['x-tenant-id'],
        hasUserId: !!headers['x-user-id']
      });
    }
    
    // Make request
    try {
      const response = await fetch(resolvedUrl, {
        ...options,
        headers
      });
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error('[HttpClient] Authentication failed - redirecting to login');
        await this.handleAuthError(response);
      }
      
      // Handle other errors with messages
      if (!response.ok && response.status >= 400) {
        await this.handleErrorResponse(response);
      }
      
      return response;
    } catch (error) {
      console.error(`[HttpClient] Request failed: ${options.method || 'GET'} ${resolvedUrl}`, error);
      throw error;
    }
  }
  
  /**
   * Handle authentication errors
   */
  private async handleAuthError(response: Response): Promise<void> {
    // Try to get error message from response
    let errorMessage = 'Your session has expired. Please log in again.';
    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = data.error;
      }
    } catch {
      // Ignore parsing errors
    }
    
    // Show error message using Ant Design (dynamically import to avoid circular deps)
    const showErrorMessage = async () => {
      try {
        const { message } = await import('antd');
        message.error({
          content: errorMessage,
          duration: 3,
          style: { marginTop: '20vh' }
        });
      } catch {
        // Fallback to alert if Ant Design not available
        alert(errorMessage);
      }
    };
    
    await showErrorMessage();
    
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login after a short delay (so user can see the message)
    setTimeout(() => {
      if (window.location.pathname !== '/login' && 
          window.location.pathname !== '/' &&
          !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }, 1500);
  }
  
  /**
   * Handle error responses (4xx, 5xx)
   */
  private async handleErrorResponse(response: Response): Promise<void> {
    // Don't show messages for 401 (handled separately)
    if (response.status === 401) return;
    
    // Try to get error message from response
    let errorMessage = `Request failed: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = data.error;
      } else if (data.message) {
        errorMessage = data.message;
      }
    } catch {
      // Ignore parsing errors
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[HttpClient] Error response:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        url: response.url
      });
    }
  }
  
  /**
   * GET request
   */
  public async get(url: string, options: HttpClientOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'GET'
    });
  }
  
  /**
   * POST request
   */
  public async post(url: string, data?: any, options: HttpClientOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  /**
   * PUT request
   */
  public async put(url: string, data?: any, options: HttpClientOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  /**
   * PATCH request
   */
  public async patch(url: string, data?: any, options: HttpClientOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  /**
   * DELETE request
   */
  public async delete(url: string, options: HttpClientOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'DELETE'
    });
  }
  
  /**
   * Upload file (multipart/form-data)
   */
  public async upload(url: string, formData: FormData, options: HttpClientOptions = {}): Promise<Response> {
    // Don't set Content-Type header for FormData (browser sets it with boundary)
    const { headers, ...restOptions } = options;
    
    return this.makeRequest(url, {
      ...restOptions,
      method: 'POST',
      body: formData,
      headers: {
        ...(headers as Record<string, string> || {}),
        // Remove Content-Type - let browser set it
        'Content-Type': undefined as any
      }
    });
  }
}

/**
 * Export singleton instance
 */
export const httpClient = HttpClientService.getInstance();

/**
 * Export class for testing/mocking
 */
export { HttpClientService };

