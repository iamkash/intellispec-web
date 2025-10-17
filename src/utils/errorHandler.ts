/**
 * Framework-Level Error Handler
 * 
 * Provides centralized error handling for all API calls and user actions.
 * Shows user-friendly error messages and logs errors for debugging.
 */

import { message, notification } from 'antd';

/**
 * Error types
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  severity?: ErrorSeverity;
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'NETWORK_ERROR': 'Unable to connect to server. Please check your internet connection.',
  'TIMEOUT': 'Request timed out. Please try again.',
  
  // Authentication errors
  'NOT_AUTHENTICATED': 'Please log in to continue.',
  'INVALID_TOKEN': 'Your session has expired. Please log in again.',
  'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
  'INSUFFICIENT_PRIVILEGES': 'You do not have permission to perform this action.',
  
  // Data errors
  'NOT_FOUND': 'The requested item was not found.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'CONFLICT': 'This item already exists or conflicts with existing data.',
  
  // Server errors
  'INTERNAL_ERROR': 'An unexpected error occurred. Please try again.',
  'DATABASE_ERROR': 'Database error occurred. Please contact support.',
  'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.',
  
  // Rate limiting
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please slow down and try again.',
  
  // Default
  'UNKNOWN': 'An unexpected error occurred. Please try again.'
};

/**
 * HTTP status code to error message mapping
 */
const STATUS_CODE_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Authentication required. Please log in.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'Conflict with existing data.',
  429: 'Too many requests. Please slow down.',
  500: 'Server error occurred. Please try again.',
  502: 'Server is temporarily unavailable.',
  503: 'Service is temporarily unavailable.',
  504: 'Request timeout. Please try again.'
};

/**
 * Error handler class
 */
class ErrorHandler {
  /**
   * Handle API response errors
   */
  async handleApiError(response: Response, context?: string): Promise<never> {
    let errorData: any = {};
    
    try {
      const text = await response.text();
      errorData = text ? JSON.parse(text) : {};
    } catch (e) {
      // Response is not JSON
    }
    
    const resolvedCode = errorData.code || `HTTP_${response.status}`;
    const fallbackMessage = ERROR_MESSAGES[resolvedCode] || STATUS_CODE_MESSAGES[response.status] || ERROR_MESSAGES.UNKNOWN;

    const error: AppError = {
      message: errorData.error || errorData.message || fallbackMessage,
      code: resolvedCode,
      statusCode: response.status,
      details: errorData.details,
      severity: this.getSeverityFromStatus(response.status)
    };
    
    this.showError(error, context);
    throw error;
  }
  
  /**
   * Handle network errors
   */
  handleNetworkError(error: Error, context?: string): never {
    const appError: AppError = {
      message: 'Unable to connect to server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      severity: 'error',
      details: error.message
    };
    
    this.showError(appError, context);
    throw appError;
  }
  
  /**
   * Handle general errors
   */
  handleError(error: any, context?: string): never {
    const resolvedCode = error.code || 'UNKNOWN';
    const fallbackMessage = ERROR_MESSAGES[resolvedCode] || ERROR_MESSAGES.UNKNOWN;
    const appError: AppError = {
      message: error.message || fallbackMessage,
      code: resolvedCode,
      statusCode: error.statusCode,
      severity: error.severity || 'error',
      details: error.details
    };
    
    this.showError(appError, context);
    throw appError;
  }
  
  /**
   * Show error to user
   */
  private showError(error: AppError, context?: string): void {
    const description = context 
      ? `${context}: ${error.message}`
      : error.message;
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Error Handler]', {
        context,
        error,
        timestamp: new Date().toISOString()
      });
    }
    
    // Show notification based on severity
    if (error.severity === 'warning') {
      notification.warning({
        message: 'Warning',
        description,
        duration: 4
      });
    } else if (error.severity === 'info') {
      notification.info({
        message: 'Information',
        description,
        duration: 3
      });
    } else {
      // Error
      notification.error({
        message: 'Error',
        description,
        duration: 5
      });
    }
    
    // Special handling for auth errors
    if (error.code === 'NOT_AUTHENTICATED' || error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }
  
  /**
   * Show success message
   */
  showSuccess(title: string, description?: string): void {
    if (description) {
      notification.success({
        message: title,
        description,
        duration: 3
      });
    } else {
      message.success(title);
    }
  }
  
  /**
   * Show loading message
   */
  showLoading(content: string): () => void {
    const hide = message.loading(content, 0);
    return hide;
  }
  
  /**
   * Get severity from HTTP status code
   */
  private getSeverityFromStatus(status: number): ErrorSeverity {
    if (status >= 500) return 'error';
    if (status === 429) return 'warning';
    if (status === 404) return 'info';
    return 'error';
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Wrapper for API calls with error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<Response>,
  context?: string
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      await errorHandler.handleApiError(response, context);
    }
    
    return await response.json();
  } catch (error: any) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      errorHandler.handleNetworkError(error, context);
    }
    throw error;
  }
}

/**
 * Hook for error boundary
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    errorHandler.handleError(error, context);
  };
  
  const showSuccess = (title: string, description?: string) => {
    errorHandler.showSuccess(title, description);
  };
  
  const showLoading = (content: string) => {
    return errorHandler.showLoading(content);
  };
  
  return {
    handleError,
    showSuccess,
    showLoading
  };
}



